import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: React.ReactNode;
  loading?: boolean;
  block?: boolean;
}

const Button = ({
  variant = 'primary',
  icon,
  loading = false,
  block = false,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) => (
  <button
    type="button"
    className={`btn btn--${variant}${block ? ' btn--block' : ''} ${className}`.trim()}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? <span className="btn-spinner" aria-hidden /> : icon}
    {children}
  </button>
);

export default Button;
