import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Spinner from '../components/ui/Spinner';

/**
 * Exige sesión activa. Si además se pasa `roles`, exige que el rol del usuario
 * esté en la lista y redirige al dashboard cuando no lo está — el backend ya
 * devuelve 403, pero sin esto el usuario veía una pantalla rota en vez de un
 * redireccionamiento limpio.
 */
const ProtectedRoute = ({
  children,
  roles
}: {
  children: React.ReactNode;
  roles?: string[];
}) => {
  const { user, loading } = useApp();
  const location = useLocation();

  if (loading) return <Spinner fullscreen />;

  // Se recuerda el destino para volver a él tras iniciar sesión.
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
