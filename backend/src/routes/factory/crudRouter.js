const express = require('express');
const auth = require('../../middleware/auth');
const asyncHandler = require('../../utils/asyncHandler');
const { NotFoundError } = require('../../utils/errors');

/**
 * Genera un router CRUD estándar (GET / · GET /:id · POST / · PUT /:id · DELETE /:id).
 *
 * Sustituye siete routers que eran idénticos salvo por el modelo y el texto
 * del mensaje de error (inventory, purchases, vendors, projects, tasks,
 * payables, receivables).
 *
 * @param {object}   opts
 * @param {import('mongoose').Model} opts.model   Modelo de Mongoose
 * @param {string}   opts.label                   Nombre singular para los mensajes ('Proveedor')
 * @param {string}   [opts.labelPlural]           Solo para el mensaje de borrado en femenino/plural
 * @param {object}   [opts.sort={createdAt:-1}]   Orden del listado
 * @param {function} [opts.beforeCreate]          async (req) => campos extra a fusionar en el create
 * @param {function} [opts.onUpdate]              async (doc, req) => reemplaza el update por defecto
 * @param {boolean}  [opts.includeGetOne=false]   Añade GET /:id
 * @param {boolean}  [opts.protect=true]          Aplica `auth` en cada ruta.
 *                                                Ponlo en false si el router ya se monta
 *                                                detrás de `auth` en index.js (evita
 *                                                una segunda consulta del usuario por petición).
 */
const createCrudRouter = ({
  model,
  label,
  sort = { createdAt: -1 },
  beforeCreate,
  onUpdate,
  includeGetOne = false,
  protect = true
}) => {
  const router = express.Router();
  const guards = protect ? [auth] : [];
  const notFound = () => new NotFoundError(`${label} no encontrado`);

  router.get('/', ...guards, asyncHandler(async (req, res) => {
    res.json(await model.find().sort(sort));
  }));

  if (includeGetOne) {
    router.get('/:id', ...guards, asyncHandler(async (req, res) => {
      const doc = await model.findById(req.params.id);
      if (!doc) throw notFound();
      res.json(doc);
    }));
  }

  router.post('/', ...guards, asyncHandler(async (req, res) => {
    const extra = beforeCreate ? await beforeCreate(req) : {};
    res.status(201).json(await model.create({ ...req.body, ...extra }));
  }));

  router.put('/:id', ...guards, asyncHandler(async (req, res) => {
    // Se usa findById + save (y no findByIdAndUpdate) para que corran los
    // hooks pre('save') de los modelos — InventoryItem calcula ahí su `status`.
    const doc = await model.findById(req.params.id);
    if (!doc) throw notFound();

    if (onUpdate) await onUpdate(doc, req);
    else Object.assign(doc, req.body);

    await doc.save();
    res.json(doc);
  }));

  router.delete('/:id', ...guards, asyncHandler(async (req, res) => {
    const doc = await model.findByIdAndDelete(req.params.id);
    if (!doc) throw notFound();
    res.json({ message: `${label} eliminado`, id: req.params.id });
  }));

  return router;
};

module.exports = createCrudRouter;
