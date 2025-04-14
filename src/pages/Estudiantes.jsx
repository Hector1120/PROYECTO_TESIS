import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/PageEstudiante.css";
import logoImage from "../assets/logo_cesmag.png";
import centreLogo from "../assets/logo2.png";
import Carousel from "../components/carousel/carousel";
import { User, UserCircle, Lock } from "lucide-react";
import Perfil from "./Perfil";
import CambiarClave from "./CambiarClave";

const Estudiante = () => {
  const navigate = useNavigate();
  const { logout, usuario } = useAuth();
  const [activeSection, setActiveSection] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPerfil, setShowPerfil] = useState(false);
  const [showCambiarClave, setShowCambiarClave] = useState(false);

  useEffect(() => {
    const eliminarHorariosPasados = async () => {
      try {
        await fetch("http://localhost:8000/eliminar-horarios-pasados/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      } catch (error) {
        console.error("Error al eliminar horarios pasados:", error);
      }
    };

    eliminarHorariosPasados();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async (confirm) => {
    if (confirm) {
      await handleLogout();
    }
    setShowLogoutConfirm(false);
  };

  const handleSectionClick = (section) => {
    setActiveSection(activeSection === section ? "" : section);
    setShowPerfil(false);
    setShowCambiarClave(false);
    window.scrollTo(0, 0);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const renderSectionContent = () => {
    if (showPerfil) {
      return <Perfil />;
    }
    if (showCambiarClave) {
      return <CambiarClave />;
    }
    switch (activeSection) {
      case "gestion-usuarios":
        return (
          <div className="estudiante-section-content">
            <h2>Gestión de Usuarios</h2>
            <p>Aquí se gestionarán los usuarios.</p>
          </div>
        );
      case "gestion-horarios":
        return (
          <div className="estudiante-section-content">
            <h2>Gestión de Horarios</h2>
            <p>Aquí se gestionarán los horarios.</p>
          </div>
        );
      case "gestion-asignaturas":
        return (
          <div className="estudiante-section-content">
            <h2>Gestión de Asignaturas</h2>
            <p>Aquí se gestionarán las asignaturas.</p>
          </div>
        );
      default:
        return (
          <div className="estudiante-welcome-content">
            <Carousel />
          </div>
        );
    }
  };

  return (
    <div className="estudiante-background-image">
      <div className="estudiante-container">
        <nav className="estudiante-navbar">
          <div className="estudiante-navbar-content">
            <div className="estudiante-top-row">
              <div className="estudiante-nav-logo">
                <img
                  src={logoImage}
                  alt="Logo Cesmag"
                  className="estudiante-logo-image"
                />
              </div>
              <h1 className="estudiante-welcome-text">Bienvenido Estudiante</h1>
              <div className="estudiante-nav-centre-logo-container">
                <img
                  src={centreLogo}
                  alt="Logo Central"
                  className="estudiante-centre-logo"
                />
              </div>
            </div>
            <div className="estudiante-options-row">
              <ul className="estudiante-nav-options">
                <li>
                  <a
                    href="#"
                    onClick={() => handleSectionClick("gestion-usuarios")}
                    className={
                      activeSection === "gestion-usuarios"
                        ? "estudiante-active"
                        : ""
                    }
                  >
                    Gestionar Usuarios
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() => handleSectionClick("gestion-horarios")}
                    className={
                      activeSection === "gestion-horarios"
                        ? "estudiante-active"
                        : ""
                    }
                  >
                    Gestionar Horarios
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() => handleSectionClick("gestion-asignaturas")}
                    className={
                      activeSection === "gestion-asignaturas"
                        ? "estudiante-active"
                        : ""
                    }
                  >
                    Gestionar Asignaturas
                  </a>
                </li>
                {/* Aquí puedes agregar más opciones de menú según necesites */}
              </ul>
            </div>
          </div>
        </nav>

        <div className="estudiante-user-info">
          <p>Usuario: {usuario?.correo}</p>
          <div className="user-actions">
            <button className="user-icon-button" onClick={toggleUserMenu}>
              <User size={24} strokeWidth={2} />
            </button>
            <button
              className="estudiante-logout-button"
              onClick={confirmLogout}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
        {showUserMenu && (
          <div className="user-menu-dropdown">
            <ul>
              <li
                onClick={() => {
                  setShowPerfil(true);
                  setShowCambiarClave(false);
                  setActiveSection("");
                  setShowUserMenu(false);
                }}
              >
                <UserCircle size={20} strokeWidth={2} />
                <span>Perfil</span>
              </li>
              <li
                onClick={() => {
                  setShowCambiarClave(true);
                  setShowPerfil(false);
                  setActiveSection("");
                  setShowUserMenu(false);
                }}
              >
                <Lock size={20} strokeWidth={2} />
                <span>Cambiar Clave</span>
              </li>
            </ul>
          </div>
        )}

        <div className="estudiante-content-area">{renderSectionContent()}</div>

        {showLogoutConfirm && (
          <div className="estudiante-logout-confirmation">
            <div className="estudiante-confirmation-content">
              <img
                src={centreLogo}
                alt="Logo Central"
                className="estudiante-confirmation-logo"
              />
              <p>¿Estás seguro que quieres cerrar sesión?</p>
              <button onClick={() => handleConfirmLogout(true)}>Sí</button>
              <button onClick={() => handleConfirmLogout(false)}>No</button>
            </div>
          </div>
        )}

        <div className="estudiante-footer-bar">
          <img
            src={logoImage}
            alt="Logo Cesmag"
            className="estudiante-footer-logo"
          />
          <span className="estudiante-footer-text">
            Todos los derechos son reservados © {new Date().getFullYear()}
          </span>
          <img
            src={centreLogo}
            alt="Logo Central"
            className="estudiante-footer-logo"
          />
        </div>
      </div>
    </div>
  );
};

export default Estudiante;
