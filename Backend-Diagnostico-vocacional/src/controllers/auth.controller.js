const bcrypt = require('bcryptjs');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Función para registrar usuarios
exports.register = async (req, res) => {
    const { cedula, password, name, role, email, telefono } = req.body;

    try {
        let exists = await User.findOne({ cedula });
        if (exists) return res.status(400).json({ msg: 'Cédula ya registrada' });
        exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ msg: 'Email ya registrado' });
        exists = await User.findOne({ telefono });
        if (exists) return res.status(400).json({ msg: 'Teléfono ya registrado' });
        const hashed = await bcrypt.hash(password, 10);

        const validRoles = ['estudiante', 'docente', 'superadmin', 'representante'];
        const assignedRole = validRoles.includes(role) ? role : 'estudiante';

        const user = await User.create({ cedula, password: hashed, name, role: assignedRole, email, telefono });

        res.status(201).json({ msg: 'Usuario creado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// Función para iniciar sesión
exports.login = async (req, res) => {
    const { cedula, password } = req.body;

    try {
        // Castear la cédula a número: bloquea inyección NoSQL (ej. { $gt: '' })
        // y garantiza que el filtro sea un valor escalar.
        const cedulaNum = Number(cedula);
        if (!Number.isFinite(cedulaNum)) {
            return res.status(400).json({ msg: 'Cédula inválida' });
        }

        // sanitizeFilter envuelve el valor en $eq como defensa en profundidad.
        const user = await User.findOne({ cedula: cedulaNum }).setOptions({ sanitizeFilter: true });
        if (!user) return res.status(400).json({ msg: 'Usuario no encontrado' });

        const valid = await bcrypt.compare(String(password ?? ''), user.password);
        if (!valid) return res.status(400).json({ msg: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '2d' }
        );

        res.json({
            token,
            user: { id: user._id, cedula: user.cedula, role: user.role, name: user.name }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

exports.identify = async (req, res) => {
    try {
        const {
            name,
            secondName,
            apellido,
            segundoApellido,
            nacionalidad,
            telefono,
            email,
            edad,
            sexo,
            fechaNacimiento,
            estado,
            municipio,
            parroquia,
            unidadEducativa,
            codigoUnidadEducativa
        } = req.body;

        const updatedData = { ...req.body };
        if (updatedData.fechaNacimiento && typeof updatedData.fechaNacimiento === 'string') {
          updatedData.fechaNacimiento = new Date(updatedData.fechaNacimiento);
        }

        const updated = await User.findOneAndUpdate(
            { cedula: req.user.cedula },
            updatedData,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ msg: 'Usuario no encontrado para la cédula proporcionada' });
        }

        res.json({ msg: 'Información actualizada correctamente', user: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || 'Error del servidor' });
    }
};

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// Crea un usuario desde la plataforma (sin pasar por el registro público).
// - superadmin: puede crear cualquier rol.
// - docente: solo puede crear estudiantes (inscripción de su matrícula).
// Si no se envía contraseña, se usa la cédula como contraseña inicial.
exports.createUser = async (req, res) => {
    try {
        const { cedula, name, apellido, email, telefono, role = 'estudiante', password, representadoId } = req.body;

        if (!cedula || !name) {
            return res.status(400).json({ msg: 'Cédula y nombre son requeridos' });
        }
        const validRoles = ['estudiante', 'docente', 'superadmin', 'representante'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ msg: 'Rol inválido' });
        }
        if (req.user.role === 'docente' && role !== 'estudiante') {
            return res.status(403).json({ msg: 'Un docente solo puede crear estudiantes' });
        }

        if (await User.findOne({ cedula })) {
            return res.status(400).json({ msg: 'Esa cédula ya está registrada' });
        }
        if (email && await User.findOne({ email })) {
            return res.status(400).json({ msg: 'Ese email ya está registrado' });
        }
        if (telefono && await User.findOne({ telefono })) {
            return res.status(400).json({ msg: 'Ese teléfono ya está registrado' });
        }

        const hashed = await bcrypt.hash(String(password || cedula), 10);
        const user = await User.create({
            cedula,
            name,
            apellido,
            // No incluir campos vacíos para respetar los índices sparse
            ...(email ? { email } : {}),
            ...(telefono ? { telefono } : {}),
            role,
            password: hashed,
        });

        if (role === 'representante' && representadoId) {
            await User.updateOne({ _id: user._id }, { $addToSet: { representados: representadoId } });
        }

        const safe = user.toObject();
        delete safe.password;
        res.status(201).json({
            msg: `Usuario creado. Contraseña inicial: ${password ? '(la indicada)' : 'su cédula'}`,
            user: safe,
        });
    } catch (err) {
        console.error('Error al crear usuario:', err);
        res.status(500).json({ msg: 'Error del servidor al crear el usuario' });
    }
};

// Importación masiva de estudiantes. Recibe un array de filas
// [{ cedula, name, apellido }]. Crea los que no existan (password = cédula),
// reutiliza los que ya existan por cédula, y reporta el resultado por fila.
// Devuelve los IDs creados/encontrados para asignarlos a una sección.
exports.importarEstudiantes = async (req, res) => {
    try {
        const { estudiantes } = req.body;
        if (!Array.isArray(estudiantes) || estudiantes.length === 0) {
            return res.status(400).json({ msg: 'Envía un array de estudiantes' });
        }
        if (req.user.role === 'docente') {
            // ok: docente solo crea estudiantes (rol forzado abajo)
        }

        const resultado = { creados: 0, existentes: 0, errores: [], ids: [] };

        for (let i = 0; i < estudiantes.length; i++) {
            const fila = estudiantes[i];
            const cedula = parseInt(fila.cedula, 10);
            const name = (fila.name || '').trim();
            const apellido = (fila.apellido || '').trim();
            const linea = i + 1;

            if (!cedula || cedula <= 0 || !name) {
                resultado.errores.push({ linea, cedula: fila.cedula, msg: 'Cédula o nombre inválido' });
                continue;
            }
            try {
                const existente = await User.findOne({ cedula });
                if (existente) {
                    resultado.existentes++;
                    resultado.ids.push(existente._id);
                    continue;
                }
                const hashed = await bcrypt.hash(String(cedula), 10);
                const nuevo = await User.create({ cedula, name, apellido, role: 'estudiante', password: hashed });
                resultado.creados++;
                resultado.ids.push(nuevo._id);
            } catch (e) {
                resultado.errores.push({ linea, cedula, msg: 'No se pudo crear (¿cédula duplicada en el archivo?)' });
            }
        }

        res.json({
            msg: `Importación: ${resultado.creados} creados, ${resultado.existentes} ya existían, ${resultado.errores.length} con error`,
            ...resultado,
        });
    } catch (err) {
        console.error('Error en importación masiva:', err);
        res.status(500).json({ msg: 'Error del servidor en la importación' });
    }
};

// Lista usuarios. Acepta filtro opcional por rol (?role=estudiante).
// Usado por el panel docente (sus estudiantes) y el superadmin (gestión).
exports.listUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const filter = {};
        if (role && ['estudiante', 'docente', 'superadmin', 'representante'].includes(role)) {
            filter.role = role;
        }
        const users = await User.find(filter).select('-password').sort({ role: 1, name: 1 });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// Cambia el rol de un usuario (solo superadmin).
exports.updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['estudiante', 'docente', 'superadmin', 'representante'].includes(role)) {
            return res.status(400).json({ msg: 'Rol inválido' });
        }
        const updated = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
        if (!updated) return res.status(404).json({ msg: 'Usuario no encontrado' });
        res.json({ msg: 'Rol actualizado', user: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// Elimina un usuario (solo superadmin).
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === req.user.id) {
            return res.status(400).json({ msg: 'No puedes eliminar tu propia cuenta' });
        }
        const deleted = await User.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ msg: 'Usuario no encontrado' });
        res.json({ msg: 'Usuario eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

exports.getUserByCedula = async (req, res) => {
    try {
        const { cedula } = req.params;
        console.log('Buscando usuario con cédula:', cedula);
        const user = await User.findOne({ cedula: Number(cedula) });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error al buscar usuario', error });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// ✅ Corrección: Esta es la función que realmente usa el frontend
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    try {
        // ✅ Solución: Convertir la cadena de fecha a un objeto Date antes de guardar
        if (updatedData.fechaNacimiento && typeof updatedData.fechaNacimiento === 'string') {
            updatedData.fechaNacimiento = new Date(updatedData.fechaNacimiento);
        }

        const updatedUser = await User.findByIdAndUpdate(id, updatedData, {
            new: true, // Devuelve el nuevo documento
            runValidators: true // Valida con el schema
        });

        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(updatedUser);
    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
}

exports.changePassword = async (req, res) => {
  const { newPassword, currentPassword } = req.body;
  const userRole = req.user.role;
  const targetId = req.params.id;
  const currentUserId = req.user.id;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ msg: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }
  try {
    let user;
    if (userRole === 'superadmin') {
      if (!targetId) {
        return res.status(400).json({ msg: 'ID del usuario es requerido' });
      }
      user = await User.findById(targetId);
      if (!user) {
        return res.status(404).json({ msg: 'Usuario no encontrado' });
      }
    } else {
      user = await User.findById(currentUserId);
      if (!user) {
        return res.status(404).json({ msg: 'Usuario no encontrado' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Contraseña actual incorrecta' });
      }
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.json({ msg: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    console.error('Error al cambiar contraseña:', err);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

// Vincula un estudiante a un representante (docente/superadmin).
exports.vincularRepresentado = async (req, res) => {
    try {
        const { estudianteId } = req.body;
        const rep = await User.findById(req.params.id);
        if (!rep || rep.role !== 'representante') return res.status(404).json({ msg: 'Representante no encontrado' });
        const est = await User.findOne({ _id: estudianteId, role: 'estudiante' });
        if (!est) return res.status(404).json({ msg: 'Estudiante no encontrado' });
        await User.updateOne({ _id: rep._id }, { $addToSet: { representados: est._id } });
        res.json({ msg: 'Representado vinculado' });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al vincular' }); }
};

// Desvincula un estudiante de un representante.
exports.desvincularRepresentado = async (req, res) => {
    try {
        await User.updateOne({ _id: req.params.id }, { $pull: { representados: req.params.estudianteId } });
        res.json({ msg: 'Representado desvinculado' });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al desvincular' }); }
};

// Actualiza la conducta de un estudiante (docente/superadmin).
exports.updateConducta = async (req, res) => {
    try {
        const { conducta } = req.body;
        const u = await User.findByIdAndUpdate(req.params.id, { conducta }, { new: true }).select('-password');
        if (!u) return res.status(404).json({ msg: 'Usuario no encontrado' });
        res.json({ msg: 'Conducta actualizada', user: u });
    } catch (err) { console.error(err); res.status(500).json({ msg: 'Error al actualizar conducta' }); }
};