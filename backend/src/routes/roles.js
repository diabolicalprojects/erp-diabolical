const express = require('express');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { ROLES, ROLE_PERMISSIONS } = require('../config/constants');

// Montado en index.js detrás de `auth` + `verifyRole('admin')`, así que aquí
// no se repiten esos middlewares ni la comprobación manual de `role === admin`.
const router = express.Router();

// ─── GET roles, permisos y usuarios ───────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ roles: ROLES, permissions: ROLE_PERMISSIONS, users });
}));

// ─── PUT cambiar el rol de un usuario ─────────────────────────────────────────
router.put('/:id', asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!ROLES.includes(role)) {
    throw new BadRequestError(`Rol inválido. Debe ser uno de: ${ROLES.join(', ')}`);
  }

  // Sin esto, el último admin podría degradarse a sí mismo y dejar el sistema
  // sin nadie capaz de gestionar roles.
  if (req.user._id.equals(req.params.id) && role !== 'admin') {
    const otherAdmins = await User.countDocuments({ role: 'admin', _id: { $ne: req.user._id } });
    if (otherAdmins === 0) {
      throw new BadRequestError('No puedes quitarte el rol de admin: eres el único administrador');
    }
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) throw new NotFoundError('Usuario no encontrado');
  res.json(user);
}));

module.exports = router;
