// src/pages/RecuperarContraseña.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Login.css"; 
import logo from "../assets/logo.png";
import logoCesmag from "../assets/logo_cesmag2.png";

const RecuperarContraseña = () => {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { autenticado, usuario, cargando } = useAuth();


  // Efecto para redirigir si ya está autenticado
  useEffect(() => {
    if (!cargando && autenticado && usuario) {
      // Redirigir según el rol del usuario
      if (usuario.rol === "Estudiante") {
        navigate("/estudiantes");
      } else if (usuario.rol === "Docente") {
        navigate("/docentes");
      }
    }
  }, [autenticado, usuario, cargando, navigate]);

  const handleRecuperar = async () => {
    setError("");
    setMensaje("");
    try {
      const response = await fetch("http://localhost:8000/recuperar-contraseña/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo }),
      });
  
      const data = await response.json();
      if (response.ok) {
        window.alert("Se ha enviado una nueva contraseña a tu correo institucional.");
      } else {
        window.alert(data.mensaje || "Error al recuperar la contraseña.");
      }
    } catch (error) {
      window.alert("Error de conexión con el servidor.");
    }
  };

  // Mostrar un indicador de carga mientras se verifica la sesión
  if (cargando) {
    return <div className="loading-container">Cargando...</div>;
  }

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
          {mensaje && <p className="success-message">{mensaje}</p>}
          {error && <p className="error-message">{error}</p>}
          <button className="login-button" onClick={handleRecuperar}>
            Recuperar Contraseña
          </button>
          <p className="forgot-password" onClick={() => navigate("/")}>Volver al inicio de sesión</p>
        </div>
      </div>
    </div>
  );
};

export default RecuperarContraseña;
