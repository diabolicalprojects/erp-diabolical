import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import LogoBlanco from '../assets/LOGO-DIABOLICAL-CUADRADO-BLANCO.svg';

const Login = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
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
        style={{
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
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
            color: 'white',
            fontSize: '1.1rem',
            fontWeight: 400,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem'
          }}>DIABOLICAL</h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase'
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
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0.8rem 1rem',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: '#ef4444'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 700
            }}>Usuario / Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                style={{
                  width: '100%',
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '14px 14px 14px 42px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 700
            }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '14px 14px 14px 42px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              justifyContent: 'center',
              fontSize: '0.9rem',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'wait' : 'pointer'
            }}
          >
            {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </motion.form>

        {/* Footer */}
        <p style={{
          marginTop: '2rem',
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.05em'
        }}>
          © {new Date().getFullYear()} Diabolical Services
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
