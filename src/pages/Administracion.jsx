import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/PageAdmin.css";
import logoImage from "../assets/logo_cesmag.png";
import centreLogo from "../assets/logo2.png";
import Carousel from "../components/carousel/carousel";
import { Eye, EyeOff, Search, Calendar } from "lucide-react";
import { User, UserCircle, Lock, UserCog, CalendarClock } from "lucide-react";
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
  const [gruposDisponibles, setGruposDisponibles] = useState(['A', 'B', 'C', 'D', 'E']); // Puedes inicializar con los grupos que ya existen
  // Estados para filtros de periodos
  const [filtrosPeriodo, setFiltrosPeriodo] = useState({
    codigo: ""
  });
  const [listaPeriodosFiltrada, setListaPeriodosFiltrada] = useState([]);

  // Estados para usuarios
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre_usuario: "",
    correo: "",
    rol: "Estudiante",
    subtipo_director: "",
    subtipo_docente: "",
    semestre: "",   // Nuevo campo
    grupo: ""       // Nuevo campo
  });
  const [mensajeUsuario, setMensajeUsuario] = useState("");
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [listaUsuariosFiltrada, setListaUsuariosFiltrada] = useState([]);
  const [modoGestionUsuarios, setModoGestionUsuarios] = useState("");
  const [usuarioEdicion, setUsuarioEdicion] = useState(null);
  const [filtros, setFiltros] = useState({
    correo: "",
    nombre_usuario: "",
    rol: "",
    semestre: "",
    grupo: "",
  });

  // Estados para periodos
  const [modoGestionPeriodos, setModoGestionPeriodos] = useState("");
  const [listaPeriodos, setListaPeriodos] = useState([]);
  const [nuevoPeriodo, setNuevoPeriodo] = useState({
    codigo: "",
    fecha_inicio: "",
    fecha_fin: "",
    activo: true,
  });
  const [periodoEdicion, setPeriodoEdicion] = useState(null);
  const [periodoOriginal, setPeriodoOriginal] = useState(null);
  const [mensajePeriodo, setMensajePeriodo] = useState("");

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

  // Funciones para gestión de usuarios
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

    // Prepara el cuerpo de la solicitud
    const requestBody = {
      correo: usuarioEdicion.correo,
      nombre_usuario: usuarioEdicion.nombre_usuario,
      rol: usuarioEdicion.rol,
      is_active: usuarioEdicion.is_active,
      password: usuarioEdicion.password,
      subtipo_director: usuarioEdicion.subtipo_director || "",
      subtipo_docente: usuarioEdicion.subtipo_docente || ""
    };

    // Si es estudiante, incluir semestre y grupo
    if (usuarioEdicion.rol === "Estudiante") {
      requestBody.semestre = usuarioEdicion.semestre || "";
      requestBody.grupo = usuarioEdicion.grupo || "";
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
          body: JSON.stringify(requestBody),
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
  const handleFiltroPeriodoChange = (e) => {
    const { name, value } = e.target;
    setFiltrosPeriodo({
      ...filtrosPeriodo,
      [name]: value
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
    // Filtrar por nombre
    if (filtros.nombre_usuario) {
      usuariosFiltrados = usuariosFiltrados.filter((usuario) =>
        usuario.nombre_usuario.toLowerCase().includes(filtros.nombre_usuario.toLowerCase())
      );
    }

    // Filtrar por rol
    if (filtros.rol) {
      usuariosFiltrados = usuariosFiltrados.filter(
        (usuario) => usuario.rol === filtros.rol
      );
    }
    // Filtrar por semestre
    if (filtros.semestre) {
      usuariosFiltrados = usuariosFiltrados.filter(
        (usuario) => usuario.semestre === filtros.semestre
      );
    }
    // Filtrar por grupo
    if (filtros.grupo) {
      usuariosFiltrados = usuariosFiltrados.filter(
        (usuario) => usuario.grupo === filtros.grupo
      );
    }

    setListaUsuariosFiltrada(usuariosFiltrados);
  };
  const aplicarFiltrosPeriodo = () => {
    let periodosFiltrados = [...listaPeriodos];

    // Filtrar por código
    if (filtrosPeriodo.codigo) {
      periodosFiltrados = periodosFiltrados.filter((periodo) =>
        periodo.codigo.toLowerCase().includes(filtrosPeriodo.codigo.toLowerCase())
      );
    }

    setListaPeriodosFiltrada(periodosFiltrados);
  };

  useEffect(() => {
    aplicarFiltrosPeriodo();
  }, [filtrosPeriodo, listaPeriodos]);

  // Aplicar filtros cada vez que cambian los filtros o la lista de usuarios
  useEffect(() => {
    aplicarFiltros();
  }, [filtros, listaUsuarios]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si el menú está abierto y se da click en cualquier lado
      if (showUserMenu) {
        setShowUserMenu(false);    // Cerrar el menú
        setShowPerfil(false);      // Cerrar perfil
        setShowCambiarClave(false); // Cerrar cambiar clave
        setActiveSection("");      // Volver a mostrar el Carousel
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showUserMenu]);


  const limpiarFiltros = () => {
    setFiltros({
      correo: "",
      nombre_usuario: "",
      rol: "",
      semestre: "",
      grupo: "",
    });
  };
  const limpiarFiltrosPeriodo = () => {
    setFiltrosPeriodo({
      codigo: ""
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
              <label htmlFor="filtroNombre">Nombre:</label>
              <div className="admin-search-input">
                <input
                  type="text"
                  id="filtroNombre"
                  name="nombre_usuario"
                  value={filtros.nombre_usuario}
                  onChange={handleFiltroChange}
                  placeholder="Buscar por nombre"
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
            <div className="admin-form-group">
              <label htmlFor="filtroSemestre">Semestre:</label>
              <select
                id="filtroSemestre"
                name="semestre"
                value={filtros.semestre}
                onChange={handleFiltroChange}
              >
                <option value="">Todos los semestres</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num.toString()}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label htmlFor="filtroGrupo">Grupo:</label>
              <select
                id="filtroGrupo"
                name="grupo"
                value={filtros.grupo}
                onChange={handleFiltroChange}
              >
                <option value="">Todos los grupos</option>
                {gruposDisponibles.map((grupo) => (
                  <option key={grupo} value={grupo}>
                    {grupo}
                  </option>
                ))}
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
                <th>Nombre</th>
                <th>Rol</th>
                <th>Tipo Director</th>
                <th>Tipo Docente</th>
                <th>Semestre</th>  {/* Nueva columna */}
                <th>Grupo</th>     {/* Nueva columna */}
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
                    <td>{usuarioItem.nombre_usuario}</td>
                    <td>{usuarioItem.rol}</td>
                    <td>{usuarioItem.subtipo_director || "-"}</td>
                    <td>{usuarioItem.subtipo_docente || "-"}</td>
                    <td>{usuarioItem.rol === "Estudiante" ? (usuarioItem.semestre || "-") : "-"}</td>
                    <td>{usuarioItem.rol === "Estudiante" ? (usuarioItem.grupo || "-") : "-"}</td>
                    <td>
                      <span
                        className={`${usuarioItem.is_active
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
                  <td colSpan="10" className="admin-no-results">  {/* Actualizar el colSpan a 10 */}
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

  // Funciones para periodos
  const handleCrearPeriodo = async (e) => {
    e.preventDefault();
    setMensajePeriodo("");

    // Validaciones básicas
    if (!nuevoPeriodo.fecha_inicio || !nuevoPeriodo.fecha_fin) {
      setMensajePeriodo("Todos los campos son obligatorios");
      setTimeout(() => {
        setMensajePeriodo("");
      }, 3000);
      return;
    }

    // Validar que la fecha de fin sea posterior a la fecha de inicio
    if (new Date(nuevoPeriodo.fecha_fin) <= new Date(nuevoPeriodo.fecha_inicio)) {
      setMensajePeriodo("La fecha de fin debe ser posterior a la fecha de inicio");
      setTimeout(() => {
        setMensajePeriodo("");
      }, 3000);
      return;
    }

    // Obtener objetos de fecha para trabajar con ellos
    const fechaInicio = new Date(nuevoPeriodo.fecha_inicio);
    const fechaFin = new Date(nuevoPeriodo.fecha_fin);

    // Validar que ambas fechas pertenezcan al mismo año
    if (fechaInicio.getFullYear() !== fechaFin.getFullYear()) {
      setMensajePeriodo("Las fechas de inicio y fin deben pertenecer al mismo año académico");
      setTimeout(() => {
        setMensajePeriodo("");
      }, 3000);
      return;
    }

    // Obtener año de la fecha de inicio (no el año actual)
    const añoFecha = fechaInicio.getFullYear();

    // Determinar semestre basado en las fechas
    const semestre = (fechaInicio.getMonth() < 6 && fechaFin.getMonth() < 6) ? 1 : 2;

    // Generar código automáticamente basado en el año de las fechas
    const codigoGenerado = `${añoFecha}-${semestre}`;

    // Verificar si el código proporcionado coincide con la lógica
    if (nuevoPeriodo.codigo && nuevoPeriodo.codigo !== codigoGenerado) {
      setMensajePeriodo(`El código debe ser ${codigoGenerado} basado en las fechas proporcionadas`);
      setTimeout(() => {
        setMensajePeriodo("");
      }, 3000);
      return;
    }

    // Usar el código generado si no se proporcionó uno
    const periodoData = {
      ...nuevoPeriodo,
      codigo: nuevoPeriodo.codigo || codigoGenerado
    };

    try {
      const response = await fetch("http://localhost:8000/crear-periodo/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(periodoData),
      });

      const data = await response.json();

      if (response.ok) {
        setMensajePeriodo("Periodo creado exitosamente");
        setNuevoPeriodo({
          codigo: "",
          fecha_inicio: "",
          fecha_fin: "",
          activo: true,
        });
        await handleListarPeriodos();
      } else {
        setMensajePeriodo(data.mensaje || "Error al crear periodo");
      }

      setTimeout(() => {
        setMensajePeriodo("");
      }, 3000);
    } catch (error) {
      setMensajePeriodo("Error de conexión");
      console.error("Error:", error);
      setTimeout(() => {
        setMensajePeriodo("");
      }, 3000);
    }
  };

  const handleListarPeriodos = async () => {
    try {
      const response = await fetch("http://localhost:8000/listar-periodos/", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setListaPeriodos(data);
        setListaPeriodosFiltrada(data);
        setModoGestionPeriodos("listar");
      } else {
        setMensajePeriodo("Error al obtener la lista de periodos");
        setTimeout(() => {
          setMensajePeriodo("");
        }, 3000);
      }
    } catch (error) {
      setMensajePeriodo("Error de conexión");
      console.error("Error:", error);
      setTimeout(() => {
        setMensajePeriodo("");
      }, 3000);
    }
  };

  const handleEditarPeriodo = (periodo) => {
    setPeriodoEdicion({ ...periodo });
    setPeriodoOriginal({ ...periodo });
    setModoGestionPeriodos("editar");
  };

  const handleSubmitEdicionPeriodo = async (e) => {
    e.preventDefault();
    setMensajePeriodo("");

    // Validaciones básicas
    if (!periodoEdicion.codigo || !periodoEdicion.fecha_inicio || !periodoEdicion.fecha_fin) {
      setMensajePeriodo("Todos los campos son obligatorios");
      setTimeout(() => {
        setMensajePeriodo("");
      }, 3000);
      return;
    }

    // Solo realizar las validaciones de fecha si estas se están modificando
    // comparando con las fechas originales del periodo
    const fechasModificadas = periodoEdicion.fecha_inicio !== periodoOriginal?.fecha_inicio ||
      periodoEdicion.fecha_fin !== periodoOriginal?.fecha_fin;

    if (fechasModificadas) {
      // Validar que la fecha de fin sea posterior a la fecha de inicio
      if (new Date(periodoEdicion.fecha_fin) <= new Date(periodoEdicion.fecha_inicio)) {
        setMensajePeriodo("La fecha de fin debe ser posterior a la fecha de inicio");
        setTimeout(() => {
          setMensajePeriodo("");
        }, 3000);
        return;
      }

      // Obtener objetos de fecha para trabajar con ellos
      const fechaInicio = new Date(periodoEdicion.fecha_inicio);
      const fechaFin = new Date(periodoEdicion.fecha_fin);

      // Validar que ambas fechas pertenezcan al mismo año
      if (fechaInicio.getFullYear() !== fechaFin.getFullYear()) {
        setMensajePeriodo("Las fechas de inicio y fin deben pertenecer al mismo año académico");
        setTimeout(() => {
          setMensajePeriodo("");
        }, 3000);
        return;
      }

      // Obtener año de la fecha de inicio
      const añoFecha = fechaInicio.getFullYear();

      // Determinar semestre basado en las fechas
      const semestre = (fechaInicio.getMonth() < 6 && fechaFin.getMonth() < 6) ? 1 : 2;

      // Generar código que debería tener basado en las fechas
      const codigoGenerado = `${añoFecha}-${semestre}`;

      // Validar código contra el generado según las fechas
      if (periodoEdicion.codigo !== codigoGenerado) {
        setMensajePeriodo(`El código debe ser ${codigoGenerado} basado en las fechas proporcionadas`);
        setTimeout(() => {
          setMensajePeriodo("");
        }, 3000);
        return;
      }
    }

    try {
      const response = await fetch(
        `http://localhost:8000/detalle-periodo/${periodoEdicion.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(periodoEdicion),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMensajePeriodo("Periodo actualizado exitosamente");
        await handleListarPeriodos();
        setModoGestionPeriodos("listar");
        setPeriodoEdicion(null);
      } else {
        setMensajePeriodo(data.mensaje || "Error al actualizar periodo");
      }

      setTimeout(() => {
        setMensajePeriodo("");
      }, 3000);
    } catch (error) {
      setMensajePeriodo("Error de conexión");
      console.error("Error:", error);
      setTimeout(() => {
        setMensajePeriodo("");
      }, 3000);
    }
  };

  const handleEliminarPeriodo = async (periodo) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de eliminar el periodo ${periodo.codigo} ?`
    );

    if (confirmacion) {
      try {
        const response = await fetch(
          `http://localhost:8000/detalle-periodo/${periodo.id}/`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (response.ok) {
          setMensajePeriodo("Periodo eliminado exitosamente");
          await handleListarPeriodos();
        } else {
          setMensajePeriodo(data.mensaje || "Error al eliminar periodo");
        }

        setTimeout(() => {
          setMensajePeriodo("");
        }, 3000);
      } catch (error) {
        setMensajePeriodo("Error de conexión");
        console.error("Error:", error);
        setTimeout(() => {
          setMensajePeriodo("");
        }, 3000);
      }
    }
  };

  const renderListaPeriodos = () => {
    return (
      <div className="admin-users-list-container">
        <div className="admin-search-form">
          <h3>Filtrar Periodos</h3>
          <div className="admin-search-fields">
            <div className="admin-form-group">
              <label htmlFor="filtroCodigo">Código:</label>
              <div className="admin-search-input">
                <input
                  type="text"
                  id="filtroCodigo"
                  name="codigo"
                  value={filtrosPeriodo.codigo}
                  onChange={handleFiltroPeriodoChange}
                  placeholder="Buscar por código"
                />
                <Search size={20} className="admin-search-icon" />
              </div>
            </div>
            <button
              type="button"
              className="admin-clear-filter"
              onClick={limpiarFiltrosPeriodo}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        <div className="admin-users-table-container">
          <p>Total de periodos mostrados: {listaPeriodosFiltrada.length}</p>
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Fecha Inicio</th>
                <th>Fecha Fin</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listaPeriodosFiltrada.length > 0 ? (
                listaPeriodosFiltrada.map((periodoItem) => (
                  <tr key={periodoItem.id}>
                    <td>{periodoItem.id}</td>
                    <td>{periodoItem.codigo}</td>
                    <td>{new Date(periodoItem.fecha_inicio).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</td>
                    <td>{new Date(periodoItem.fecha_fin).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</td>
                    <td>
                      <span
                        className={`${periodoItem.activo
                          ? "admin-status-activo"
                          : "admin-status-inactivo"
                          }`}
                      >
                        {periodoItem.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          className="admin-edit-button"
                          onClick={() => handleEditarPeriodo(periodoItem)}
                          title="Editar Periodo"
                        >
                          ✏️
                        </button>
                        <button
                          className="admin-delete-button"
                          onClick={() => handleEliminarPeriodo(periodoItem)}
                          title="Eliminar Periodo"
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
                    No se encontraron periodos con los filtros aplicados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Funciones generales
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
    setModoGestionPeriodos("");
    setActiveSection(activeSection === section ? "" : section);
    setShowPerfil(false);
    setShowCambiarClave(false);
    window.scrollTo(0, 0);
  };

  const toggleUserMenu = (e) => {
    e.stopPropagation();  // Evita que el click cierre el menú inmediatamente
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
          nombre_usuario: "",
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
                  <label htmlFor="nombre_usuario">Nombre y Apellido</label>
                  <input
                    type="text"
                    id="nombre_usuario"
                    value={nuevoUsuario.nombre_usuario}
                    onChange={(e) =>
                      setNuevoUsuario({
                        ...nuevoUsuario,
                        nombre_usuario: e.target.value,
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
                {nuevoUsuario.rol === "Estudiante" && (
                  <>
                    <div className="admin-form-group">
                      <label htmlFor="semestre">Semestre</label>
                      <select
                        id="semestre"
                        value={nuevoUsuario.semestre}
                        onChange={(e) =>
                          setNuevoUsuario({
                            ...nuevoUsuario,
                            semestre: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Seleccione un semestre</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <option key={num} value={num.toString()}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="grupo">Grupo</label>
                      <select
                        id="grupo"
                        value={nuevoUsuario.grupo}
                        onChange={(e) =>
                          setNuevoUsuario({
                            ...nuevoUsuario,
                            grupo: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Seleccione un grupo</option>
                        {gruposDisponibles.map((grupo) => (
                          <option key={grupo} value={grupo}>
                            {grupo}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
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
                  <label htmlFor="nombre_usuario">Nombre y Apellido</label>
                  <input
                    type="text"
                    id="nombre_usuario"
                    value={usuarioEdicion.nombre_usuario}
                    onChange={(e) =>
                      setUsuarioEdicion({
                        ...usuarioEdicion,
                        nombre_usuario: e.target.value,
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
                {usuarioEdicion && usuarioEdicion.rol === "Estudiante" && (
                  <>
                    <div className="admin-form-group">
                      <label htmlFor="semestre_edicion">Semestre</label>
                      <select
                        id="semestre_edicion"
                        value={usuarioEdicion.semestre || ""}
                        onChange={(e) =>
                          setUsuarioEdicion({
                            ...usuarioEdicion,
                            semestre: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Seleccione un semestre</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <option key={num} value={num.toString()}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="grupo_edicion">Grupo</label>
                      <select
                        id="grupo_edicion"
                        value={usuarioEdicion.grupo || ""}
                        onChange={(e) =>
                          setUsuarioEdicion({
                            ...usuarioEdicion,
                            grupo: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Seleccione un grupo</option>
                        {gruposDisponibles.map((grupo) => (
                          <option key={grupo} value={grupo}>
                            {grupo}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
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
                className={`admin-mensaje ${mensajeUsuario.includes("exitosamente")
                  ? "admin-mensaje-exito"
                  : "admin-mensaje-error"
                  }`}
              >
                {mensajeUsuario}
              </div>
            )}
          </div>
        );
      case "gestion-periodos":
        return (
          <div className="admin-section-content">
            <h2>Gestión de Periodos</h2>
            <div className="admin-user-management-buttons">
              <button
                onClick={() => setModoGestionPeriodos("añadir")}
                className={
                  modoGestionPeriodos === "añadir" ? "admin-active-button" : ""
                }
              >
                Añadir Periodo
              </button>
              <button
                onClick={handleListarPeriodos}
                className={
                  modoGestionPeriodos === "listar" ? "admin-active-button" : ""
                }
              >
                Listar Periodos
              </button>
            </div>
            {modoGestionPeriodos === "añadir" && (
              <form onSubmit={handleCrearPeriodo} className="admin-user-form">
                <div className="admin-form-group">
                  <label htmlFor="codigo">Código de Periodo(formato: AAAA-S)</label>
                  <input
                    type="text"
                    id="codigo"
                    value={nuevoPeriodo.codigo}
                    onChange={(e) =>
                      setNuevoPeriodo({
                        ...nuevoPeriodo,
                        codigo: e.target.value,
                      })
                    }
                    placeholder="Ejemplo: 2025-1"
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="fecha_inicio">Fecha de Inicio</label>
                  <div className="admin-date-input">
                    <input
                      type="date"
                      id="fecha_inicio"
                      value={nuevoPeriodo.fecha_inicio}
                      onChange={(e) =>
                        setNuevoPeriodo({
                          ...nuevoPeriodo,
                          fecha_inicio: e.target.value,
                        })
                      }
                      required
                    />
                    <Calendar size={20} className="admin-calendar-icon" />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label htmlFor="fecha_fin">Fecha de Fin</label>
                  <div className="admin-date-input">
                    <input
                      type="date"
                      id="fecha_fin"
                      value={nuevoPeriodo.fecha_fin}
                      onChange={(e) =>
                        setNuevoPeriodo({
                          ...nuevoPeriodo,
                          fecha_fin: e.target.value,
                        })
                      }
                      required
                    />
                    <Calendar size={20} className="admin-calendar-icon" />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={nuevoPeriodo.activo}
                      onChange={(e) =>
                        setNuevoPeriodo({
                          ...nuevoPeriodo,
                          activo: e.target.checked,
                        })
                      }
                    />
                    Periodo Activo
                  </label>
                </div>
                <button type="submit" className="admin-submit-button">
                  Crear Periodo
                </button>
              </form>
            )}

            {modoGestionPeriodos === "editar" && periodoEdicion && (
              <form onSubmit={handleSubmitEdicionPeriodo} className="admin-user-form">
                <div className="admin-form-group">
                  <label htmlFor="codigo">Código de Periodo (formato: AAAA-S)</label>
                  <input
                    type="text"
                    id="codigo"
                    value={periodoEdicion.codigo}
                    onChange={(e) =>
                      setPeriodoEdicion({
                        ...periodoEdicion,
                        codigo: e.target.value,
                      })
                    }
                    placeholder="Ejemplo: 2025-1"
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="fecha_inicio_edicion">Fecha de Inicio</label>
                  <div className="admin-date-input">
                    <input
                      type="date"
                      id="fecha_inicio_edicion"
                      value={periodoEdicion.fecha_inicio}
                      onChange={(e) =>
                        setPeriodoEdicion({
                          ...periodoEdicion,
                          fecha_inicio: e.target.value,
                        })
                      }
                      required
                    />
                    <Calendar size={20} className="admin-calendar-icon" />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label htmlFor="fecha_fin_edicion">Fecha de Fin</label>
                  <div className="admin-date-input">
                    <input
                      type="date"
                      id="fecha_fin_edicion"
                      value={periodoEdicion.fecha_fin}
                      onChange={(e) =>
                        setPeriodoEdicion({
                          ...periodoEdicion,
                          fecha_fin: e.target.value,
                        })
                      }
                      required
                    />
                    <Calendar size={20} className="admin-calendar-icon" />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={periodoEdicion.activo}
                      onChange={(e) =>
                        setPeriodoEdicion({
                          ...periodoEdicion,
                          activo: e.target.checked,
                        })
                      }
                    />
                    Periodo Activo
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
                      setModoGestionPeriodos("listar");
                      setPeriodoEdicion(null);
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {modoGestionPeriodos === "listar" && renderListaPeriodos()}

            {mensajePeriodo && (
              <div
                className={`admin-mensaje ${mensajePeriodo.includes("exitosamente")
                  ? "admin-mensaje-exito"
                  : "admin-mensaje-error"
                  }`}
              >
                {mensajePeriodo}
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
                    <UserCog size={18} />
                    Gestión de Usuarios
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() => handleSectionClick("gestion-periodos")}
                    className={
                      activeSection === "gestion-periodos" ? "admin-active" : ""
                    }
                  >
                    <CalendarClock size={18} />
                    Gestión de Periodos
                  </a>
                </li>
                {/* Aquí puedes agregar más opciones de menú según necesites */}
              </ul>
            </div>
          </div>
        </nav>

        <div className="admin-user-info">
          <p>Usuario: {usuario?.nombre_usuario} ({usuario?.correo})</p>
          <div className="docente-user-actions">
            <button className="docente-user-icon-button" onClick={(e) => toggleUserMenu(e)}>
              <User size={24} strokeWidth={2} />
            </button>
            <button className="admin-logout-button" onClick={confirmLogout}>
              Cerrar Sesión
            </button>
          </div>
        </div>
        {showUserMenu && (
          <div className="docente-user-menu-dropdown">
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