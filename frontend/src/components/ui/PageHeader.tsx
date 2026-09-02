import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Normalmente un <ModuleTutorial />. */
  aside?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Encabezado de módulo. Los diez módulos repetían esta misma estructura con
 * pequeñas divergencias de espaciado, así que ninguno se alineaba igual.
 */
const PageHeader = ({ title, subtitle, aside, actions }: PageHeaderProps) => (
  <header className="page-header">
    <div className="page-header-title">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {aside}
    </div>
    {actions && <div className="header-actions">{actions}</div>}
  </header>
);

export default PageHeader;
