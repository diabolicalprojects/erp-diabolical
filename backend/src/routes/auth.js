const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { BadRequestError, UnauthorizedError } = require('../utils/errors');

const router = express.Router();

const TOKEN_TTL = process.env.JWT_EXPIRES_IN || '7d';

/** Forma pública de un usuario. Nunca incluye `password`. */
const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Email y contraseña son requeridos');
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });

  // Mismo mensaje para usuario inexistente y contraseña incorrecta: distinguirlos
  // permitiría enumerar qué correos están dados de alta.
  if (!user || !(await user.comparePassword(password))) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );

  res.json({ token, user: toPublicUser(user) });
}));

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', auth, (req, res) => {
  res.json(toPublicUser(req.user));
});

module.exports = router;
