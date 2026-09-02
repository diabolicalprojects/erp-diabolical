import React from 'react';
import EmptyState from './EmptyState';

interface DataTableProps {
  head: React.ReactNode;
  children: React.ReactNode;
  /** Número de filas; si es 0 se muestra el estado vacío en lugar de la tabla. */
  count: number;
  emptyTitle: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
}

/**
 * Tabla con desplazamiento horizontal propio y estado vacío.
 *
 * Las tablas se envolvían de formas distintas en cada módulo: algunas con
 * `overflow-x: auto`, otras con `overflow: hidden` —que recorta el contenido
 * en pantallas estrechas en lugar de permitir desplazarlo— y ninguna mostraba
 * nada cuando no había filas.
 */
const DataTable = ({
  head, children, count,
  emptyTitle, emptyDescription, emptyIcon, emptyAction
}: DataTableProps) => {
  if (count === 0) {
    return (
      <div className="glass-card">
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>{head}</thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

export default DataTable;
