import React from 'react';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Mapa de estado de dominio -> tono visual.
 *
 * Antes cada módulo decidía su color con un ternario propio, así que
 * 'retrasado' era rojo en el dashboard y ámbar en Proyectos. Esta tabla es la
 * única fuente de verdad.
 */
const STATUS_TONE: Record<string, BadgeTone> = {
  // Clientes
  activo: 'success', potencial: 'info', en_pausa: 'warning', inactivo: 'neutral',
  // Cotizaciones
  draft: 'neutral', sent: 'info', accepted: 'success', rejected: 'danger',
  // Finanzas
  pendiente: 'warning', parcial: 'info', pagado: 'success', vencido: 'danger',
  // Compras
  en_transito: 'info', recibido: 'success', cancelado: 'danger',
  // Proyectos
  planeacion: 'neutral', en_curso: 'info', retrasado: 'danger', finalizado: 'success',
  // Inventario
  ok: 'success', low: 'warning', warning: 'warning', out: 'danger',
  // Tareas
  completado: 'success'
};

export const toneForStatus = (status?: string): BadgeTone =>
  STATUS_TONE[status ?? ''] ?? 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  /** Deriva el tono del estado de dominio en vez de indicarlo a mano. */
  status?: string;
}

const Badge = ({ children, tone, status }: BadgeProps) => (
  <span className={`badge badge--${tone ?? toneForStatus(status)}`}>{children}</span>
);

export default Badge;
