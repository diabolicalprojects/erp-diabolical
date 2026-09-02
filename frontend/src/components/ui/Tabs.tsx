import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** Cifra o etiqueta corta a la derecha del texto. */
  hint?: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}

/**
 * Grupo de pestañas.
 *
 * Sustituye el patrón que había en Finanzas y en el asistente de cotizaciones:
 * botones `.btn-secondary` a los que se les pasaba un objeto de estilo inline
 * distinto según estuvieran activos, sin ningún atributo de accesibilidad.
 */
const Tabs = ({ items, active, onChange, ariaLabel }: TabsProps) => (
  <div className="tabs" role="tablist" aria-label={ariaLabel}>
    {items.map(({ id, label, icon, hint }) => (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={active === id}
        className={`tab${active === id ? ' is-active' : ''}`}
        onClick={() => onChange(id)}
      >
        {icon}
        <span>{label}</span>
        {hint !== undefined && <span className="tab-hint">{hint}</span>}
      </button>
    ))}
  </div>
);

export default Tabs;
