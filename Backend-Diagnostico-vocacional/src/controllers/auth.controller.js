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

        const validRoles = ['user', 'admin', 'moderator'];
        const assignedRole = validRoles.includes(role) ? role : 'user';

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
        const user = await User.findOne({ cedula });
        if (!user) return res.status(400).json({ msg: 'Usuario no encontrado' });

        const valid = await bcrypt.compare(password, user.password);
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
    if (userRole === 'admin' || userRole === 'moderator') {
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