const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authMiddleware = (rolesPermitidos = []) => {
  return async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ msg: 'No token, acceso denegado' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'Token mal formateado' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscamos usuario completo para usarlo luego en req.user
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

      // Validamos rol si rolesPermitidos no está vacío
      if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(user.role)) {
        return res.status(403).json({ msg: 'Acceso prohibido: no tienes permisos' });
      }

      req.user = user;
      next();
    } catch (err) {
      res.status(401).json({ msg: 'Token inválido o expirado' });
    }
  };
};

module.exports = authMiddleware;
