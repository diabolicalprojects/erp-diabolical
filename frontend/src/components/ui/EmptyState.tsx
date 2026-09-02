import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * Estado vacío. Las tablas mostraban un `<tbody>` en blanco cuando no había
 * datos, que se lee como un error de carga en lugar de "aún no hay nada".
 */
const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="empty-state">
    {icon && <div className="empty-state-icon">{icon}</div>}
    <p className="empty-state-title">{title}</p>
    {description && <p className="empty-state-desc">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
