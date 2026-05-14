const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

const permissions = {
  admin: ['CRM', 'Clientes', 'Cotizaciones', 'Inventario', 'Compras', 'CxC', 'CxP', 'Métricas', 'Ajustes'],
  vendedor: ['CRM', 'Clientes', 'Cotizaciones'],
  almacen: ['Inventario', 'Compras'],
  finanzas: ['CxC', 'CxP', 'Métricas', 'Clientes']
};

// GET roles and permissions
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ permissions, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update user role
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden cambiar roles' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
