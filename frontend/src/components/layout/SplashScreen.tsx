import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import LogoBlanco from '../../assets/LOGO-DIABOLICAL-CUADRADO-BLANCO.svg';

/** Margen sobre la duración de la animación (1,5 s) antes de forzar la salida. */
const FALLBACK_MS = 2500;

/**
 * Animación de entrada. Solo se muestra en la app autenticada: el visor
 * público de cotizaciones (`/propuesta/:id`) no pasa por aquí.
 *
 * `onFinish` es la única puerta hacia la aplicación, así que no puede depender
 * de un solo disparador. `onAnimationComplete` no llega a ejecutarse si la
 * pestaña está en segundo plano (el navegador congela requestAnimationFrame),
 * si el usuario tiene activado el movimiento reducido, o ante cualquier fallo
 * de la animación — y entonces la app queda inalcanzable tras una pantalla
 * negra. El temporizador garantiza la salida pase lo que pase.
 */
const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  // Evita que animación y temporizador llamen a onFinish dos veces.
  const done = useRef(false);

  const finishOnce = () => {
    if (done.current) return;
    done.current = true;
    onFinish();
  };

  useEffect(() => {
    const timer = setTimeout(finishOnce, FALLBACK_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="splash">
      <motion.div
        className="splash-mark"
        initial={{ scale: 0.5, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      >
        <img src={LogoBlanco} alt="" width={120} height={120} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="splash-text"
        >
          <h1>DIABOLICAL</h1>
          <p>AGENCIA DE SERVICIOS IA</p>
        </motion.div>
      </motion.div>

      <div className="splash-bar">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          onAnimationComplete={finishOnce}
        />
      </div>
    </div>
  );
};

export default SplashScreen;
