// src/pages/login.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Login.css";
import logo from "../assets/logo.png";
import logoCesmag from "../assets/logo_cesmag2.png";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mostrarContraseña, setMostrarContraseña] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, autenticado, usuario, cargando } = useAuth();

  // Efecto para redirigir si ya está autenticado
  useEffect(() => {
    if (!cargando && autenticado && usuario) {
      // Redirigir según el rol del usuario
      if (usuario.rol === "Estudiante") {
        navigate("/estudiantes");
      } else if (usuario.rol === "Docente") {
        navigate("/docentes");
      } else if (usuario.rol === "Administrador") {
        navigate("/administracion");
      } else if (usuario.rol === "Director") {
        // Redirección según el subtipo de director
        const subtipo = usuario.subtipo_director;
        if (subtipo === "Director de Ing.Sistemas") {
          navigate("/directores/ing-sistemas");
        } else if (subtipo === "Director de Ing.Electrónica") {
          navigate("/directores/ing-electronica");
        } else if (subtipo === "Director de Humanidades") {
          navigate("/directores/humanidades");
        } else if (subtipo === "Director de Ciencias Básicas") {
          navigate("/directores/ciencias-basicas");
        } else if (subtipo === "Director de Idiomas") {
          navigate("/directores/idiomas");
        } else {
          // Si no tiene un subtipo específico o no es reconocido
          navigate("/directores");
        }
      }
    }
  }, [autenticado, usuario, cargando, navigate]);

  const handleLogin = async () => {
    setError(""); // Limpiar mensajes previos
    
    const resultado = await login(correo, contraseña);
    
    if (resultado.success) {
      if (resultado.rol === "Estudiante") {
        navigate("/estudiantes");
      } else if (resultado.rol === "Docente") {
        navigate("/docentes");
      } else if (resultado.rol === "Administrador") {
        navigate("/administracion"); 
      } else if (resultado.rol === "Director") {
        // Redirección según el subtipo de director
        const subtipo = resultado.subtipo_director;
        if (subtipo === "Director de Ing.Sistemas") {
          navigate("/directores/ing-sistemas");
        } else if (subtipo === "Director de Ing.Electrónica") {
          navigate("/directores/ing-electrónica");
        } else if (subtipo === "Director de Humanidades") {
          navigate("/directores/humanidades");
        } else if (subtipo === "Director de Ciencias Básicas") {
          navigate("/directores/ciencias-basicas");
        } else if (subtipo === "Director de Idiomas") {
          navigate("/directores/idiomas");
        } else {
          // Si no tiene un subtipo específico o no es reconocido
          navigate("/directores");
        }
      } else {
        setError("Rol no reconocido");
      }
    } else {
      alert(resultado.mensaje || "Error en el inicio de sesión");
    }
  };

  // Mostrar un indicador de carga mientras se verifica la sesión
  if (cargando) {
    return <div className="loading-container">Cargando...</div>;
  }

  // Si no está cargando y no está autenticado, mostrar el formulario de login
  return (
    <div className="login-container">
      <img src={logoCesmag} alt="Logo Cesmag" className="logo-cesmag" />
      <div className="login-box">
        <div className="logo-container">
          <img src={logo} alt="Logo Principal" className="logo" />
        </div>
        <div className="form-container">
          <input
            type="email"
            placeholder="Ingresa tu correo institucional"
            className="input-field"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
          <div className="password-container">
            <input
              type={mostrarContraseña ? "text" : "password"}
              placeholder="Ingresa tu contraseña"
              className="input-field"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setMostrarContraseña(!mostrarContraseña)}
            >
              {!mostrarContraseña ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button className="login-button" onClick={handleLogin}>
            Iniciar Sesión
          </button>
          <p className="forgot-password">
            <Link to="/recuperar-contraseña">¿Olvidaste tu contraseña?</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;