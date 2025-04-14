import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/PageAdmin.css";
import logoImage from "../assets/logo_cesmag.png";
import centreLogo from "../assets/logo2.png";
import Carousel from "../components/carousel/carousel";
import { Eye, EyeOff, Search } from "lucide-react";
import { User, UserCircle, Lock } from "lucide-react";
import Perfil from "./Perfil";
import CambiarClave from "./CambiarClave";

const Administracion = () => {
  const navigate = useNavigate();
  const { logout, usuario } = useAuth();
  const [activeSection, setActiveSection] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPerfil, setShowPerfil] = useState(false);
  const [showCambiarClave, setShowCambiarClave] = useState(false);

  const [nuevoUsuario, setNuevoUsuario] = useState({
    correo: "",
    rol: "Estudiante",
    subtipo_director: "",
    subtipo_docente: "",
  });
  const [mensajeUsuario, setMensajeUsuario] = useState("");
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [listaUsuariosFiltrada, setListaUsuariosFiltrada] = useState([]);
  const [modoGestionUsuarios, setModoGestionUsuarios] = useState("");
  const [usuarioEdicion, setUsuarioEdicion] = useState(null);
  const [filtros, setFiltros] = useState({
    correo: "",
    rol: "",
  });

  // Lista de subtipos de directores
  const subtiposDirector = [
    "Director de Ing.Sistemas",
    "Director de Ing.Electrónica",
    "Director de Humanidades",
    "Director de Idiomas",
    "Director de Ciencias Básicas",
  ];

  // Lista de subtipos de docentes
  const subtiposDocente = [
    "Docente de Ing.Sistemas",
    "Docente de Ing.Electrónica",
    "Docente de Humanidades",
    "Docente de Idiomas",
    "Docente de Ciencias Básicas",
  ];

  // Estado para controlar qué subtipos ya están en uso
  const [subtiposUsados, setSubtiposUsados] = useState({});

  // Obtener los subtipos de directores ya utilizados al cargar la página
  useEffect(() => {
    if (listaUsuarios.length > 0) {
      const usados = {};
      listaUsuarios.forEach((usuario) => {
        if (usuario.rol === "Director" && usuario.subtipo_director) {
          usados[usuario.subtipo_director] = true;
        }
      });
      setSubtiposUsados(usados);
    }
  }, [listaUsuarios]);

  const handleEditarUsuario = async (usuario) => {
    setUsuarioEdicion({ ...usuario, password: "" }); // Add password field
    setModoGestionUsuarios("editar");
    setShowPassword(false);
  };

  const handleSubmitEdicion = async (e) => {
    e.preventDefault();

    // Validate director type if role is Director
    if (usuarioEdicion.rol === "Director" && !usuarioEdicion.subtipo_director) {
      setMensajeUsuario("Debe seleccionar un tipo de director");
      setTimeout(() => {
        setMensajeUsuario("");
      }, 3000);
      return;
    }

    // Validate docente type if role is Docente
    if (usuarioEdicion.rol === "Docente" && !usuarioEdicion.subtipo_docente) {
      setMensajeUsuario("Debe seleccionar un tipo de docente");
      setTimeout(() => {
        setMensajeUsuario("");
      }, 3000);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/usuarios/${usuarioEdicion.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            correo: usuarioEdicion.correo,
            rol: usuarioEdicion.rol,
            is_active: usuarioEdicion.is_active,
            password: usuarioEdicion.password,
            subtipo_director: usuarioEdicion.subtipo_director || "", // Include subtipo_director in the request
            subtipo_docente: usuarioEdicion.subtipo_docente || "", // Include subtipo_docente in the request
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMensajeUsuario("Usuario actualizado exitosamente");
        await handleListarUsuarios();
        setModoGestionUsuarios("listar");
        setUsuarioEdicion(null);
      } else {
        setMensajeUsuario(data.mensaje || "Error al actualizar usuario");
      }

      setTimeout(() => {
        setMensajeUsuario("");
      }, 3000);
    } catch (error) {
      setMensajeUsuario("Error de conexión");
      console.error("Error:", error);
      setTimeout(() => {
        setMensajeUsuario("");
      }, 3000);
    }
  };

  const handleEliminarUsuario = async (usuario) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de eliminar el usuario ${usuario.correo}?`
    );

    if (confirmacion) {
      try {
        const response = await fetch(
          `http://localhost:8000/usuarios/${usuario.id}/`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (response.ok) {
          setMensajeUsuario("Usuario eliminado exitosamente");
          await handleListarUsuarios();
        } else {
          setMensajeUsuario(data.mensaje || "Error al eliminar usuario");
        }

        setTimeout(() => {
          setMensajeUsuario("");
        }, 3000);
      } catch (error) {
        setMensajeUsuario("Error de conexión");
        console.error("Error:", error);
        setTimeout(() => {
          setMensajeUsuario("");
        }, 3000);
      }
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value,
    });
  };

  const aplicarFiltros = () => {
    let usuariosFiltrados = [...listaUsuarios];

    // Filtrar por correo
    if (filtros.correo) {
      usuariosFiltrados = usuariosFiltrados.filter((usuario) =>
        usuario.correo.toLowerCase().includes(filtros.correo.toLowerCase())
      );
    }

    // Filtrar por rol
    if (filtros.rol) {
      usuariosFiltrados = usuariosFiltrados.filter(
        (usuario) => usuario.rol === filtros.rol
      );
    }

    setListaUsuariosFiltrada(usuariosFiltrados);
  };

  // Aplicar filtros cada vez que cambian los filtros o la lista de usuarios
  useEffect(() => {
    aplicarFiltros();
  }, [filtros, listaUsuarios]);

  const limpiarFiltros = () => {
    setFiltros({
      correo: "",
      rol: "",
    });
  };

  const renderListaUsuarios = () => {
    return (
      <div className="admin-users-list-container">
        <div className="admin-search-form">
          <h3>Filtrar Usuarios</h3>
          <div className="admin-search-fields">
            <div className="admin-form-group">
              <label htmlFor="filtroCorreo">Correo:</label>
              <div className="admin-search-input">
                <input
                  type="text"
                  id="filtroCorreo"
                  name="correo"
                  value={filtros.correo}
                  onChange={handleFiltroChange}
                  placeholder="Buscar por correo"
                />
                <Search size={20} className="admin-search-icon" />
              </div>
            </div>
            <div className="admin-form-group">
              <label htmlFor="filtroRol">Rol:</label>
              <select
                id="filtroRol"
                name="rol"
                value={filtros.rol}
                onChange={handleFiltroChange}
              >
                <option value="">Todos los roles</option>
                <option value="Estudiante">Estudiante</option>
                <option value="Docente">Docente</option>
                <option value="Administrador">Administrador</option>
                <option value="Director">Director</option>
              </select>
            </div>
            <button
              type="button"
              className="admin-clear-filter"
              onClick={limpiarFiltros}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        <div className="admin-users-table-container">
          <p>Total de usuarios mostrados: {listaUsuariosFiltrada.length}</p>
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Tipo Director</th>
                <th>Tipo Docente</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listaUsuariosFiltrada.length > 0 ? (
                listaUsuariosFiltrada.map((usuarioItem) => (
                  <tr key={usuarioItem.id}>
                    <td>{usuarioItem.id}</td>
                    <td>{usuarioItem.correo}</td>
                    <td>{usuarioItem.rol}</td>
                    <td>{usuarioItem.subtipo_director || "-"}</td>
                    <td>{usuarioItem.subtipo_docente || "-"}</td>
                    <td>
                      <span
                        className={`${
                          usuarioItem.is_active
                            ? "admin-status-activo"
                            : "admin-status-inactivo"
                        }`}
                      >
                        {usuarioItem.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          className="admin-edit-button"
                          onClick={() => handleEditarUsuario(usuarioItem)}
                          title="Editar Usuario"
                        >
                          ✏️
                        </button>
                        <button
                          className="admin-delete-button"
                          onClick={() => handleEliminarUsuario(usuarioItem)}
                          title="Eliminar Usuario"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="admin-no-results">
                    No se encontraron usuarios con los filtros aplicados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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
    setModoGestionUsuarios("");
    setActiveSection(activeSection === section ? "" : section);
    setShowPerfil(false);
    setShowCambiarClave(false);
    window.scrollTo(0, 0);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setMensajeUsuario("");

    // Validar si el usuario seleccionó un subtipo de director cuando es requerido
    if (nuevoUsuario.rol === "Director" && !nuevoUsuario.subtipo_director) {
      setMensajeUsuario("Debe seleccionar un tipo de director");
      setTimeout(() => {
        setMensajeUsuario("");
      }, 3000);
      return;
    }

    // Validar si el usuario seleccionó un subtipo de docente cuando es requerido
    if (nuevoUsuario.rol === "Docente" && !nuevoUsuario.subtipo_docente) {
      setMensajeUsuario("Debe seleccionar un tipo de docente");
      setTimeout(() => {
        setMensajeUsuario("");
      }, 3000);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/crear-usuario/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(nuevoUsuario),
      });

      const data = await response.json();

      if (response.ok) {
        setMensajeUsuario(
          `Usuario creado exitosamente. Contraseña enviada a ${nuevoUsuario.correo}`
        );
        setNuevoUsuario({
          correo: "",
          rol: "Estudiante",
          subtipo_director: "",
          subtipo_docente: "",
        });
        // Actualizar la lista de usuarios en segundo plano, pero NO cambiar el modo
        fetch("http://localhost:8000/usuarios/", {
          method: "GET",
          credentials: "include",
        })
          .then((response) => response.json())
          .then((data) => {
            if (response.ok) {
              setListaUsuarios(data);
              setListaUsuariosFiltrada(data);
            }
          })
          .catch((error) => console.error("Error actualizando lista:", error));

        setTimeout(() => {
          setMensajeUsuario("");
        }, 3000);
      } else {
        setMensajeUsuario(data.mensaje || "Error al crear usuario");
        setTimeout(() => {
          setMensajeUsuario("");
        }, 3000);
      }
    } catch (error) {
      setMensajeUsuario("Error de conexión");
      console.error("Error:", error);
      setTimeout(() => {
        setMensajeUsuario("");
      }, 3000);
    }
  };

  const handleListarUsuarios = async () => {
    try {
      const response = await fetch("http://localhost:8000/usuarios/", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        // Asegurarse de que cada usuario tenga las propiedades subtipo_director y subtipo_docente
        const usuariosCompletos = data.map((usuario) => ({
          ...usuario,
          subtipo_director: usuario.subtipo_director || "", // Asegura que siempre exista la propiedad
          subtipo_docente: usuario.subtipo_docente || "", // Asegura que siempre exista la propiedad
        }));

        setListaUsuarios(usuariosCompletos);
        setListaUsuariosFiltrada(usuariosCompletos);
        setModoGestionUsuarios("listar");

        // Actualizar los subtipos de directores ya utilizados
        const usados = {};
        usuariosCompletos.forEach((usuario) => {
          if (usuario.rol === "Director" && usuario.subtipo_director) {
            usados[usuario.subtipo_director] = true;
          }
        });
        setSubtiposUsados(usados);
      } else {
        setMensajeUsuario("Error al obtener la lista de usuarios");
        setTimeout(() => {
          setMensajeUsuario("");
        }, 3000);
      }
    } catch (error) {
      setMensajeUsuario("Error de conexión");
      console.error("Error:", error);
      setTimeout(() => {
        setMensajeUsuario("");
      }, 3000);
    }
  };

  const handleRolChange = (e) => {
    const nuevoRol = e.target.value;
    setNuevoUsuario({
      ...nuevoUsuario,
      rol: nuevoRol,
      subtipo_director:
        nuevoRol !== "Director" ? "" : nuevoUsuario.subtipo_director,
      subtipo_docente:
        nuevoRol !== "Docente" ? "" : nuevoUsuario.subtipo_docente,
    });
  };

  const handleSubtipoDirectorChange = (e) => {
    setNuevoUsuario({
      ...nuevoUsuario,
      subtipo_director: e.target.value,
    });
  };

  const handleSubtipoDocenteChange = (e) => {
    setNuevoUsuario({
      ...nuevoUsuario,
      subtipo_docente: e.target.value,
    });
  };

  const handleUsuarioEdicionRolChange = (e) => {
    const nuevoRol = e.target.value;
    setUsuarioEdicion({
      ...usuarioEdicion,
      rol: nuevoRol,
      subtipo_director:
        nuevoRol !== "Director" ? "" : usuarioEdicion.subtipo_director,
      subtipo_docente:
        nuevoRol !== "Docente" ? "" : usuarioEdicion.subtipo_docente,
    });
  };

  const handleUsuarioEdicionSubtipoDirectorChange = (e) => {
    setUsuarioEdicion({
      ...usuarioEdicion,
      subtipo_director: e.target.value,
    });
  };

  const handleUsuarioEdicionSubtipoDocenteChange = (e) => {
    setUsuarioEdicion({
      ...usuarioEdicion,
      subtipo_docente: e.target.value,
    });
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
          <div className="admin-section-content">
            <h2>Gestión de Usuarios</h2>
            <div className="admin-user-management-buttons">
              <button
                onClick={() => setModoGestionUsuarios("añadir")}
                className={
                  modoGestionUsuarios === "añadir" ? "admin-active-button" : ""
                }
              >
                Añadir Usuario
              </button>
              <button
                onClick={handleListarUsuarios}
                className={
                  modoGestionUsuarios === "listar" ? "admin-active-button" : ""
                }
              >
                Listar Usuarios
              </button>
            </div>

            {modoGestionUsuarios === "añadir" && (
              <form onSubmit={handleCrearUsuario} className="admin-user-form">
                <div className="admin-form-group">
                  <label htmlFor="correo">Correo Institucional</label>
                  <input
                    type="email"
                    id="correo"
                    value={nuevoUsuario.correo}
                    onChange={(e) =>
                      setNuevoUsuario({
                        ...nuevoUsuario,
                        correo: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="rol">Rol</label>
                  <select
                    id="rol"
                    value={nuevoUsuario.rol}
                    onChange={handleRolChange}
                  >
                    <option value="Estudiante">Estudiante</option>
                    <option value="Docente">Docente</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Director">Director</option>
                  </select>
                </div>

                {nuevoUsuario.rol === "Director" && (
                  <div className="admin-form-group">
                    <label htmlFor="subtipo_director">Tipo de Director</label>
                    <select
                      id="subtipo_director"
                      value={nuevoUsuario.subtipo_director}
                      onChange={handleSubtipoDirectorChange}
                      required
                    >
                      <option value="">Seleccione un tipo</option>
                      {subtiposDirector.map((subtipo) => (
                        <option
                          key={subtipo}
                          value={subtipo}
                          disabled={subtiposUsados[subtipo]}
                        >
                          {subtipo}{" "}
                          {subtiposUsados[subtipo] ? "(Ya asignado)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {nuevoUsuario.rol === "Docente" && (
                  <div className="admin-form-group">
                    <label htmlFor="subtipo_docente">Tipo de Docente</label>
                    <select
                      id="subtipo_docente"
                      value={nuevoUsuario.subtipo_docente}
                      onChange={handleSubtipoDocenteChange}
                      required
                    >
                      <option value="">Seleccione un tipo</option>
                      {subtiposDocente.map((subtipo) => (
                        <option key={subtipo} value={subtipo}>
                          {subtipo}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button type="submit" className="admin-submit-button">
                  Crear Usuario
                </button>
              </form>
            )}

            {modoGestionUsuarios === "editar" && usuarioEdicion && (
              <form onSubmit={handleSubmitEdicion} className="admin-user-form">
                <div className="admin-form-group">
                  <label htmlFor="correo">Correo Electrónico</label>
                  <input
                    type="email"
                    id="correo"
                    value={usuarioEdicion.correo}
                    onChange={(e) =>
                      setUsuarioEdicion({
                        ...usuarioEdicion,
                        correo: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="password">Contraseña</label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={usuarioEdicion.password}
                      onChange={(e) =>
                        setUsuarioEdicion({
                          ...usuarioEdicion,
                          password: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="toggle-password-visibility"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {!showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label htmlFor="rol">Rol</label>
                  <select
                    id="rol"
                    value={usuarioEdicion.rol}
                    onChange={handleUsuarioEdicionRolChange}
                  >
                    <option value="Estudiante">Estudiante</option>
                    <option value="Docente">Docente</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Director">Director</option>
                  </select>
                </div>

                {usuarioEdicion.rol === "Director" && (
                  <div className="admin-form-group">
                    <label htmlFor="subtipo_director_edicion">
                      Tipo de Director
                    </label>
                    <select
                      id="subtipo_director_edicion"
                      value={usuarioEdicion.subtipo_director || ""}
                      onChange={handleUsuarioEdicionSubtipoDirectorChange}
                      required
                    >
                      <option value="">Seleccione un tipo</option>
                      {subtiposDirector.map((subtipo) => (
                        <option
                          key={subtipo}
                          value={subtipo}
                          disabled={
                            subtiposUsados[subtipo] &&
                            usuarioEdicion.subtipo_director !== subtipo
                          }
                        >
                          {subtipo}{" "}
                          {subtiposUsados[subtipo] &&
                          usuarioEdicion.subtipo_director !== subtipo
                            ? "(Ya asignado)"
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {usuarioEdicion.rol === "Docente" && (
                  <div className="admin-form-group">
                    <label htmlFor="subtipo_docente_edicion">
                      Tipo de Docente
                    </label>
                    <select
                      id="subtipo_docente_edicion"
                      value={usuarioEdicion.subtipo_docente || ""}
                      onChange={handleUsuarioEdicionSubtipoDocenteChange}
                      required
                    >
                      <option value="">Seleccione un tipo</option>
                      {subtiposDocente.map((subtipo) => (
                        <option key={subtipo} value={subtipo}>
                          {subtipo}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="admin-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={usuarioEdicion.is_active}
                      onChange={(e) =>
                        setUsuarioEdicion({
                          ...usuarioEdicion,
                          is_active: e.target.checked,
                        })
                      }
                    />
                    Cuenta Activa
                  </label>
                </div>
                <div className="admin-form-buttons">
                  <button type="submit" className="admin-submit-button">
                    Guardar Cambios
                  </button>
                  <button
                    type="button"
                    className="admin-cancel-button"
                    onClick={() => {
                      setModoGestionUsuarios("listar");
                      setUsuarioEdicion(null);
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {modoGestionUsuarios === "listar" && renderListaUsuarios()}

            {mensajeUsuario && (
              <div
                className={`admin-mensaje ${
                  mensajeUsuario.includes("exitosamente")
                    ? "admin-mensaje-exito"
                    : "admin-mensaje-error"
                }`}
              >
                {mensajeUsuario}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="admin-welcome-content">
            <Carousel />
          </div>
        );
    }
  };

  return (
    <div className="admin-background-image">
      <div className="admin-container">
        <nav className="admin-navbar">
          <div className="admin-navbar-content">
            <div className="admin-top-row">
              <div className="admin-nav-logo">
                <img
                  src={logoImage}
                  alt="Logo Cesmag"
                  className="admin-logo-image"
                />
              </div>
              <h1 className="admin-welcome-text">Bienvenido Administrador</h1>
              <div className="admin-nav-centre-logo-container">
                <img
                  src={centreLogo}
                  alt="Logo Central"
                  className="admin-centre-logo"
                />
              </div>
            </div>
            <div className="admin-options-row">
              <ul className="admin-nav-options">
                <li>
                  <a
                    href="#"
                    onClick={() => handleSectionClick("gestion-usuarios")}
                    className={
                      activeSection === "gestion-usuarios" ? "admin-active" : ""
                    }
                  >
                    Gestión de Usuarios
                  </a>
                </li>
                {/* Aquí puedes agregar más opciones de menú según necesites */}
              </ul>
            </div>
          </div>
        </nav>

        <div className="admin-user-info">
          <p>Usuario: {usuario?.correo}</p>
          <div className="user-actions">
            <button className="user-icon-button" onClick={toggleUserMenu}>
              <User size={24} strokeWidth={2} />
            </button>
            <button className="admin-logout-button" onClick={confirmLogout}>
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

        <div className="admin-content-area">{renderSectionContent()}</div>

        {showLogoutConfirm && (
          <div className="admin-logout-confirmation">
            <div className="admin-confirmation-content">
              <img
                src={centreLogo}
                alt="Logo Central"
                className="admin-confirmation-logo"
              />
              <p>¿Estás seguro que quieres cerrar sesión?</p>
              <button onClick={() => handleConfirmLogout(true)}>Sí</button>
              <button onClick={() => handleConfirmLogout(false)}>No</button>
            </div>
          </div>
        )}

        <div className="admin-footer-bar">
          <img
            src={logoImage}
            alt="Logo Cesmag"
            className="admin-footer-logo"
          />
          <span className="admin-footer-text">
            Todos los derechos son reservados © {new Date().getFullYear()}
          </span>
          <img
            src={centreLogo}
            alt="Logo Central"
            className="admin-footer-logo"
          />
        </div>
      </div>
    </div>
  );
};

export default Administracion;
