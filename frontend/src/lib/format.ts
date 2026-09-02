/**
 * Formateadores compartidos.
 *
 * Antes cada componente hacía su propio `toLocaleString()` (23 llamadas con
 * opciones distintas), así que la misma cifra se veía diferente según la
 * pantalla. Los `Intl.*Format` se crean una sola vez: construirlos en cada
 * render es caro.
 */

const MXN = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2
});

const MXN_WHOLE = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0
});

const DATE = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

/** `$1,250.00` */
export const currency = (value?: number | null): string => MXN.format(Number(value) || 0);

/** `$1,250` — sin centavos, para tablas y tarjetas densas. */
export const currencyWhole = (value?: number | null): string => MXN_WHOLE.format(Number(value) || 0);

/**
 * Cifra abreviada para KPIs: `$1.2M`, `$45k`, `$980`.
 * El dashboard mezclaba `k` y cifras completas según el valor, con reglas
 * distintas en cada tarjeta.
 */
export const compactCurrency = (value?: number | null): string => {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return `${sign}$${Math.round(abs)}`;
};

/** `02 sep 2026`; cadena vacía si la fecha no es válida. */
export const date = (value?: string | Date | null): string => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : DATE.format(d);
};

/** `en_curso` -> `En curso` */
export const humanize = (value?: string | null): string => {
  if (!value) return '';
  const text = value.split('_').join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const percent = (part: number, whole: number): string =>
  whole > 0 ? `${((part / whole) * 100).toFixed(0)}%` : '0%';
