import React from 'react';

interface FieldProps {
  label?: string;
  value: any;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
  mono?: boolean;
  disabled?: boolean;
  hint?: string;
  icon?: React.ReactNode;
}

/**
 * Campo de formulario etiquetado.
 *
 * Los inputs se estilaban inline en 11 archivos, con paddings y radios
 * distintos en cada uno. Aquí el estilo vive en `.field-input` (index.css).
 *
 * `onChange` entrega el valor ya extraído, no el evento: era el patrón que más
 * se repetía en las llamadas.
 */
const Field = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  multiline = false,
  mono = false,
  disabled = false,
  hint,
  icon
}: FieldProps) => {
  const className = `field-input${mono ? ' field-input--mono' : ''}`;
  const shared = {
    className,
    value: value ?? '',
    placeholder,
    disabled,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value)
  };

  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}

      <span className="field-control">
        {icon && <span className="field-icon">{icon}</span>}
        {multiline
          ? <textarea {...shared} rows={3} />
          : <input {...shared} type={type} />}
      </span>

      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
};

export default Field;
