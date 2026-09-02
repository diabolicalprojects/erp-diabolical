import React from 'react';

/** Indicador de carga. `fullscreen` lo centra sobre el fondo de la app. */
const Spinner = ({ fullscreen = false }: { fullscreen?: boolean }) => (
  <div className={fullscreen ? 'spinner-screen' : 'spinner-inline'}>
    <span className="spinner" role="status" aria-label="Cargando" />
  </div>
);

export default Spinner;
