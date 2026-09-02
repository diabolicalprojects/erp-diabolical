/**
 * Constantes de dominio del frontend.
 *
 * Reflejan los enum de los esquemas de Mongoose (`backend/src/models/`). Si
 * cambian allí, hay que cambiarlas aquí: son los valores que aceptan los
 * selectores de los formularios.
 *
 * Vivían dentro de AppContext como estado del proveedor, lo que las volvía
 * invisibles para TypeScript —el contexto está tipado como `any`— y hacía que
 * quitarlas rompiera los componentes en tiempo de ejecución sin ningún aviso
 * en compilación.
 */

export const CUSTOMER_STATUSES = ['activo', 'potencial', 'en_pausa', 'inactivo'] as const;
export const PROJECT_STATUSES = ['planeacion', 'en_curso', 'retrasado', 'finalizado'] as const;
export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'rejected'] as const;
export const DEAL_STAGES = ['nuevo', 'contacto', 'propuesta', 'negociacion', 'cierre'] as const;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Etiquetas legibles. Los valores crudos (`en_pausa`) no son para mostrar. */
export const STATUS_LABELS: Record<string, string> = {
  activo: 'Activo',
  potencial: 'Potencial',
  en_pausa: 'En pausa',
  inactivo: 'Inactivo',

  planeacion: 'Planeación',
  en_curso: 'En curso',
  retrasado: 'Retrasado',
  finalizado: 'Finalizado',

  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',

  pendiente: 'Pendiente',
  parcial: 'Parcial',
  pagado: 'Pagado',
  vencido: 'Vencido',

  nuevo: 'Nuevo',
  contacto: 'Contacto',
  propuesta: 'Propuesta',
  negociacion: 'Negociación',
  cierre: 'Cierre',

  en_transito: 'En tránsito',
  recibido: 'Recibido',
  cancelado: 'Cancelado',

  completado: 'Completado'
};

export const statusLabel = (status?: string): string =>
  STATUS_LABELS[status ?? ''] ?? (status ?? '');
