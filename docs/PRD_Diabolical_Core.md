# PRD: Documento de Especificación Técnica - Handoff a Desarrollo

**Proyecto:** Plataforma Operativa Interna (Diabolical Services)
**Fecha:** Mayo 2026
**Stack Tecnológico:** MERN (MongoDB, Express, React/Next.js, Node.js) + TypeScript + Tailwind CSS
**Enfoque Arquitectónico:** API-First, Event-Driven, Modelo Agnóstico.

---

## 1. Filosofía del Sistema
El objetivo es construir un sistema de gestión centralizado que interconecte las operaciones comerciales y financieras de la agencia. 
Para mantener la agilidad operativa, el sistema se mantendrá estrictamente **agnóstico**. No buscaremos replicar la estructura rígida de un ERP tradicional; en su lugar, la arquitectura debe permitir un *workflow* basado en el descubrimiento, donde los modelos de datos (esquemas de MongoDB) puedan evolucionar y escalar conforme Diabolical sume nuevos servicios o integre soluciones de IA.

## 2. Infraestructura y Despliegue
* **Control de Versiones:** Repositorio estructurado en GitHub.
* **Entorno de Desarrollo:** El código base está optimizado para ser manejado y ejecutado desde el IDE de Antigravity.
* **CI/CD y Hosting:** El despliegue continuo se orquestará mediante Dokploy, montado sobre un VPS de Hostinger. Cada *push* a la rama de producción debe disparar la reconstrucción de los contenedores de Node.js y la *build* de Next.js.
* **Orquestación Externa:** Las automatizaciones de terceros (envío de correos, WhatsApps, creación de carpetas, etc.) **no** vivirán en este código. Se delegarán exclusivamente mediante Webhooks Salientes hacia los flujos de n8n.

---

## 3. Modelado de Datos (Esquemas Mongoose)

El diseño de la base de datos NoSQL prioriza la velocidad de lectura y la trazabilidad mediante referencias (`ObjectId`) y documentos anidados (Embedding) cuando sea necesario congelar datos históricos.

* **Colección `Clients`:**
  * Define la entidad comercial.
  * Claves: `_id`, `name`, `status` (Potencial, Activo, Inactivo), `contact_info` (Objeto).
* **Colección `Deals` (Pipeline):**
  * Claves: `_id`, `client_id` (Ref: 'Client'), `stage` (Nuevo, Contacto, Propuesta, Negociación, Cierre), `expected_revenue`.
* **Colección `Quotes` (Cotizaciones):**
  * Para mantener la inmutabilidad comercial, los ítems se anidan.
  * Claves: `_id`, `deal_id` (Ref: 'Deal'), `client_id` (Ref: 'Client'), `status` (Borrador, Enviada, Aprobada), `items` (Array de Sub-documentos con `sku`, `price`, `quantity` congelados al momento de creación), `total_amount`.
* **Colección `Inventory`:**
  * Claves: `_id`, `sku`, `name`, `current_price`, `stock_level`.
* **Colección `Finance` (Cuentas CxC / CxP):**
  * Claves: `_id`, `type` (Ingreso, Egreso), `reference_id` (Ref: 'Quote' o 'PurchaseOrder' - modelo polimórfico), `amount`, `status` (Pendiente, Pagado).

---

## 4. Lógica de Negocio y Endpoints Críticos (Workflows)

### A. Fases 1 & 2: Captación, Propuesta y Negociación
* **`PATCH /api/deals/:id/stage`**: Al mover una tarjeta en el Kanban (Pipeline) en el frontend, se actualiza el `stage`.
  * *Validación:* Si el `stage` cambia a "Propuesta", el backend debe verificar que exista al menos una cotización en estatus "Borrador" vinculada a ese `Deal`.
* **`POST /api/quotes`**: Se crea una cotización. El frontend (Next.js) consulta `GET /api/inventory` para llenar los ítems. Al guardar, el backend copia el precio actual de los ítems en el sub-documento `items` de la cotización para evitar alteraciones futuras si el catálogo cambia.

### B. Fase 3: El Evento Principal (Cierre de Trato)
Este es el gatillo de automatización del sistema. Dado que usamos Node.js, manejaremos esto a través de eventos asíncronos (`EventEmitter`) para no bloquear el ciclo de respuesta de Express.

1. El Vendedor dispara `PATCH /api/deals/:id/stage` con valor `Cierre`.
2. El controlador guarda el `Deal` y emite el evento interno `deal:closed`.
3. Un *Listener* interno procesa las siguientes acciones de forma asíncrona:
   * Cambia el estatus en la colección `Clients` de "Potencial" a "Activo".
   * Cambia el estatus en la colección `Quotes` correspondiente a "Aprobada".
   * Ejecuta un `INSERT` en la colección `Finance` (Cuentas por Cobrar) por el `total_amount` de la cotización.
   * Dispara una llamada a la API de n8n (Webhook Saliente) enviando el payload del cliente y la cotización para iniciar el *onboarding* automático.

### C. Fase 4: Inteligencia y Agregación (Métricas)
* **`GET /api/metrics/executive-summary`**: Para el Dashboard. No realizar operaciones de suma de toda la colección de finanzas en cada carga.
  * *Estrategia:* Utilizar el *Aggregation Framework* de MongoDB (`$match`, `$group`) con un límite de rango de fechas (ej. la semana actual) para calcular ingresos, costos operativos y margen bruto en tiempo real con latencias mínimas.

---

## 5. Seguridad y Control de Acceso (RBAC)

Se debe implementar protección en todas las rutas de la API utilizando JSON Web Tokens (JWT) y middlewares para validar los roles exactos definidos en la interfaz de configuración.

* **Middleware `verifyRole`:**
  * `ADMIN`: Acceso irrestricto (`*`) a todos los métodos y endpoints.
  * `VENDEDOR`: Acceso denegado (`403 Forbidden`) a los *routers* de `/api/finance`, `/api/inventory` (escritura) y métricas de costos.
  * `ALMACÉN`: Acceso denegado a CRM, Finanzas y Ventas. Permisos de CRUD solo en `/api/inventory` y `/api/purchases`.
  * `FINANZAS`: Acceso denegado a edición de Deals o Inventario. Permisos completos en `/api/finance` y reportes de rentabilidad.

---

## 6. Orquestación con n8n (Webhooks)

El backend debe contar con un servicio `WebhookDispatcher` que construya peticiones HTTP (`axios` o `fetch`) hacia las URLs de n8n proporcionadas por el equipo de operaciones.

**Ejemplo del estándar de Payload para `deal.closed`:**

```json
{
  "event": "deal.closed",
  "timestamp": "2026-05-14T10:00:00Z",
  "data": {
    "deal_id": "64b5f9e2...",
    "client": {
      "id": "64b5f9e8...",
      "name": "Cliente de Integración",
      "email": "contacto@cliente.com"
    },
    "quote": {
      "id": "64b5f9ea...",
      "total": 5500.00
    }
  }
}