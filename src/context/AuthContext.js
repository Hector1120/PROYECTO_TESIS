// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = async () => {
    try {
      const response = await fetch('http://localhost:8000/verificar-sesion/', {
        method: 'GET',
        credentials: 'include', // Importante para enviar cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        setAutenticado(data.autenticado);
        setUsuario(data.usuario);
      } else {
        setAutenticado(false);
        setUsuario(null);
      }
    } catch (error) {
      console.error('Error al verificar sesión:', error);
      setAutenticado(false);
    } finally {
      setCargando(false);
    }
  };

  const login = async (correo, contraseña) => {
    try {
      const response = await fetch('http://localhost:8000/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para enviar/recibir cookies
        body: JSON.stringify({ correo, contraseña }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAutenticado(true);
        setUsuario({
          correo: data.correo,
          nombre_usuario: data.nombre_usuario,
          rol: data.rol,
          subtipo_director: data.subtipo_director || '' // Añadimos el subtipo de director
        });
        return { 
          success: true, 
          rol: data.rol,
          subtipo_director: data.subtipo_director || '' // Incluimos en el resultado para la redirección
        };
      } else {
        // Ahora manejamos diferentes tipos de errores según el status
        if (response.status === 403) {
          // Status 403 indica cuenta inactiva
          return { success: false, mensaje: data.mensaje, cuentaInactiva: true };
        } else {
          return { success: false, mensaje: data.mensaje };
        }
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      return { success: false, mensaje: 'Error de conexión con el servidor' };
    }
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:8000/logout/', {
        method: 'POST',
        credentials: 'include',
      });
      
      setAutenticado(false);
      setUsuario(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        autenticado, 
        usuario, 
        cargando,
        login,
        logout,
        verificarSesion
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);