import React from 'react';
import { motion } from 'framer-motion';
import LogoBlanco from '../../assets/LOGO-DIABOLICAL-CUADRADO-BLANCO.svg';

/**
 * Animación de entrada. Solo se muestra en la app autenticada: el visor
 * público de cotizaciones (`/propuesta/:id`) ya no espera 1.5 s antes de
 * renderizar para un cliente externo.
 */
const SplashScreen = ({ onFinish }: { onFinish: () => void }) => (
  <motion.div
    className="splash"
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.8, ease: 'easeInOut' }}
  >
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
        onAnimationComplete={onFinish}
      />
    </div>
  </motion.div>
);

export default SplashScreen;
