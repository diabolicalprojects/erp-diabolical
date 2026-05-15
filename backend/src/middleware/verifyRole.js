/**
 * verifyRole middleware — Role-Based Access Control (RBAC)
 *
 * Usage:
 *   router.get('/sensitive', auth, verifyRole('admin', 'finanzas'), handler)
 *
 * Roles defined in PRD §5:
 *   - admin      : Unrestricted access to everything
 *   - vendedor   : Denied access to /finance, /inventory (write), cost metrics
 *   - almacen    : CRUD on /inventory and /purchases only
 *   - finanzas   : Full access to /finance and profitability reports
 *
 * This middleware MUST be used AFTER the `auth` middleware so that req.user is populated.
 */
const verifyRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado — aplica middleware auth primero' });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Acceso denegado. Rol requerido: [${allowedRoles.join(', ')}]. Tu rol: ${req.user.role}`
    });
  }

  next();
};

module.exports = verifyRole;
