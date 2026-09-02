const express = require('express');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const verifyWebhookSecret = require('../middleware/verifyWebhookSecret');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const router = express.Router();

// ─── WEBHOOK DE ENTRADA (n8n) ─────────────────────────────────────────────────
// No lleva JWT porque lo llama n8n, no un usuario: se autentica con el secreto
// compartido `x-webhook-secret`. Antes estaba completamente abierto.
router.post('/webhook/n8n', verifyWebhookSecret, asyncHandler(async (req, res) => {
  const { company, name, phone, email, status } = req.body;

  if (!company && !name) {
    throw new BadRequestError('Se requiere `name` o `company`');
  }

  const customer = await Customer.create({
    name: company || name,
    contact: name,
    phone,
    email,
    status: status || 'potencial'
  });

  res.status(201).json(customer);
}));

// ─── CRUD ─────────────────────────────────────────────────────────────────────
router.get('/', auth, asyncHandler(async (req, res) => {
  res.json(await Customer.find().sort({ createdAt: -1 }));
}));

router.get('/:id', auth, asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new NotFoundError('Cliente no encontrado');
  res.json(customer);
}));

router.post('/', auth, asyncHandler(async (req, res) => {
  res.status(201).json(await Customer.create(req.body));
}));

router.put('/:id', auth, asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new NotFoundError('Cliente no encontrado');
  Object.assign(customer, req.body);
  await customer.save();
  res.json(customer);
}));

router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) throw new NotFoundError('Cliente no encontrado');
  res.json({ message: 'Cliente eliminado', id: req.params.id });
}));

module.exports = router;
