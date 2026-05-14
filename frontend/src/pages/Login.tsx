import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import LogoBlanco from '../assets/LOGO-DIABOLICAL-CUADRADO-BLANCO.svg';

// ── Error messages map ────────────────────────────────────────────────────────
const getErrorMessage = (err: any): string => {
  const status = err?.response?.status;
  const serverMsg = err?.response?.data?.error || err?.response?.data?.message;

  if (status === 401 || status === 400) {
    return 'Correo o contraseña incorrectos. Verifica tus datos e intenta nuevamente.';
  }
  if (status === 429) {
    return 'Demasiados intentos fallidos. Espera unos minutos antes de continuar.';
  }
  if (status === 403) {
    return 'Tu cuenta está desactivada. Contacta al administrador.';
  }
  if (!navigator.onLine) {
    return 'Sin conexión a internet. Revisa tu red e intenta nuevamente.';
  }
  if (serverMsg) return serverMsg;
  return 'Error al conectar con el servidor. Intenta en unos momentos.';
};

// ── Component ─────────────────────────────────────────────────────────────────
const Login = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      setAttempts(prev => prev + 1);
      // Shake animation trigger — reset password field after 3 bad attempts
      if (attempts >= 2) {
        setPassword('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ marginBottom: '3rem', textAlign: 'center' }}
        >
          <img src={LogoBlanco} alt="Diabolical" style={{ width: '80px', height: '80px', marginBottom: '1.5rem' }} />
          <h1 style={{
            color: 'white', fontSize: '1.1rem', fontWeight: 400,
            letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '0.5rem'
          }}>DIABOLICAL</h1>
          <p style={{
            color: 'var(--text-secondary)', fontSize: '0.7rem',
            letterSpacing: '0.15em', textTransform: 'uppercase'
          }}>SISTEMA ERP • ACCESO</p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          onSubmit={handleSubmit}
          style={{
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            padding: '2.5rem 2rem'
          }}
        >
          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '0.8rem 1rem',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                  fontSize: '0.83rem',
                  color: '#ef4444',
                  lineHeight: 1.4
                }}
              >
                <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email field */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{
              fontSize: '0.75rem', color: 'var(--text-secondary)',
              display: 'block', marginBottom: '8px',
              textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700
            }}>Correo electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-secondary)'
              }} />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: 'var(--glass)',
                  border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'var(--glass-border)'}`,
                  borderRadius: '12px',
                  padding: '14px 14px 14px 42px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  opacity: isLoading ? 0.6 : 1
                }}
              />
            </div>
          </div>

          {/* Password field */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              fontSize: '0.75rem', color: 'var(--text-secondary)',
              display: 'block', marginBottom: '8px',
              textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700
            }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-secondary)'
              }} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: 'var(--glass)',
                  border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'var(--glass-border)'}`,
                  borderRadius: '12px',
                  padding: '14px 46px 14px 42px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  opacity: isLoading ? 0.6 : 1
                }}
              />
              {/* Toggle show/hide password */}
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', display: 'flex',
                  alignItems: 'center', padding: '4px',
                  borderRadius: '6px', transition: 'color 0.2s'
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={isLoading || !email || !password}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              justifyContent: 'center',
              fontSize: '0.9rem',
              opacity: (isLoading || !email || !password) ? 0.5 : 1,
              cursor: (isLoading || !email || !password) ? 'not-allowed' : 'pointer',
              gap: '8px'
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                Verificando...
              </>
            ) : 'Iniciar Sesión'}
          </button>
        </motion.form>

        {/* Footer */}
        <p style={{
          marginTop: '2rem', fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em'
        }}>
          © {new Date().getFullYear()} Diabolical Services
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
