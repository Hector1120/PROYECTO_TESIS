import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/PageDocente.css";
import logoImage from "../assets/logo_cesmag.png";
import centreLogo from "../assets/logo2.png";
import Carousel from "../components/carousel/carousel";
import VisualizarHorario from "../components/VisualizeHorario";
import { User, UserCircle, Lock } from "lucide-react";
import Perfil from "./Perfil";
import CambiarClave from "./CambiarClave";

const MenuDocentes = () => {
  const navigate = useNavigate();
  const { logout, usuario } = useAuth();
  const [activeSection, setActiveSection] = useState("");
  const [dia, setDia] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // Estado para la ventana emergente
  const periodo = "2025-1"; // Periodo fijo
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPerfil, setShowPerfil] = useState(false);
  const [showCambiarClave, setShowCambiarClave] = useState(false);
  const [permisoEditar, setPermisoEditar] = useState(false);
  const [permisoEliminar, setPermisoEliminar] = useState(false);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [horarios, setHorarios] = useState([]);

  // Función para validar que la diferencia entre horas sea múltiplo de 15 minutos
  const validateTimeInterval = (start, end) => {
    if (!start || !end) return true; // No validar si falta algún valor

    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const diffMinutes = endMinutes - startMinutes;

    return diffMinutes >= 15 && diffMinutes % 15 === 0;
  };

  // Eliminar horarios pasados al cargar el componente
  useEffect(() => {
    const eliminarHorariosPasados = async () => {
      try {
        await fetch("http://localhost:8000/eliminar-horarios-pasados/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Para enviar cookies de sesión
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
    setShowLogoutConfirm(true); // Mostrar la ventana emergente
  };

  const handleConfirmLogout = async (confirm) => {
    if (confirm) {
      await handleLogout(); // Cerrar sesión si se confirma
    }
    setShowLogoutConfirm(false); // Ocultar la ventana emergente
  };

  const handleRegistrarHorario = async (e) => {
    e.preventDefault();

    // Validación de intervalos de 15 minutos
    if (!validateTimeInterval(horaInicio, horaFin)) {
      alert(
        "La duración debe ser múltiplo de 15 minutos (15, 30, 45, 60 minutos, etc.)"
      );
      return;
    }

    const response = await fetch("http://localhost:8000/registrar-horario/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Para enviar cookies de sesión
      body: JSON.stringify({
        periodo,
        dia,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      alert("Horario registrado con éxito.");
      setDia("");
      setHoraInicio("");
      setHoraFin("");

      // Si estamos en la sección de visualizar horario, actualizar la vista
      if (activeSection === "visualizar-horario") {
        setActiveSection("");
        setTimeout(() => setActiveSection("visualizar-horario"), 100);
      }
    } else {
      alert(data.mensaje);
    }
  };

  // Agregar función para verificar permisos de un horario
  const verificarPermisosHorario = async (horarioId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/verificar-permisos-horario/${horarioId}/`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Error al verificar permisos");
      }

      const data = await response.json();
      setPermisoEditar(data.puede_editar);
      setPermisoEliminar(data.puede_eliminar);
    } catch (error) {
      console.error("Error al verificar permisos:", error);
      setPermisoEditar(false);
      setPermisoEliminar(false);
    }
  };

  // Función para editar un horario
  const handleEditarHorario = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8000/editar-horario/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          horario_id: horarioSeleccionado.id,
          dia: dia,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || "Error al editar el horario");
      }

      alert("Horario editado con éxito");
      setModoEdicion(false);

      // Actualizar la vista
      const updatedHorarios = horarios.map((h) => {
        if (h.horario_id === horarioSeleccionado.id) {
          return {
            ...h,
            dia: dia,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
          };
        }
        return h;
      });

      setHorarios(updatedHorarios);
    } catch (error) {
      alert(error.message);
    }
  };

  // Función para eliminar un horario
  const handleEliminarHorario = async (horarioId) => {
    if (!window.confirm("¿Está seguro que desea eliminar este horario?")) {
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/eliminar-horario/", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          horario_id: horarioId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || "Error al eliminar el horario");
      }

      alert("Horario eliminado con éxito");

      // Actualizar la vista
      const updatedHorarios = horarios.filter(
        (h) => h.horario_id !== horarioId
      );
      setHorarios(updatedHorarios);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSectionClick = (section) => {
    setActiveSection(activeSection === section ? "" : section);
    setShowPerfil(false);
    setShowCambiarClave(false);
    // Scroll to top of content area when switching sections
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
      case "registrar-horario":
        return (
          <div className="section-content horario-section">
            <div className="horario-header">
              <h2>Registrar Horario</h2>
              <div className="periodo-info">
                <span className="periodo-dates">Periodo:</span>
                <div className="periodo-badge">{periodo}</div>
                <p>
                  Fechas:{" "}
                  <span className="periodo-dates">
                    5 febrero 2025 - 30 Mayo 2025
                  </span>
                </p>
              </div>
            </div>

            <form onSubmit={handleRegistrarHorario} className="horario-form">
              <div className="form-group">
                <label htmlFor="dia">
                  <span className="label-text">Día</span>
                  <select
                    id="dia"
                    value={dia}
                    onChange={(e) => setDia(e.target.value)}
                    required
                    className="form-control"
                  >
                    <option value="">Seleccione un día</option>
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                  </select>
                </label>
              </div>

              <div className="time-inputs">
                <div className="form-group">
                  <label htmlFor="hora-inicio">
                    <span className="label-text">Hora Inicio</span>
                    <div className="time-input-wrapper">
                      <input
                        id="hora-inicio"
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                        min="07:00"
                        max="19:45"
                        step="900" // 900 segundos = 15 minutos
                        required
                        className="form-control"
                      />
                      <span className="time-icon">🕒</span>
                    </div>
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="hora-fin">
                    <span className="label-text">Hora Fin</span>
                    <div className="time-input-wrapper">
                      <input
                        id="hora-fin"
                        type="time"
                        value={horaFin}
                        onChange={(e) => setHoraFin(e.target.value)}
                        min="07:15"
                        max="20:00"
                        step="900" // 900 segundos = 15 minutos
                        required
                        className="form-control"
                      />
                      <span className="time-icon">🕒</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="horario-info">
                <div className="info-icon">ℹ️</div>
                <div className="info-text">
                  <p>
                    Este horario se aplicará a todos los{" "}
                    {dia.toLowerCase() || "días seleccionados"} del periodo
                    académico.
                  </p>
                  <p>
                    El horario debe estar entre las <strong>7:00 AM</strong> y
                    las <strong>8:00 PM</strong>.
                  </p>
                  <p>
                    La duración debe ser múltiplo de <strong>15 minutos</strong>{" "}
                    (15, 30, 45, 60 minutos, etc.).
                  </p>
                </div>
              </div>

              <button type="submit" className="submit-button">
                <span className="button-icon">✓</span>
                <span>Registrar Horario</span>
              </button>
            </form>
          </div>
        );
      case "visualizar-horario":
        return (
          <div>
            <VisualizarHorario />
          </div>
        );

      case "visualizar-materia":
        return (
          <div className="section-content">
            <h2>Visualizar Materia</h2>
            <p>Aquí se mostrarán las materias.</p>
          </div>
        );

      default:
        return (
          <div className="welcome-content">
            <Carousel />
          </div>
        );
    }
  };

  return (
    <div className="background-image">
      <div className="docente-container">
        <nav className="docente-navbar">
          <div className="docente-navbar-content">
            <div className="docente-top-row">
              <div className="docente-nav-logo">
                <img
                  src={logoImage}
                  alt="Logo Cesmag"
                  className="docente-logo-image"
                />
              </div>
              <h1 className="docente-welcome-text">Bienvenido Docente</h1>
              <div className="docente-nav-centre-logo-container">
                <img
                  src={centreLogo}
                  alt="Logo Central"
                  className="docente-centre-logo"
                />
              </div>
            </div>
            <div className="docente-options-row">
              <ul className="docente-nav-options">
                <li>
                  <a
                    href="#"
                    onClick={() => handleSectionClick("registrar-horario")}
                    className={
                      activeSection === "registrar-horario"
                        ? "docente-active"
                        : ""
                    }
                  >
                    Registrar Horario
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() => handleSectionClick("visualizar-horario")}
                    className={
                      activeSection === "visualizar-horario"
                        ? "docente-active"
                        : ""
                    }
                  >
                    Visualizar Horario
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() => handleSectionClick("visualizar-materia")}
                    className={
                      activeSection === "visualizar-materia"
                        ? "docente-active"
                        : ""
                    }
                  >
                    Visualizar Materia
                  </a>
                </li>
                {/* Aquí puedes agregar más opciones de menú según necesites */}
              </ul>
            </div>
          </div>
        </nav>

        <div className="user-info">
          <p>Usuario: {usuario?.correo}</p>
          <div className="user-actions">
            <button className="user-icon-button" onClick={toggleUserMenu}>
              <User size={24} strokeWidth={2} />
            </button>
            <button className="logout-button" onClick={confirmLogout}>
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

        <div className="content-area">{renderSectionContent()}</div>

        {/* Ventana emergente de confirmación */}
        {showLogoutConfirm && (
          <div className="logout-confirmation">
            <div className="confirmation-content">
              <img
                src={centreLogo}
                alt="Logo Central"
                className="confirmation-logo"
              />{" "}
              {/* Logo en la ventana emergente */}
              <p>¿Estás seguro que quieres cerrar sesión?</p>
              <button onClick={() => handleConfirmLogout(true)}>Sí</button>
              <button onClick={() => handleConfirmLogout(false)}>No</button>
            </div>
          </div>
        )}

        <div className="footer-bar">
          <img src={logoImage} alt="Logo Cesmag" className="footer-logo" />
          <span className="footer-text">
            Todos los derechos son reservados © {new Date().getFullYear()}
          </span>
          <img src={centreLogo} alt="Logo Central" className="footer-logo" />
        </div>
      </div>
    </div>
  );
};

export default MenuDocentes;
