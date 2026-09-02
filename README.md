# ERP Diabolical

Sistema de gestión interna de Diabolical Services: CRM, cotizaciones, inventario,
compras, finanzas y métricas.

Especificación funcional: [`docs/PRD_Diabolical_Core.md`](docs/PRD_Diabolical_Core.md).

---

## Estructura

```
erp-diabolical/
├── backend/           API Express + MongoDB   → erp-back.diabolicalservices.tech
├── frontend/          SPA React + Vite + TS   → erp.diabolicalservices.tech
└── docs/              PRD y material de referencia
```

Cada aplicación es autónoma: tiene su propio `package.json`, `Dockerfile` y ciclo
de despliegue. **No hay `package.json` en la raíz** — instalar desde ahí rompe la
resolución de dependencias del frontend.

### Backend

```
backend/src/
├── config/       Conexión a MongoDB, constantes compartidas y valores por defecto
├── events/       Bus de eventos (EventEmitter) del ciclo de vida de un trato
├── listeners/    Suscriptores: la cadena de cierre de trato vive aquí
├── middleware/   auth (JWT), verifyRole (RBAC), rate limiting, saneado, errores
├── models/       Esquemas de Mongoose
├── routes/       Endpoints HTTP
│   └── factory/  crudRouter: genera los routers CRUD estándar
├── services/     Integraciones salientes (webhookDispatcher hacia n8n)
└── utils/        asyncHandler, clases de error, generador de folios atómico
```

### Frontend

```
frontend/src/
├── assets/       Logotipos y tipografías
├── components/
│   ├── ui/       Primitivos compartidos: Modal, Field, Badge, Button, ...
│   ├── layout/   Sidebar, SplashScreen
│   ├── Common/   ModuleTutorial
│   └── <Módulo>/ Un directorio por módulo de negocio
├── context/      AppContext: sesión, tema y estado de datos
├── lib/          Utilidades puras (formato de moneda, fechas, texto)
├── pages/        Vistas de ruta completa (Dashboard, Login, PublicQuoteViewer)
├── routes/       ProtectedRoute
├── services/     Cliente axios y definición de endpoints
└── styles/       tokens.css → components.css → modules.css
```

---

## Puesta en marcha

Requisitos: Node.js 20+ y una instancia de MongoDB.

```bash
cd backend && npm install && cp .env.example .env   # completa las variables
npm run seed                                        # crea el usuario admin
npm run dev
```

```bash
cd frontend && npm install && cp .env.example .env
npm run dev                                         # http://localhost:5173
```

---

## Variables de entorno

### `backend/.env`

| Variable | Obligatoria | Descripción |
|---|---|---|
| `MONGODB_URI` | Sí | Cadena de conexión. El proceso no arranca sin ella. |
| `JWT_SECRET` | Sí | Clave de firma. Mínimo 32 caracteres aleatorios. |
| `PORT` | No | Puerto de escucha (por defecto `5000`). |
| `NODE_ENV` | No | En `production` no se exponen trazas de error. |
| `FRONTEND_URL` | No | Único origen externo aceptado por CORS. |
| `JWT_EXPIRES_IN` | No | Vigencia del token (por defecto `7d`). |
| `N8N_WEBHOOK_URL` | No | Destino de los webhooks salientes. Vacío = desactivados. |
| `N8N_INBOUND_SECRET` | **Sí, si se usa n8n** | Secreto compartido del webhook de entrada. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | No | Credenciales iniciales del `npm run seed`. |

### `frontend/.env`

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API, **incluyendo el sufijo `/api`**. |

---

## Integración con n8n

**Salida** — el backend notifica eventos a `N8N_WEBHOOK_URL` a través de
`services/webhookDispatcher.js`. Payload:

```json
{ "event": "deal.closed", "timestamp": "ISO-8601", "data": { } }
```

Eventos emitidos: `deal.closed`, `quote.sent`.

**Entrada** — `POST /api/customers/webhook/n8n` da de alta un cliente. Requiere
la cabecera `x-webhook-secret` con el valor de `N8N_INBOUND_SECRET`; sin ella
responde `401`. Configura esa cabecera en el nodo HTTP Request de n8n.

---

## Roles y permisos (PRD §5)

Definidos en `backend/src/config/constants.js`, que es la fuente única: el
frontend los consume vía `GET /api/roles` en lugar de mantener una copia.

| Rol | Acceso |
|---|---|
| `admin` | Todo, incluida la configuración y la gestión de usuarios. |
| `vendedor` | Pipeline, Clientes, Cotizaciones. |
| `almacen` | Inventario, Compras. |
| `finanzas` | CxC, CxP, Métricas, Clientes. |

El menú lateral y las rutas del frontend filtran por rol para no ofrecer módulos
que la API rechazaría con `403`.

---

## Despliegue

Dokploy despliega automáticamente en cada push a `main`. Dos aplicaciones
independientes dentro del proyecto *ERP Diabolical*:

| App | Build path | Dockerfile | Dominio |
|---|---|---|---|
| `erp front` | `frontend` | `frontend/Dockerfile` | `erp.diabolicalservices.tech` |
| `erp back` | `backend` | `backend/Dockerfile` | `erp-back.diabolicalservices.tech` |

`VITE_API_URL` se inyecta como *build arg* del frontend: al ser una variable de
compilación, cambiarla exige reconstruir, no solo reiniciar.

---

## Convenciones

- **Backend**: CommonJS. Los handlers se envuelven en `asyncHandler` y lanzan
  errores de `utils/errors.js`; el manejador central traduce cada uno a su
  código HTTP. Ninguna ruta debería llevar `try/catch`.
- **Folios**: se generan con `utils/folio.js`, que usa un contador atómico.
  Nunca con `countDocuments()` — dos peticiones simultáneas producirían el mismo
  folio y violarían el índice `unique`.
- **Frontend**: los estilos van en CSS con los tokens de `styles/tokens.css`.
  Los `style={{ }}` inline se reservan para valores calculados en tiempo de
  ejecución (por ejemplo, el ancho de una barra de progreso).
- **Formato**: importar de `lib/format.ts`. No usar `toLocaleString()` suelto.
