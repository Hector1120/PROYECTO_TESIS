// Perfil.jsx - Enhanced Version
import React, { useState, useEffect } from "react";
import {
  UserCircle,
  Mail,
  UserCheck,
  Clock,
  Shield,
  AlertCircle,
  Info,
} from "lucide-react";
import "../styles/PagePerfil.css";
import { useAuth } from "../context/AuthContext"; // Assuming you have an AuthContext

const Perfil = () => {
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { usuario } = useAuth(); // Get the current user from AuthContext

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        console.log("Fetching profile for user:", usuario?.correo);
        setLoading(true);

        const response = await fetch(
          "http://localhost:8000/obtener-perfil-usuario/",
          {
            method: "GET",
            credentials: "include", // Importante para enviar cookies de sesión
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`
          );
        }

        const data = await response.json();
        console.log("Profile data received:", data);
        setPerfil(data);
      } catch (err) {
        console.error("Complete error details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (usuario) {
      fetchPerfil();
    } else {
      console.warn("No user authenticated");
      setError("No hay usuario autenticado");
      setLoading(false);
    }
  }, [usuario]);

  // Format last login date
  const formatDate = (dateString) => {
    if (!dateString) return "No hay registro de sesión previa";

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="perfil-loading">
        <div className="perfil-loading-spinner"></div>
        <p>Cargando tu perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="perfil-error">
        <AlertCircle
          size={60}
          strokeWidth={1.5}
          className="perfil-error-icon"
        />
        <h3>Error al cargar el perfil</h3>
        <p>{error}</p>
        <p>Por favor, intenta recargar la página</p>
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <div className="perfil-card">
        <div className="perfil-header">
          <div className="perfil-avatar">
            <UserCircle size={80} strokeWidth={1.5} className="perfil-icon" />
          </div>
          <h2 className="perfil-title">¡Bienvenido a tu Perfil!</h2>
          <p className="perfil-subtitle">
            <Info /> Información de tu cuenta
          </p>
        </div>

        <div className="perfil-details">
          <div className="perfil-item">
            <div className="perfil-item-icon">
              <Mail size={20} strokeWidth={2} />
            </div>
            <div className="perfil-item-content">
              <span className="perfil-label">Correo Electrónico</span>
              <p className="perfil-value">{perfil.correo}</p>
            </div>
          </div>

          <div className="perfil-item">
            <div className="perfil-item-icon">
              <Shield size={20} strokeWidth={2} />
            </div>
            <div className="perfil-item-content">
              <span className="perfil-label">Rol en el Sistema</span>
              <p className="perfil-value">{perfil.rol}</p>
            </div>
          </div>

          <div className="perfil-item">
            <div className="perfil-item-icon">
              <Clock size={20} strokeWidth={2} />
            </div>
            <div className="perfil-item-content">
              <span className="perfil-label">Última Sesión</span>
              <p className="perfil-value">{formatDate(perfil.last_login)}</p>
            </div>
          </div>

          <div className="perfil-item">
            <div className="perfil-item-icon">
              <UserCheck size={20} strokeWidth={2} />
            </div>
            <div className="perfil-item-content">
              <span className="perfil-label">Estado de Cuenta</span>
              <span
                className={`perfil-status ${
                  perfil.is_active ? "status-active" : "status-inactive"
                }`}
              >
                {perfil.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
