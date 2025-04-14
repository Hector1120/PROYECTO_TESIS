// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, rolRequerido = null, subtipoRequerido = null }) => {
  const { autenticado, usuario, cargando } = useAuth();

  if (cargando) {
    return <div>Cargando...</div>;
  }

  if (!autenticado) {
    return <Navigate to="/" />;
  }

  if (rolRequerido && usuario?.rol !== rolRequerido) {
    return <Navigate to="/" />;
  }

  // Añadimos verificación de subtipo para directores
  if (rolRequerido === "Director" && subtipoRequerido && usuario?.subtipo_director !== subtipoRequerido) {
    // Si es director pero no del subtipo requerido, redirigir a la página general de directores
    return <Navigate to="/directores" />;
  }

  return children;
};

export default ProtectedRoute;