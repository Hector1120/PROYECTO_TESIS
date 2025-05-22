import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/PageDirector.css";
import logoImage from "../assets/logo_cesmag.png";
import centreLogo from "../assets/logo2.png";
import Carousel from "../components/carousel/carousel";
import { User, UserCircle, Lock, Search, Eye, EyeOff } from "lucide-react";
import Perfil from "./Perfil";
import CambiarClave from "./CambiarClave";
import ReportesPrograma from "./ReportesPrograma";

const Director = ({
  navbarOptions = [],
  welcomeText = "Bienvenido Director",
}) => {
  const navigate = useNavigate();
  const { logout, usuario } = useAuth();
  const [activeSection, setActiveSection] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPerfil, setShowPerfil] = useState(false);
  const [showCambiarClave, setShowCambiarClave] = useState(false);
  const [modoGestionEstudiantes, setModoGestionEstudiantes] = useState("");
  const [estudianteEdicion, setEstudianteEdicion] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mensajeUsuario, setMensajeUsuario] = useState("");
  const [listaEstudiantes, setListaEstudiantes] = useState([]);
  const [listaEstudiantesFiltrada, setListaEstudiantesFiltrada] = useState([]);
  const [modoGestionDocentes, setModoGestionDocentes] = useState("");
  const [docenteEdicion, setDocenteEdicion] = useState(null);
  const [listaDocentes, setListaDocentes] = useState([]);
  const [listaDocentesFiltrada, setListaDocentesFiltrada] = useState([]);
  const [modoGestionAsignaturas, setModoGestionAsignaturas] = useState("");
  const [listaAsignaturas, setListaAsignaturas] = useState([]);
  const [listaAsignaturasFiltrada, setListaAsignaturasFiltrada] = useState([]);
  const [listaAreas, setListaAreas] = useState([]);
  const [nuevaAreaNombre, setNuevaAreaNombre] = useState("");
  const [areaEdicion, setAreaEdicion] = useState(null);
  const [listaAreasFiltrada, setListaAreasFiltrada] = useState([]);
  const [horariosDocentes, setHorariosDocentes] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [mensajeHorarios, setMensajeHorarios] = useState("");
  const [filtroCorreoHorarios, setFiltroCorreoHorarios] = useState("");
  const [vistaExpandida, setVistaExpandida] = useState(false);
  const [docentesExpandidos, setDocentesExpandidos] = useState({});
  const [peticionRealizada, setPeticionRealizada] = useState(false);
  const [actualizandoPermisos, setActualizandoPermisos] = useState(false);
  const [filtrosAreas, setFiltrosAreas] = useState({
    nombre: "",
  });

  const [filtrosAsignaturas, setFiltrosAsignaturas] = useState({
    nombre: "",
    area: "",
    semestre: "",
  });

  const [nuevaArea, setNuevaArea] = useState({
    nombre: "",
    docentes: [],
  });
  const [nuevaAsignatura, setNuevaAsignatura] = useState({
    nombre: "",
    area: "",
    semestre: "",
    docentes: [],
  });
  const [asignaturaEdicion, setAsignaturaEdicion] = useState({
    id: null,
    nombre: "",
    area: "",
    semestre: "",
    docentes: [],
    nuevaArea: "", // Nuevo campo para almacenar el valor de la nueva área
  });

  const [filtrosDocentes, setFiltrosDocentes] = useState({
    correo: "",
    nombre_usuario: "",
  });
  const [nuevoDocente, setNuevoDocente] = useState({
    correo: "",
    nombre_usuario: "",
    subtipo_docente: "",
  });
  const [filtros, setFiltros] = useState({
    correo: "",
    nombre_usuario: "",
    rol: "",
    semestre: "",
    grupo: "",
  });
  const [nuevoUsuario, setNuevoUsuario] = useState({
    correo: "",
    nombre_usuario: "",
    rol: "Estudiante",
    semestre: "", // Default value
    grupo: "",    // Default value
  });

  // Si no se proporcionan opciones específicas, usar estas opciones predeterminadas
  const defaultOptions = [
    { id: "gestion-usuarios", label: "Gestión de Usuarios" },
    { id: "gestion-horarios", label: "Gestión de Horarios" },
    { id: "gestion-asignaturas", label: "Gestión de Asignaturas" },
  ];

  // Usar opciones proporcionadas o las predeterminadas
  const options = navbarOptions.length > 0 ? navbarOptions : defaultOptions;

  useEffect(() => {
    const eliminarHorariosPasados = async () => {
      try {
        await fetch("http://localhost:8000/limpiar-horarios/", {
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
  const handleRolChange = (e) => {
    setNuevoUsuario({
      ...nuevoUsuario,
      rol: e.target.value,
    });
  };

  const handleSectionClick = (section) => {
    setModoGestionEstudiantes("");
    setModoGestionDocentes("");
    setModoGestionAsignaturas("");
    setActiveSection(activeSection === section ? "" : section);
    setShowPerfil(false);
    setShowCambiarClave(false);
    window.scrollTo(0, 0);
  };

  const toggleUserMenu = (e) => {
    e.stopPropagation();  // Evita que el click cierre el menú inmediatamente
    setShowUserMenu(!showUserMenu);
  };


  const handleCrearEstudiante = async (e) => {
    e.preventDefault();
    setMensajeUsuario("");
    try {
      const response = await fetch("http://localhost:8000/crear-estudiante/", {
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
          `Estudiante creado exitosamente. Contraseña enviada a ${nuevoUsuario.correo}`
        );
        setNuevoUsuario({
          correo: "",
          nombre_usuario: "",
          rol: "Estudiante",
          semestre: "",
          grupo: "",
        });
        // Actualizar la lista de usuarios en segundo plano, pero NO cambiar el modo
        fetch("http://localhost:8000/listar-estudiantes/", {
          method: "GET",
          credentials: "include",
        })
          .then((response) => response.json())
          .then((data) => {
            if (response.ok) {
              setListaEstudiantes(data);
              setListaEstudiantesFiltrada(data);
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


  const handleEditarEstudiante = async (usuario) => {
    setEstudianteEdicion({ ...usuario, password: "" }); // Add password field
    setModoGestionEstudiantes("editar");
    setShowPassword(false);
  };

  const handleSubmitEdicion = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `http://localhost:8000/detalle-estudiante/${estudianteEdicion.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            correo: estudianteEdicion.correo,
            nombre_usuario: estudianteEdicion.nombre_usuario,
            is_active: estudianteEdicion.is_active,
            password: estudianteEdicion.password,
            semestre: estudianteEdicion.semestre,
            grupo: estudianteEdicion.grupo,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMensajeUsuario("Usuario actualizado exitosamente");
        await handleListarEstudiantes();
        setModoGestionEstudiantes("listar");
        setEstudianteEdicion(null);
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


  const handleListarEstudiantes = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/listar-estudiantes/",
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setListaEstudiantes(data);
        setListaEstudiantesFiltrada(data);
        setModoGestionEstudiantes("listar");
      } else {
        setMensajeUsuario("Error al obtener la lista de estudiantes");
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

  const aplicarFiltros = () => {
    let usuariosFiltrados = [...listaEstudiantes];

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

    setListaEstudiantesFiltrada(usuariosFiltrados);
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value,
    });
  };
  const handleEliminarEstudiante = async (usuario) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de eliminar el usuario ${usuario.correo}?`
    );

    if (confirmacion) {
      try {
        const response = await fetch(
          `http://localhost:8000/detalle-estudiante/${usuario.id}/`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (response.ok) {
          setMensajeUsuario("Usuario eliminado exitosamente");
          await handleListarEstudiantes();
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

  const handleCrearDocente = async (e) => {
    e.preventDefault();
    setMensajeUsuario("");
    try {
      const response = await fetch("http://localhost:8000/crear-docente/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(nuevoDocente),
      });

      const data = await response.json();

      if (response.ok) {
        setMensajeUsuario(
          `Docente creado exitosamente. Contraseña enviada a ${nuevoDocente.correo}`
        );
        setNuevoDocente({
          correo: "",
          nombre_usuario: "",
          subtipo_docente: "",
        });
        // Actualizar la lista de docentes en segundo plano, pero NO cambiar el modo
        fetch("http://localhost:8000/listar-docentes/", {
          method: "GET",
          credentials: "include",
        })
          .then((response) => response.json())
          .then((data) => {
            if (response.ok) {
              setListaDocentes(data);
              setListaDocentesFiltrada(data);
            }
          })
          .catch((error) => console.error("Error actualizando lista:", error));

        setTimeout(() => {
          setMensajeUsuario("");
        }, 3000);
      } else {
        setMensajeUsuario(data.mensaje || "Error al crear docente");
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

  const handleListarDocentes = async () => {
    try {
      const response = await fetch("http://localhost:8000/listar-docentes/", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setListaDocentes(data);
        setListaDocentesFiltrada(data);
        setModoGestionDocentes("listar");
      } else {
        setMensajeUsuario("Error al obtener la lista de docentes");
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

  const handleEditarDocente = async (docente) => {
    setDocenteEdicion({ ...docente, password: "" });
    setModoGestionDocentes("editar");
    setShowPassword(false);
  };

  const handleSubmitEdicionDocente = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `http://localhost:8000/detalle-docente/${docenteEdicion.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            correo: docenteEdicion.correo,
            nombre_usuario: docenteEdicion.nombre_usuario,
            is_active: docenteEdicion.is_active,
            password: docenteEdicion.password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMensajeUsuario("Docente actualizado exitosamente");
        await handleListarDocentes();
        setModoGestionDocentes("listar");
        setDocenteEdicion(null);
      } else {
        setMensajeUsuario(data.mensaje || "Error al actualizar docente");
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

  const handleEliminarDocente = async (docente) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de eliminar el docente ${docente.correo}?`
    );

    if (confirmacion) {
      try {
        const response = await fetch(
          `http://localhost:8000/detalle-docente/${docente.id}/`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (response.ok) {
          setMensajeUsuario("Docente eliminado exitosamente");
          await handleListarDocentes();
        } else {
          setMensajeUsuario(data.mensaje || "Error al eliminar docente");
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

  const aplicarFiltrosDocentes = () => {
    let docentesFiltrados = [...listaDocentes];

    // Filtrar por correo
    if (filtrosDocentes.correo) {
      docentesFiltrados = docentesFiltrados.filter((docente) =>
        docente.correo
          .toLowerCase()
          .includes(filtrosDocentes.correo.toLowerCase())
      );
    }
    // Filtrar por nombre
    if (filtrosDocentes.nombre_usuario) {
      docentesFiltrados = docentesFiltrados.filter((docente) =>
        docente.nombre_usuario.toLowerCase().includes(filtrosDocentes.nombre_usuario.toLowerCase())
      );
    }

    setListaDocentesFiltrada(docentesFiltrados);
  };

  const handleFiltroDocenteChange = (e) => {
    const { name, value } = e.target;
    setFiltrosDocentes({
      ...filtrosDocentes,
      [name]: value,
    });
  };

  const limpiarFiltrosDocentes = () => {
    setFiltrosDocentes({
      correo: "",
      nombre_usuario: "",
    });
  };

  // Aplicar filtros cada vez que cambian los filtros o la lista de usuarios
  useEffect(() => {
    aplicarFiltros();
  }, [filtros, listaEstudiantes]);

  useEffect(() => {
    aplicarFiltrosDocentes();
  }, [filtrosDocentes, listaDocentes]);

  const limpiarFiltros = () => {
    setFiltros({
      correo: "",
      nombre_usuario: "",
      rol: "",
      semestre: "",
      grupo: "",
    });
  };

  const renderListaEstudiantes = () => {
    return (
      <div className="director-users-list-container">
        <div className="director-search-form">
          <h3>Filtrar Estudiantes</h3>
          <div className="director-search-fields">
            <div className="director-form-group">
              <label htmlFor="filtroCorreo">Correo:</label>
              <div className="director-search-input">
                <input
                  type="text"
                  id="filtroCorreo"
                  name="correo"
                  value={filtros.correo}
                  onChange={handleFiltroChange}
                  placeholder="Buscar por correo"
                />
                <Search size={20} className="director-search-icon" />
              </div>
            </div>
            <div className="director-form-group">
              <label htmlFor="filtroNombre">Nombre:</label>
              <div className="director-search-input">
                <input
                  type="text"
                  id="filtroNombre"
                  name="nombre_usuario"
                  value={filtros.nombre_usuario}
                  onChange={handleFiltroChange}
                  placeholder="Buscar por nombre"
                />
                <Search size={20} className="director-search-icon" />
              </div>
            </div>

            <div className="director-form-group">
              <label htmlFor="filtroSemestre">Semestre:</label>
              <select
                id="filtroSemestre"
                name="semestre"
                value={filtros.semestre}
                onChange={handleFiltroChange}
              >
                <option value="">Todos</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num.toString()}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            <div className="director-form-group">
              <label htmlFor="filtroGrupo">Grupo:</label>
              <select
                id="filtroGrupo"
                name="grupo"
                value={filtros.grupo}
                onChange={handleFiltroChange}
              >
                <option value="">Todos</option>
                {['A', 'B', 'C', 'D', 'E'].map((letra) => (
                  <option key={letra} value={letra}>
                    {letra}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="director-clear-filter"
              onClick={limpiarFiltros}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        <div className="director-users-table-container">
          <p>Total de usuarios mostrados: {listaEstudiantesFiltrada.length}</p>
          <table className="director-users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Correo</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Semestre</th>
                <th>Grupo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listaEstudiantesFiltrada.length > 0 ? (
                listaEstudiantesFiltrada.map((usuarioItem) => (
                  <tr key={usuarioItem.id}>
                    <td>{usuarioItem.id}</td>
                    <td>{usuarioItem.correo}</td>
                    <td>{usuarioItem.nombre_usuario}</td>
                    <td>{usuarioItem.rol}</td>
                    <td>{usuarioItem.semestre}</td>
                    <td>{usuarioItem.grupo}</td>
                    <td>
                      <span
                        className={`${usuarioItem.is_active
                          ? "director-status-activo"
                          : "director-status-inactivo"
                          }`}
                      >
                        {usuarioItem.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className="director-table-actions">
                        <button
                          className="director-edit-button"
                          onClick={() => handleEditarEstudiante(usuarioItem)}
                          title="Editar Usuario"
                        >
                          ✏️
                        </button>
                        <button
                          className="director-delete-button"
                          onClick={() => handleEliminarEstudiante(usuarioItem)}
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
                  <td colSpan="7" className="director-no-results">
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

  const renderListaDocentes = () => {
    return (
      <div className="director-users-list-container">
        <div className="director-search-form">
          <h3>Filtrar Docentes</h3>
          <div className="director-search-fields">
            <div className="director-form-group">
              <label htmlFor="filtroCorreoDocente">Correo:</label>
              <div className="director-search-input">
                <input
                  type="text"
                  id="filtroCorreoDocente"
                  name="correo"
                  value={filtrosDocentes.correo}
                  onChange={handleFiltroDocenteChange}
                  placeholder="Buscar por correo"
                />
                <Search size={20} className="director-search-icon" />
              </div>
            </div>
            <div className="director-form-group">
              <label htmlFor="filtroNombreDocente">Nombre:</label>
              <div className="director-search-input">
                <input
                  type="text"
                  id="filtroNombreDocente"
                  name="nombre_usuario"
                  value={filtrosDocentes.nombre_usuario}
                  onChange={handleFiltroDocenteChange}
                  placeholder="Buscar por nombre"
                />
                <Search size={20} className="director-search-icon" />
              </div>
            </div>
            <button
              type="button"
              className="director-clear-filter"
              onClick={limpiarFiltrosDocentes}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        <div className="director-users-table-container">
          <p>Total de docentes mostrados: {listaDocentesFiltrada.length}</p>
          <table className="director-users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Correo</th>
                <th>Nombre</th>
                <th>Tipo Docente</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listaDocentesFiltrada.length > 0 ? (
                listaDocentesFiltrada.map((docente) => (
                  <tr key={docente.id}>
                    <td>{docente.id}</td>
                    <td>{docente.correo}</td>
                    <td>{docente.nombre_usuario}</td>
                    <td>{docente.subtipo_docente}</td>
                    <td>
                      <span
                        className={`${docente.is_active
                          ? "director-status-activo"
                          : "director-status-inactivo"
                          }`}
                      >
                        {docente.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className="director-table-actions">
                        <button
                          className="director-edit-button"
                          onClick={() => handleEditarDocente(docente)}
                          title="Editar Docente"
                        >
                          ✏️
                        </button>
                        <button
                          className="director-delete-button"
                          onClick={() => handleEliminarDocente(docente)}
                          title="Eliminar Docente"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="director-no-results">
                    No se encontraron docentes con los filtros aplicados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Función para cargar la lista de áreas
  const cargarAreas = async () => {
    try {
      const response = await fetch("http://localhost:8000/listar-areas/", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // Acceder a la propiedad "areas" que contiene el array
        const areasData = data.areas || [];
        setListaAreas(areasData);
        setListaAreasFiltrada(areasData);
      } else {
        console.error("Error al cargar áreas");
        setMensajeUsuario("Error al cargar áreas");
        setTimeout(() => {
          setMensajeUsuario("");
        }, 3000);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setMensajeUsuario("Error de conexión");
      setTimeout(() => {
        setMensajeUsuario("");
      }, 3000);
    }
  };

  // Función para listar las áreas
  const handleListarAreas = async () => {
    try {
      const response = await fetch("http://localhost:8000/listar-areas/", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // Acceder a la propiedad "areas" que contiene el array
        const areasData = data.areas || [];
        setListaAreas(areasData);
        setListaAreasFiltrada(areasData);
        setModoGestionAsignaturas("listar-areas");
      } else {
        setMensajeUsuario("Error al obtener la lista de áreas");
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

  // Función para cargar el detalle de un área
  const handleEditarArea = async (area) => {
    try {
      const response = await fetch(
        `http://localhost:8000/detalle-area/${area.id}/`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const detalleArea = await response.json();
        setAreaEdicion({
          ...detalleArea,
          docentes: detalleArea.docentes.map((docente) => docente.correo),
        });
        setModoGestionAsignaturas("editar-area");
        cargarDocentes();
      } else {
        setMensajeUsuario("Error al obtener los detalles del área");
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

  // Función para guardar los cambios en un área
  const handleSubmitEdicionArea = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `http://localhost:8000/detalle-area/${areaEdicion.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            nombre: areaEdicion.nombre,
            docentes: areaEdicion.docentes,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMensajeUsuario("Área actualizada exitosamente");
        await handleListarAreas();
        setAreaEdicion(null);
      } else {
        setMensajeUsuario(data.mensaje || "Error al actualizar el área");
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

  // Función para eliminar un área
  const handleEliminarArea = async (area) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de eliminar el área "${area.nombre}"? Esta acción solo es posible si el área no tiene asignaturas asociadas.`
    );

    if (confirmacion) {
      try {
        const response = await fetch(
          `http://localhost:8000/detalle-area/${area.id}/`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setMensajeUsuario(data.mensaje || "Área eliminada exitosamente");
          await handleListarAreas();
        } else {
          const data = await response.json();
          setMensajeUsuario(data.mensaje || "Error al eliminar el área");
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

  // Función para filtrar áreas por nombre
  const handleFiltroAreasChange = (e) => {
    const { name, value } = e.target;
    setFiltrosAreas({
      ...filtrosAreas,
      [name]: value,
    });

    // Aplicar filtro
    aplicarFiltrosAreas();
  };

  // Función para aplicar filtros a la lista de áreas
  const aplicarFiltrosAreas = () => {
    let areasFiltradas = [...listaAreas];

    // Filtrar por nombre
    if (filtrosAreas.nombre) {
      areasFiltradas = areasFiltradas.filter((area) =>
        area.nombre.toLowerCase().includes(filtrosAreas.nombre.toLowerCase())
      );
    }

    setListaAreasFiltrada(areasFiltradas);
  };

  // Función para limpiar filtros de áreas
  const limpiarFiltrosAreas = () => {
    setFiltrosAreas({
      nombre: "",
    });
    setListaAreasFiltrada([...listaAreas]);
  };

  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    aplicarFiltrosAreas();
  }, [listaAreas, filtrosAreas]);

  // Función para renderizar la lista de áreas
  const renderListaAreas = () => {
    return (
      <div className="director-users-list-container">
        <div className="director-search-form">
          <h3>Filtrar Áreas</h3>
          <div className="director-search-fields">
            <div className="director-form-group">
              <label htmlFor="filtroNombreArea">Nombre:</label>
              <div className="director-search-input">
                <input
                  type="text"
                  id="filtroNombreArea"
                  name="nombre"
                  value={filtrosAreas.nombre}
                  onChange={handleFiltroAreasChange}
                  placeholder="Buscar por nombre"
                />
                <Search size={20} className="director-search-icon" />
              </div>
            </div>
            <button
              type="button"
              className="director-clear-filter"
              onClick={limpiarFiltrosAreas}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        <div className="director-users-table-container">
          <p>Total de áreas mostradas: {listaAreasFiltrada.length}</p>
          <table className="director-users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Asignaturas</th>
                <th>Docentes</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listaAreasFiltrada.length > 0 ? (
                listaAreasFiltrada.map((area) => (
                  <tr key={area.id}>
                    <td>{area.id}</td>
                    <td>{area.nombre}</td>
                    <td>{area.num_asignaturas} asignatura(s)</td>
                    <td>
                      <ul className="docentes-list">
                        {area.docentes && area.docentes.length > 0 ? (
                          area.docentes.map((docente, idx) => (
                            <li key={idx}>{docente.correo}</li>
                          ))
                        ) : (
                          <li className="alerta-docentes">
                            Los docentes fueron cambiados de rol o eliminados,
                            por eso ya no aparecen en esta área. Se recomienda
                            asignar nuevos docentes, ya que no se permiten áreas
                            sin docentes.{" "}
                          </li>
                        )}
                      </ul>
                    </td>
                    <td>
                      <div className="director-table-actions">
                        <button
                          className="director-edit-button"
                          onClick={() => handleEditarArea(area)}
                          title="Editar Área"
                        >
                          ✏️
                        </button>
                        <button
                          className="director-delete-button"
                          onClick={() => handleEliminarArea(area)}
                          title="Eliminar Área"
                          disabled={area.num_asignaturas > 0}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="director-no-results">
                    No se encontraron áreas con los filtros aplicados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Función para cargar docentes
  const cargarDocentes = async () => {
    try {
      const response = await fetch("http://localhost:8000/listar-docentes/", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setListaDocentes(data);
      } else {
        console.error("Error al cargar docentes");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
    }
  };

  // Función modificada para crear asignatura
  const handleCrearAsignatura = async (e) => {
    e.preventDefault();
    setMensajeUsuario("");
    await cargarAreas();

    // Determinar si se usarán los docentes del área
    const usar_docentes_area = true; // Por defecto usamos los docentes del área

    const asignaturaData = {
      nombre: nuevaAsignatura.nombre,
      area:
        nuevaAsignatura.area === "nueva"
          ? nuevaAreaNombre
          : nuevaAsignatura.area,
      semestre: nuevaAsignatura.semestre,
      usar_docentes_area: usar_docentes_area,
      // No necesitamos enviar los docentes si usar_docentes_area es true
    };

    try {
      const response = await fetch(
        "http://localhost:8000/gestionar-asignatura/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(asignaturaData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMensajeUsuario(
          `Asignatura ${nuevaAsignatura.nombre} creada exitosamente`
        );
        setNuevaAsignatura({
          nombre: "",
          area: "",
          semestre: "",
          docentes: [],
        });
        setNuevaAreaNombre("");
        // Actualizar la lista de asignaturas en segundo plano
        handleListarAsignaturas();

        setTimeout(() => {
          setMensajeUsuario("");
        }, 3000);
      } else {
        setMensajeUsuario(data.mensaje || "Error al crear asignatura");
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
  const handleCrearArea = async (e) => {
    e.preventDefault();
    setMensajeUsuario("");
    console.log("Datos a enviar:", {
      nombre: nuevaArea.nombre,
      docentes: nuevaArea.docentes,
    });
    try {
      const response = await fetch("http://localhost:8000/gestionar-area/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          nombre: nuevaArea.nombre,
          docentes: nuevaArea.docentes,
        }),
      });

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      if (response.ok) {
        let mensaje = `Área ${nuevaArea.nombre} creada exitosamente`;

        // Si hay docentes encontrados, mencionarlos
        if (data.docentes_encontrados && data.docentes_encontrados.length > 0) {
          mensaje += `. Docentes asignados: ${data.docentes_encontrados.join(
            ", "
          )}`;
        }

        // Si hay una advertencia sobre docentes no encontrados, agregarla al mensaje
        if (data.advertencia) {
          mensaje += `. ${data.advertencia}`;
        }

        setMensajeUsuario(mensaje);
        setNuevaArea({
          nombre: "",
          docentes: [],
        });

        // Actualizar la lista de áreas en segundo plano
        handleListarAreas();

        setTimeout(() => {
          setMensajeUsuario("");
        }, 5000); // Aumentar el tiempo si hay advertencias
      } else {
        setMensajeUsuario(data.mensaje || "Error al crear área");
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

  // Función para cargar docentes del subtipo correspondiente
  const cargarDocentesPorSubtipo = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/listar-docentes-por-subtipo/",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setListaDocentes(data);
      } else {
        console.error("Error al cargar docentes por subtipo");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
    }
  };

  // Modificar el componente de formulario de Añadir Asignatura para eliminar la selección de docentes
  // ya que ahora se tomarán automáticamente del área
  const formAñadirAsignatura = (
    <form onSubmit={handleCrearAsignatura} className="director-user-form">
      <div className="director-form-group">
        <label htmlFor="nombre">Nombre de la Asignatura</label>
        <input
          type="text"
          id="nombre"
          value={nuevaAsignatura.nombre}
          onChange={(e) =>
            setNuevaAsignatura({
              ...nuevaAsignatura,
              nombre: e.target.value,
            })
          }
          required
        />
      </div>
      <div className="director-form-group">
        <label htmlFor="area">Área</label>
        <select
          id="area"
          value={nuevaAsignatura.area}
          onChange={(e) => {
            const valor = e.target.value;
            if (valor === "nueva") {
              // Redirigir al formulario de añadir área
              setModoGestionAsignaturas("añadir-area");
              cargarDocentes();
            } else {
              setNuevaAsignatura({ ...nuevaAsignatura, area: valor });
            }
          }}
          required
        >
          <option value="" disabled>
            Seleccione un área
          </option>
          {listaAreas.map((area) => (
            <option key={area.id} value={area.nombre}>
              {area.nombre} ({area.docentes.length} docentes)
            </option>
          ))}
          <option value="nueva">+ Crear Nueva Área</option>
        </select>
      </div>

      <div className="director-form-group">
        <label htmlFor="semestre">Semestre</label>
        <select
          id="semestre"
          value={nuevaAsignatura.semestre}
          onChange={(e) =>
            setNuevaAsignatura({
              ...nuevaAsignatura,
              semestre: e.target.value,
            })
          }
          required
        >
          <option value="" disabled>
            Seleccione un semestre
          </option>
          <option value="1">Primero</option>
          <option value="2">Segundo</option>
          <option value="3">Tercero</option>
          <option value="4">Cuarto</option>
          <option value="5">Quinto</option>
          <option value="6">Sexto</option>
          <option value="7">Séptimo</option>
          <option value="8">Octavo</option>
          <option value="9">Noveno</option>
          <option value="10">Décimo</option>
        </select>
      </div>

      {/* Eliminamos la selección de docentes ya que se tomarán del área */}

      <div className="director-form-info">
        <p>
          Los docentes se asignarán automáticamente según el área seleccionada.
        </p>
        {nuevaAsignatura.area && nuevaAsignatura.area !== "nueva" && (
          <div>
            <p>Docentes que se asignarán a esta asignatura:</p>
            <ul className="docentes-preview-list">
              {listaAreas
                .find((a) => a.nombre === nuevaAsignatura.area)
                ?.docentes.map((docente, idx) => (
                  <li key={idx}>
                    {docente.correo} ({docente.subtipo_docente})
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      <button type="submit" className="director-submit-button">
        Crear Asignatura
      </button>
    </form>
  );

  // Función para agregar un formulario de creación de áreas
  const formAñadirArea = (
    <form onSubmit={handleCrearArea} className="director-user-form">
      <div className="director-form-group">
        <label htmlFor="nombreArea">Nombre del Área</label>
        <input
          type="text"
          id="nombreArea"
          value={nuevaArea.nombre}
          onChange={(e) =>
            setNuevaArea({
              ...nuevaArea,
              nombre: e.target.value,
            })
          }
          required
        />
      </div>
      <div className="director-form-group">
        <label>Docentes Asignados</label>
        <div className="director-docentes-checkbox-container">
          {listaDocentes.map((docente) => (
            <div key={docente.id} className="director-docente-checkbox-item">
              <input
                type="checkbox"
                id={`docente-area-new-${docente.id}`}
                value={docente.correo}
                checked={nuevaArea.docentes.includes(docente.correo)}
                onChange={(e) => {
                  const correo = e.target.value;
                  const isChecked = e.target.checked;

                  setNuevaArea((prev) => {
                    const docentes = isChecked
                      ? [...prev.docentes, correo]
                      : prev.docentes.filter((d) => d !== correo);
                    return { ...prev, docentes };
                  });
                }}
              />
              <label
                htmlFor={`docente-area-new-${docente.id}`}
                className="director-docente-label"
              >
                <span className="director-docente-info">
                  <span className="director-docente-correo">
                    {docente.correo}
                  </span>
                  <span className="director-docente-tipo">
                    {docente.subtipo_docente}
                  </span>
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>
      <button type="submit" className="director-submit-button">
        Crear Área
      </button>
    </form>
  );

  // Función para listar asignaturas
  const handleListarAsignaturas = async () => {
    cargarAreas();
    try {
      const response = await fetch(
        "http://localhost:8000/gestionar-asignatura/",
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setListaAsignaturas(data.asignaturas);
        setListaAsignaturasFiltrada(data.asignaturas);
        setModoGestionAsignaturas("listar");
      } else {
        setMensajeUsuario("Error al obtener la lista de asignaturas");
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

  // Función para editar asignatura
  const handleEditarAsignatura = async (asignatura) => {
    cargarAreas();
    try {
      const response = await fetch(
        `http://localhost:8000/detalle-asignatura/${asignatura.id}/`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const detalleAsignatura = await response.json();
        const areaDocentes =
          listaAreas.find(
            (area) => area.nombre === detalleAsignatura.area.nombre
          )?.docentes || [];

        setAsignaturaEdicion({
          id: detalleAsignatura.id,
          nombre: detalleAsignatura.nombre,
          area: detalleAsignatura.area.nombre,
          semestre: detalleAsignatura.semestre,
          docentes: areaDocentes.map((docente) => ({
            correo: docente.correo,
            subtipo_docente: docente.subtipo_docente,
          })),
        });
        setModoGestionAsignaturas("editar");
      } else {
        setMensajeUsuario("Error al obtener detalles de la asignatura");
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

  // Función para guardar cambios en la edición
  const handleSubmitEdicionAsignatura = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `http://localhost:8000/detalle-asignatura/${asignaturaEdicion.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            nombre: asignaturaEdicion.nombre,
            area:
              asignaturaEdicion.area === "nueva"
                ? asignaturaEdicion.nuevaArea
                : asignaturaEdicion.area,
            semestre: asignaturaEdicion.semestre,
            docentes: asignaturaEdicion.docentes,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMensajeUsuario("Asignatura actualizada exitosamente");
        await handleListarAsignaturas();
        setModoGestionAsignaturas("listar");
        setAsignaturaEdicion(null);
      } else {
        setMensajeUsuario(data.mensaje || "Error al actualizar asignatura");
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

  // Función para eliminar asignatura
  const handleEliminarAsignatura = async (asignatura) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de eliminar la asignatura ${asignatura.nombre}?`
    );

    if (confirmacion) {
      try {
        const response = await fetch(
          `http://localhost:8000/detalle-asignatura/${asignatura.id}/`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (response.ok) {
          setMensajeUsuario("Asignatura eliminada exitosamente");
          await handleListarAsignaturas();
        } else {
          setMensajeUsuario(data.mensaje || "Error al eliminar asignatura");
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

  // Funciones para filtrado de asignaturas
  const aplicarFiltrosAsignaturas = () => {
    let asignaturasFiltradas = [...listaAsignaturas];

    // Filtrar por nombre
    if (filtrosAsignaturas.nombre) {
      asignaturasFiltradas = asignaturasFiltradas.filter((asignatura) =>
        asignatura.nombre
          .toLowerCase()
          .includes(filtrosAsignaturas.nombre.toLowerCase())
      );
    }

    // Filtrar por área
    if (filtrosAsignaturas.area) {
      asignaturasFiltradas = asignaturasFiltradas.filter((asignatura) =>
        asignatura.area.nombre
          .toLowerCase()
          .includes(filtrosAsignaturas.area.toLowerCase())
      );
    }

    // Filtrar por semestre
    if (filtrosAsignaturas.semestre) {
      asignaturasFiltradas = asignaturasFiltradas.filter(
        (asignatura) => asignatura.semestre === filtrosAsignaturas.semestre
      );
    }

    setListaAsignaturasFiltrada(asignaturasFiltradas);
  };

  const handleFiltroAsignaturaChange = (e) => {
    const { name, value } = e.target;
    setFiltrosAsignaturas({
      ...filtrosAsignaturas,
      [name]: value,
    });
  };

  const limpiarFiltrosAsignaturas = () => {
    setFiltrosAsignaturas({
      nombre: "",
      area: "",
      semestre: "",
    });
  };

  // Effect para aplicar filtros cuando cambian
  useEffect(() => {
    aplicarFiltrosAsignaturas();
  }, [filtrosAsignaturas, listaAsignaturas]);

  // Effect para cargar áreas y docentes cuando se accede a la sección
  useEffect(() => {
    if (activeSection === "gestion-asignaturas") {
      cargarAreas();
      cargarDocentes();
    }
  }, [activeSection]);

  // Componente para renderizar la lista de asignaturas
  const renderListaAsignaturas = () => {
    return (
      <div className="director-users-list-container">
        <div className="director-search-form">
          <h3>Filtrar Asignaturas</h3>
          <div className="director-search-fields">
            <div className="director-form-group">
              <label htmlFor="filtroNombre">Nombre:</label>
              <div className="director-search-input">
                <input
                  type="text"
                  id="filtroNombre"
                  name="nombre"
                  value={filtrosAsignaturas.nombre}
                  onChange={handleFiltroAsignaturaChange}
                  placeholder="Buscar por nombre"
                />
                <Search size={20} className="director-search-icon" />
              </div>
            </div>
            <div className="director-form-group">
              <label htmlFor="filtroArea">Área:</label>
              <select
                id="filtroArea"
                name="area"
                value={filtrosAsignaturas.area}
                onChange={handleFiltroAsignaturaChange}
              >
                <option value="">Todas las áreas</option>
                {/* Usamos la misma lista actualizada de áreas */}
                {listaAreas.map((area) => (
                  <option key={area.id} value={area.nombre}>
                    {area.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="director-form-group">
              <label htmlFor="filtroSemestre">Semestre:</label>
              <select
                id="filtroSemestre"
                name="semestre"
                value={filtrosAsignaturas.semestre}
                onChange={handleFiltroAsignaturaChange}
              >
                <option value="">Todos los semestres</option>
                <option value="1">Primero</option>
                <option value="2">Segundo</option>
                <option value="3">Tercero</option>
                <option value="4">Cuarto</option>
                <option value="5">Quinto</option>
                <option value="6">Sexto</option>
                <option value="7">Séptimo</option>
                <option value="8">Octavo</option>
                <option value="9">Noveno</option>
                <option value="10">Décimo</option>
              </select>
            </div>
            <button
              type="button"
              className="director-clear-filter"
              onClick={limpiarFiltrosAsignaturas}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        <div className="director-users-table-container">
          <p>
            Total de asignaturas mostradas: {listaAsignaturasFiltrada.length}
          </p>
          <table className="director-users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Área</th>
                <th>Semestre</th>
                <th>Docentes</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listaAsignaturasFiltrada.length > 0 ? (
                listaAsignaturasFiltrada.map((asignatura) => (
                  <tr key={asignatura.id}>
                    <td>{asignatura.id}</td>
                    <td>{asignatura.nombre}</td>
                    <td>{asignatura.area.nombre}</td>
                    <td>{asignatura.semestre_display}</td>
                    <td>
                      <ul className="docentes-list">
                        {asignatura.docentes &&
                          asignatura.docentes.length > 0 ? (
                          asignatura.docentes.map((docente, index) => (
                            <li key={index}>{docente.correo}</li>
                          ))
                        ) : (
                          <li className="alerta-docentes">
                            No hay docentes asignados en el área de esta
                            asignatura. Se recomienda asignar docentes nuevos
                            para esa área.
                          </li>
                        )}
                      </ul>
                    </td>

                    <td>
                      <div className="director-table-actions">
                        <button
                          className="director-edit-button"
                          onClick={() => handleEditarAsignatura(asignatura)}
                          title="Editar Asignatura"
                        >
                          ✏️
                        </button>
                        <button
                          className="director-delete-button"
                          onClick={() => handleEliminarAsignatura(asignatura)}
                          title="Eliminar Asignatura"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="director-no-results">
                    No se encontraron asignaturas con los filtros aplicados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Contenido para la sección "gestion-asignaturas" con el nuevo botón para listar áreas
  // Contenido para la sección "gestion-asignaturas" con el nuevo botón para listar áreas
  const gestionAsignaturasContent = (
    <div className="director-section-content">
      <h2>Gestión de Asignaturas</h2>
      <div className="director-user-management-buttons">
        <button
          onClick={() => setModoGestionAsignaturas("añadir")}
          className={
            modoGestionAsignaturas === "añadir" ? "director-active-button" : ""
          }
        >
          Añadir Asignatura
        </button>
        <button
          onClick={handleListarAsignaturas}
          className={
            modoGestionAsignaturas === "listar" ? "director-active-button" : ""
          }
        >
          Listar Asignaturas
        </button>
        <button
          onClick={handleListarAreas}
          className={
            modoGestionAsignaturas === "listar-areas"
              ? "director-active-button"
              : ""
          }
        >
          Listar Áreas
        </button>
        <button
          onClick={() => {
            cargarDocentes(); // Llama a la función cargarDocentes
            setModoGestionAsignaturas("añadir-area"); // Cambia el modo de gestión
          }}
          className={
            modoGestionAsignaturas === "añadir-area"
              ? "director-active-button"
              : ""
          }
        >
          Añadir Área
        </button>
      </div>
      {modoGestionAsignaturas === "añadir" && formAñadirAsignatura}
      {modoGestionAsignaturas === "añadir-area" && formAñadirArea}
      {modoGestionAsignaturas === "listar" && renderListaAsignaturas()}
      {modoGestionAsignaturas === "listar-areas" && renderListaAreas()}
      {modoGestionAsignaturas === "editar" && asignaturaEdicion && (
        <form
          onSubmit={handleSubmitEdicionAsignatura}
          className="director-user-form"
        >
          <div className="director-form-group">
            <label htmlFor="nombreEdit">Nombre de la Asignatura</label>
            <input
              type="text"
              id="nombreEdit"
              value={asignaturaEdicion.nombre}
              onChange={(e) =>
                setAsignaturaEdicion({
                  ...asignaturaEdicion,
                  nombre: e.target.value,
                })
              }
              required
            />
          </div>
          <div className="director-form-group">
            <label htmlFor="areaEdit">Área</label>
            <select
              id="areaEdit"
              value={asignaturaEdicion.area}
              onChange={(e) => {
                const valor = e.target.value;
                if (valor === "nueva") {
                  setModoGestionAsignaturas("añadir-area");
                  cargarDocentes();
                  setAsignaturaEdicion(null);
                } else {
                  const areaDocentes =
                    listaAreas.find((area) => area.nombre === valor)
                      ?.docentes || [];
                  setAsignaturaEdicion({
                    ...asignaturaEdicion,
                    area: valor,
                    docentes: areaDocentes.map((docente) => ({
                      correo: docente.correo,
                      subtipo_docente: docente.subtipo_docente,
                    })),
                  });
                }
              }}
              required
            >
              {listaAreas.map((area) => (
                <option key={area.id} value={area.nombre}>
                  {area.nombre}
                </option>
              ))}
              <option value="nueva">+ Crear Nueva Área</option>
            </select>
          </div>
          <div className="director-form-group">
            <label htmlFor="semestreEdit">Semestre</label>
            <select
              id="semestreEdit"
              value={asignaturaEdicion.semestre}
              onChange={(e) =>
                setAsignaturaEdicion({
                  ...asignaturaEdicion,
                  semestre: e.target.value,
                })
              }
              required
            >
              <option value="1">Primero</option>
              <option value="2">Segundo</option>
              <option value="3">Tercero</option>
              <option value="4">Cuarto</option>
              <option value="5">Quinto</option>
              <option value="6">Sexto</option>
              <option value="7">Séptimo</option>
              <option value="8">Octavo</option>
              <option value="9">Noveno</option>
              <option value="10">Décimo</option>
            </select>
          </div>
          <div className="director-form-group">
            <label>Docentes Asignados</label>
            <div className="director-docentes-checkbox-container">
              {asignaturaEdicion.docentes.map((docente, index) => (
                <div key={index} className="director-docente-checkbox-item">
                  <input
                    type="checkbox"
                    id={`docente-edit-${index}`}
                    value={docente.correo}
                    checked={true}
                    disabled={true}
                  />
                  <label
                    htmlFor={`docente-edit-${index}`}
                    className="director-docente-label"
                  >
                    <span className="director-docente-info">
                      <span className="director-docente-correo">
                        {docente.correo}
                      </span>
                      <span className="director-docente-subtipo">
                        {docente.subtipo_docente}
                      </span>
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="director-form-buttons">
            <button type="submit" className="director-submit-button">
              Guardar Cambios
            </button>
            <button
              type="button"
              className="director-cancel-button"
              onClick={() => {
                setModoGestionAsignaturas("listar");
                setAsignaturaEdicion(null);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
      {modoGestionAsignaturas === "editar-area" && areaEdicion && (
        <form onSubmit={handleSubmitEdicionArea} className="director-user-form">
          <div className="director-form-group">
            <label htmlFor="nombreAreaEdit">Nombre del Área</label>
            <input
              type="text"
              id="nombreAreaEdit"
              value={areaEdicion.nombre}
              onChange={(e) =>
                setAreaEdicion({
                  ...areaEdicion,
                  nombre: e.target.value,
                })
              }
              required
            />
          </div>
          <div className="director-form-group">
            <label>Docentes Asignados al Área</label>
            <div className="director-docentes-checkbox-container">
              {listaDocentes.map((docente) => (
                <div
                  key={docente.id}
                  className="director-docente-checkbox-item"
                >
                  <input
                    type="checkbox"
                    id={`docente-area-${docente.id}`}
                    value={docente.correo}
                    checked={areaEdicion.docentes.includes(docente.correo)}
                    onChange={(e) => {
                      const correo = e.target.value;
                      const isChecked = e.target.checked;

                      setAreaEdicion((prev) => {
                        const docentes = isChecked
                          ? [...prev.docentes, correo]
                          : prev.docentes.filter((d) => d !== correo);
                        return { ...prev, docentes };
                      });
                    }}
                  />
                  <label
                    htmlFor={`docente-area-${docente.id}`}
                    className="director-docente-label"
                  >
                    <span className="director-docente-info">
                      <span className="director-docente-correo">
                        {docente.correo}
                      </span>
                      <span className="director-docente-tipo">
                        {docente.subtipo_docente}
                      </span>
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="director-form-info">
            <p>Asignaturas asociadas: {areaEdicion.num_asignaturas}</p>
            {areaEdicion.asignaturas && areaEdicion.asignaturas.length > 0 && (
              <div className="director-area-asignaturas">
                <p>Asignaturas en esta área:</p>
                <ul>
                  {areaEdicion.asignaturas.map((asignatura) => (
                    <li key={asignatura.id}>
                      {asignatura.nombre} (Semestre {asignatura.semestre})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="director-form-buttons">
            <button type="submit" className="director-submit-button">
              Guardar Cambios
            </button>
            <button
              type="button"
              className="director-cancel-button"
              onClick={() => {
                setModoGestionAsignaturas("listar-areas");
                setAreaEdicion(null);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
      {mensajeUsuario && (
        <div
          className={`director-mensaje ${mensajeUsuario.includes("exitosamente")
            ? "director-mensaje-exito"
            : "director-mensaje-error"
            }`}
        >
          {mensajeUsuario}
        </div>
      )}
    </div>
  );
  // Añadir este efecto para cargar los docentes del subtipo correspondiente
  useEffect(() => {
    cargarDocentesPorSubtipo();
  }, []);

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

  const renderSectionContent = () => {
    if (showPerfil) {
      return <Perfil />;
    }
    if (showCambiarClave) {
      return <CambiarClave />;
    }

    // Función para obtener los horarios de los docentes
    // Función para obtener los horarios de los docentes
    const obtenerHorariosDocentes = async () => {
      setCargandoHorarios(true);
      setMensajeHorarios("");
      try {
        const response = await fetch(
          "http://localhost:8000/obtener-horarios-docentes/",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Error al obtener los horarios");
        }

        const data = await response.json();
        setHorariosDocentes(data.docentes_horarios);
        // Añadimos esta línea para marcar que ya se realizó la petición
        setPeticionRealizada(true);
      } catch (error) {
        setMensajeHorarios(`Error: ${error.message}`);
        // También marcamos que ya se realizó la petición aunque haya habido un error
        setPeticionRealizada(true);
      } finally {
        setCargandoHorarios(false);
      }
    };

    const actualizarPermisosCreacionHorario = async (docenteId, puedeCrearHorarios) => {
      try {
        setActualizandoPermisos(true);
        const response = await fetch('http://localhost:8000/actualizar-permisos-docente/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            docente_id: docenteId,
            puede_crear_horarios: puedeCrearHorarios
          }),
          credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
          // Actualizar el estado local para reflejar el cambio
          setHorariosDocentes(prevDocentes =>
            prevDocentes.map(docente =>
              docente.docente_id === docenteId
                ? { ...docente, puede_crear_horarios: puedeCrearHorarios }
                : docente
            )
          );
          setMensajeHorarios("Permisos de creación actualizados correctamente");
          setTimeout(() => setMensajeHorarios(""), 3000);
        } else {
          setMensajeHorarios(`Error: ${data.mensaje}`);
          setTimeout(() => setMensajeHorarios(""), 3000);
        }
      } catch (error) {
        console.error("Error al actualizar permisos:", error);
        setMensajeHorarios("Error al actualizar permisos");
        setTimeout(() => setMensajeHorarios(""), 3000);
      } finally {
        setActualizandoPermisos(false);
      }
    };

    // Función para actualizar los permisos de un horario
    const actualizarPermisosHorario = async (
      horarioId,
      puedeEditar,
      puedeEliminar
    ) => {
      try {
        const response = await fetch(
          "http://localhost:8000/actualizar-permisos-horario/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              horario_id: horarioId,
              puede_editar: puedeEditar,
              puede_eliminar: puedeEliminar,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Error al actualizar los permisos");
        }

        // Actualizar localmente los permisos
        const data = await response.json();

        // Actualizar el estado local
        setHorariosDocentes((prevState) => {
          return prevState.map((docente) => {
            return {
              ...docente,
              horarios: docente.horarios.map((horario) => {
                if (horario.id === horarioId) {
                  return {
                    ...horario,
                    puede_editar: puedeEditar,
                    puede_eliminar: puedeEliminar,
                  };
                }
                return horario;
              }),
            };
          });
        });

        setMensajeHorarios("Permisos actualizados correctamente");
      } catch (error) {
        setMensajeHorarios(`Error: ${error.message}`);
      }
    };

    // Función para renderizar los horarios de los docentes
    const renderHorariosDocentes = () => {
      if (cargandoHorarios) {
        return <div className="cargando">Cargando horarios...</div>;
      }

      // Modificación aquí: necesitamos un estado para saber si ya se hizo una petición
      // Asumimos que hay un estado llamado 'peticionRealizada' que se actualiza en obtenerHorariosDocentes
      if (horariosDocentes.length === 0 && peticionRealizada) {
        return (
          <div className="director-horarios-sin-horarios">
            <p>No hay horarios registrados para los docentes a su cargo.</p>
            <button
              onClick={obtenerHorariosDocentes}
              className="director-refresh-button"
            >
              Actualizar
            </button>
          </div>
        );
      }

      // Si no hay horarios pero tampoco se ha hecho una petición aún, mostrar solo el botón
      if (horariosDocentes.length === 0 && !peticionRealizada) {
        return (
          <div className="director-horarios-sin-horarios">
            <p>Actualiza los horarios de los docentes a su cargo.</p>
            <button
              onClick={obtenerHorariosDocentes}
              className="director-refresh-button"
            >
              Actualizar
            </button>
          </div>
        );
      }

      // Filtrar los docentes por correo si hay un filtro
      const docentesFiltrados = filtroCorreoHorarios
        ? horariosDocentes.filter(docente =>
          docente.correo.toLowerCase().includes(filtroCorreoHorarios.toLowerCase())
        )
        : horariosDocentes;

      const toggleExpansionDocente = (docenteId) => {
        setDocentesExpandidos(prev => ({
          ...prev,
          [docenteId]: !prev[docenteId]
        }));
      };

      const toggleVistaExpandida = () => {
        setVistaExpandida(!vistaExpandida);
        // Si cambiamos a vista colapsada, resetear expansiones individuales
        if (vistaExpandida) {
          setDocentesExpandidos({});
        } else {
          // Si expandimos todo, marcar todos como expandidos
          const todosExpandidos = {};
          horariosDocentes.forEach(docente => {
            todosExpandidos[docente.docente_id] = true;
          });
          setDocentesExpandidos(todosExpandidos);
        }
      };

      return (
        <div className="director-docentes-horarios-container">
          <div className="director-filtros-horarios">
            <div className="director-buscador-container">
              <Search size={18} className="director-horarios-search-icon" />
              <input
                type="text"
                placeholder="Buscar docente por correo..."
                value={filtroCorreoHorarios}
                onChange={(e) => setFiltroCorreoHorarios(e.target.value)}
                className="director-buscador-input"
              />
              {filtroCorreoHorarios && (
                <button
                  onClick={() => setFiltroCorreoHorarios("")}
                  className="director-clear-search"
                >
                  ×
                </button>
              )}
            </div>

            <button
              onClick={toggleVistaExpandida}
              className={`director-vista-toggle ${vistaExpandida ? 'activa' : ''}`}
            >
              {vistaExpandida ? "Colapsar Todos" : "Expandir Todos"}
            </button>
          </div>

          {docentesFiltrados.length === 0 ? (
            <div className="director-horarios-sin-resultados">
              <p>No se encontraron docentes con ese correo.</p>
            </div>
          ) : (
            <div className="docentes-horarios-list">
              {docentesFiltrados.map((docente) => {
                const isExpanded = docentesExpandidos[docente.docente_id] || vistaExpandida;

                return (
                  <div key={docente.docente_id} className="docente-horarios-card">
                    <div
                      className="director-horarios-docente-info-header"
                      onClick={() => toggleExpansionDocente(docente.docente_id)}
                    >
                      <div className="director-horarios-docente-info">
                        <h3>{docente.correo}</h3>
                        <span className="subtipo-badge">{docente.subtipo_docente}</span>
                      </div>
                      <div className="permisos-globales">
                        <label className="permiso-creacion">
                          <input
                            type="checkbox"
                            checked={docente.puede_crear_horarios || false}
                            onChange={(e) => {
                              e.stopPropagation(); // Prevenir que se expanda al hacer clic en el checkbox
                              actualizarPermisosCreacionHorario(
                                docente.docente_id,
                                e.target.checked
                              );
                            }}
                            onClick={(e) => e.stopPropagation()} // También detener propagación en el click
                          />
                          Puede Crear Horarios
                        </label>
                      </div>
                      <button className="director-horarios-toggle-button">
                        {isExpanded ? "▼" : "►"}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="horarios-container">
                        <h4>Horarios Registrados</h4>
                        {docente.horarios.length > 0 ? (
                          <table className="horarios-table">
                            <thead>
                              <tr>
                                <th>Día</th>
                                <th>Fecha</th>
                                <th>Hora Inicio</th>
                                <th>Hora Fin</th>
                                <th>Permisos</th>
                              </tr>
                            </thead>
                            <tbody>
                              {docente.horarios.map((horario) => (
                                <tr key={horario.id}>
                                  <td>{horario.dia}</td>
                                  <td>{horario.fecha}</td>
                                  <td>{horario.hora_inicio}</td>
                                  <td>{horario.hora_fin}</td>
                                  <td className="permisos-cell">
                                    <div className="permisos-container">
                                      <div className="permiso-item">
                                        <label>
                                          <input
                                            type="checkbox"
                                            checked={horario.puede_editar}
                                            onChange={(e) =>
                                              actualizarPermisosHorario(
                                                horario.id,
                                                e.target.checked,
                                                horario.puede_eliminar
                                              )
                                            }
                                          />
                                          Puede Editar
                                        </label>
                                      </div>
                                      <div className="permiso-item">
                                        <label>
                                          <input
                                            type="checkbox"
                                            checked={horario.puede_eliminar}
                                            onChange={(e) =>
                                              actualizarPermisosHorario(
                                                horario.id,
                                                horario.puede_editar,
                                                e.target.checked
                                              )
                                            }
                                          />
                                          Puede Eliminar
                                        </label>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="director-horarios-sin-horarios-docente">Este docente no tiene horarios registrados.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {mensajeHorarios && (
            <div
              className={`mensaje-horarios ${mensajeHorarios.includes("Error") ? "error" : "exito"
                }`}
            >
              {mensajeHorarios}
            </div>
          )}

          <button
            onClick={obtenerHorariosDocentes}
            className="refresh-button"
            disabled={actualizandoPermisos}
          >
            {actualizandoPermisos ? "Actualizando..." : "Actualizar Horarios"}
          </button>
        </div>
      );
    };

    // Contenido específico para cada sección
    const sectionContents = {
      "gestion-estudiantes": (
        <div className="director-section-content">
          <h2>Gestión de Estudiantes</h2>
          <div className="director-user-management-buttons">
            <button
              onClick={() => setModoGestionEstudiantes("añadir")}
              className={
                modoGestionEstudiantes === "añadir"
                  ? "director-active-button"
                  : ""
              }
            >
              Añadir Estudiante
            </button>
            <button
              onClick={handleListarEstudiantes}
              className={
                modoGestionEstudiantes === "listar"
                  ? "director-active-button"
                  : ""
              }
            >
              Listar Estudiantes
            </button>
          </div>

          {modoGestionEstudiantes === "añadir" && (
            <form
              onSubmit={handleCrearEstudiante}
              className="director-user-form"
            >
              <div className="director-form-group">
                <label htmlFor="correo">Correo Electrónico</label>
                <input
                  type="email"
                  id="correo"
                  value={nuevoUsuario.correo}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })
                  }
                  required
                />
              </div>
              <div className="director-form-group">
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
              <div className="director-form-group">
                <label htmlFor="rol">Rol</label>
                <select
                  id="rol"
                  value={nuevoUsuario.rol}
                  onChange={handleRolChange}
                >
                  <option value="Estudiante">Estudiante</option>
                </select>
              </div>
              <div className="director-form-group">
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
              <div className="director-form-group">
                <label htmlFor="grupo">Grupo</label>
                <select
                  id="grupo"
                  value={nuevoUsuario.grupo}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, grupo: e.target.value })
                  }
                  required
                >
                  <option value="">Seleccione un grupo</option>
                  {['A', 'B', 'C', 'D', 'E'].map((letra) => (
                    <option key={letra} value={letra}>
                      {letra}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="director-submit-button">
                Crear Estudiante
              </button>
            </form>
          )}
          {modoGestionEstudiantes === "editar" && estudianteEdicion && (
            <form onSubmit={handleSubmitEdicion} className="director-user-form">
              <div className="director-form-group">
                <label htmlFor="correo">Correo Institucional</label>
                <input
                  type="email"
                  id="correo"
                  value={estudianteEdicion.correo}
                  onChange={(e) =>
                    setEstudianteEdicion({
                      ...estudianteEdicion,
                      correo: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="director-form-group">
                <label htmlFor="nombre_usuario">Nombre y Apellido</label>
                <input
                  type="text"
                  id="nombre_usuario"
                  value={estudianteEdicion.nombre_usuario}
                  onChange={(e) =>
                    setEstudianteEdicion({
                      ...estudianteEdicion,
                      nombre_usuario: e.target.value,
                    })

                  }
                  required
                />
              </div>
              <div className="director-form-group">
                <label htmlFor="password">Contraseña</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={estudianteEdicion.password}
                    onChange={(e) =>
                      setEstudianteEdicion({
                        ...estudianteEdicion,
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
              <div className="director-form-group">
                <label htmlFor="semestre">Semestre</label>
                <select
                  id="semestre"
                  value={estudianteEdicion.semestre}
                  onChange={(e) =>
                    setEstudianteEdicion({
                      ...estudianteEdicion,
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
              <div className="director-form-group">
                <label htmlFor="grupo">Grupo</label>
                <select
                  id="grupo"
                  value={estudianteEdicion.grupo}
                  onChange={(e) =>
                    setEstudianteEdicion({
                      ...estudianteEdicion,
                      grupo: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Seleccione un grupo</option>
                  {['A', 'B', 'C', 'D', 'E'].map((letra) => (
                    <option key={letra} value={letra}>
                      {letra}
                    </option>
                  ))}
                </select>
              </div>
              <div className="director-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={estudianteEdicion.is_active}
                    onChange={(e) =>
                      setEstudianteEdicion({
                        ...estudianteEdicion,
                        is_active: e.target.checked,
                      })
                    }
                  />
                  Cuenta Activa
                </label>
              </div>
              <div className="director-form-buttons">
                <button type="submit" className="director-submit-button">
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  className="director-cancel-button"
                  onClick={() => {
                    setModoGestionEstudiantes("listar");
                    setEstudianteEdicion(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
          {modoGestionEstudiantes === "listar" && renderListaEstudiantes()}

          {mensajeUsuario && (
            <div
              className={`director-mensaje ${mensajeUsuario.includes("exitosamente")
                ? "director-mensaje-exito"
                : "director-mensaje-error"
                }`}
            >
              {mensajeUsuario}
            </div>
          )}
        </div>
      ),
      "gestion-docentes": (
        <div className="director-section-content">
          <h2>Gestión de Docentes</h2>
          <div className="director-user-management-buttons">
            <button
              onClick={() => setModoGestionDocentes("añadir")}
              className={
                modoGestionDocentes === "añadir" ? "director-active-button" : ""
              }
            >
              Añadir Docente
            </button>
            <button
              onClick={handleListarDocentes}
              className={
                modoGestionDocentes === "listar" ? "director-active-button" : ""
              }
            >
              Listar Docentes
            </button>
          </div>

          {modoGestionDocentes === "añadir" && (
            <form onSubmit={handleCrearDocente} className="director-user-form">
              <div className="director-form-group">
                <label htmlFor="correoDocente">Correo Electrónico</label>
                <input
                  type="email"
                  id="correoDocente"
                  value={nuevoDocente.correo}
                  onChange={(e) =>
                    setNuevoDocente({ ...nuevoDocente, correo: e.target.value })
                  }
                  required
                />
              </div>
              <div className="director-form-group">
                <label htmlFor="nombre_usuario">Nombre y Apellido</label>
                <input
                  type="text"
                  id="nombre_usuario"
                  value={nuevoDocente.nombre_usuario}
                  onChange={(e) =>
                    setNuevoDocente({
                      ...nuevoDocente,
                      nombre_usuario: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="director-form-group">
                <label htmlFor="subtipoDocente">Subtipo de Docente</label>
                <select
                  id="subtipoDocente"
                  value={nuevoDocente.subtipo_docente}
                  onChange={(e) =>
                    setNuevoDocente({
                      ...nuevoDocente,
                      subtipo_docente: e.target.value,
                    })
                  }
                  required
                >
                  <option value="" disabled>
                    Seleccione un subtipo
                  </option>
                  <option value="Docente de Ing.Sistemas">
                    Docente de Ing.Sistemas
                  </option>
                  <option value="Docente de Ing.Electrónica">
                    Docente de Ing.Electrónica
                  </option>
                  <option value="Docente de Humanidades">
                    Docente de Humanidades
                  </option>
                  <option value="Docente de Idiomas">Docente de Idiomas</option>
                  <option value="Docente de Ciencias Básicas">
                    Docente de Ciencias Básicas
                  </option>
                </select>
              </div>
              <button type="submit" className="director-submit-button">
                Crear Docente
              </button>
            </form>
          )}

          {modoGestionDocentes === "editar" && docenteEdicion && (
            <form
              onSubmit={handleSubmitEdicionDocente}
              className="director-user-form"
            >
              <div className="director-form-group">
                <label htmlFor="correoDocenteEdit">Correo Institucional</label>
                <input
                  type="email"
                  id="correoDocenteEdit"
                  value={docenteEdicion.correo}
                  onChange={(e) =>
                    setDocenteEdicion({
                      ...docenteEdicion,
                      correo: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="director-form-group">
                <label htmlFor="nombre_usuarioEdit">Nombre y Apellido</label>
                <input
                  type="text"
                  id="nombre_usuarioEdit"
                  value={docenteEdicion.nombre_usuario}
                  onChange={(e) =>
                    setDocenteEdicion({
                      ...docenteEdicion,
                      nombre_usuario: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="director-form-group">
                <label htmlFor="subtipo">Subtipo de Docente</label>
                <input
                  type="text"
                  id="subtipo"
                  value={docenteEdicion.subtipo_docente}
                  disabled
                />
              </div>
              <div className="director-form-group">
                <label htmlFor="passwordDocente">Contraseña</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="passwordDocente"
                    value={docenteEdicion.password}
                    onChange={(e) =>
                      setDocenteEdicion({
                        ...docenteEdicion,
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
              <div className="director-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={docenteEdicion.is_active}
                    onChange={(e) =>
                      setDocenteEdicion({
                        ...docenteEdicion,
                        is_active: e.target.checked,
                      })
                    }
                  />
                  Cuenta Activa
                </label>
              </div>
              <div className="director-form-buttons">
                <button type="submit" className="director-submit-button">
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  className="director-cancel-button"
                  onClick={() => {
                    setModoGestionDocentes("listar");
                    setDocenteEdicion(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {modoGestionDocentes === "listar" && renderListaDocentes()}

          {mensajeUsuario && (
            <div
              className={`director-mensaje ${mensajeUsuario.includes("exitosamente")
                ? "director-mensaje-exito"
                : "director-mensaje-error"
                }`}
            >
              {mensajeUsuario}
            </div>
          )}
        </div>
      ),
      "gestion-horarios": (
        <div className="director-section-content">
          <h2>Gestión de Horarios de Docentes</h2>
          <div className="director-horarios-container">
            {renderHorariosDocentes()}
          </div>
        </div>
      ),
      /*"gestion-asignaturas": (
        <div className="director-section-content">
          <h2>Gestión de Asignaturas</h2>
          <p>Aquí se gestionarán las asignaturas.</p>
        </div>
      ),*/
      "gestion-asignaturas": gestionAsignaturasContent,
      "reportes-programa": (

        <ReportesPrograma />

      ),
      reportes: (
        /*<div className="director-section-content">
          <h2>Reportes del Departamento</h2>
          <p>Aquí son los Reportes de Asesorías - Departamentos -.</p>
        </div>*/
        <ReportesPrograma />
      ),
    };

    // Mostrar el contenido de la sección seleccionada o el contenido de bienvenida
    return activeSection && sectionContents[activeSection] ? (
      sectionContents[activeSection]
    ) : (
      <div className="director-welcome-content">
        <Carousel />
      </div>
    );
  };

  return (
    <div className="director-background-image">
      <div className="director-container">
        <nav className="director-navbar">
          <div className="director-navbar-content">
            <div className="director-top-row">
              <div className="director-nav-logo">
                <img
                  src={logoImage}
                  alt="Logo Cesmag"
                  className="director-logo-image"
                />
              </div>
              <h1 className="director-welcome-text">{welcomeText}, {usuario?.nombre_usuario}</h1>
              <div className="director-nav-centre-logo-container">
                <img
                  src={centreLogo}
                  alt="Logo Central"
                  className="director-centre-logo"
                />
              </div>
            </div>
            <div className="director-options-row">
              <ul className="director-nav-options">
                {options.map((option) => (
                  <li key={option.id}>
                    <a
                      href="#"
                      onClick={() => handleSectionClick(option.id)}
                      className={
                        activeSection === option.id ? "director-active" : ""
                      }
                      style={
                        option.color
                          ? { borderBottom: `3px solid ${option.color}` }
                          : {}
                      }
                    >
                      {option.icon && <option.icon size={18} />}
                      <span>{option.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>

        <div className="director-user-info">
          <p>Usuario: {usuario?.nombre_usuario} ({usuario?.correo})</p>
          <div className="docente-user-actions">
            <button className="docente-user-icon-button" onClick={(e) => toggleUserMenu(e)}>
              <User size={24} strokeWidth={2} />
            </button>
            <button className="director-logout-button" onClick={confirmLogout}>
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

        <div className="director-content-area">{renderSectionContent()}</div>

        {showLogoutConfirm && (
          <div className="director-logout-confirmation">
            <div className="director-confirmation-content">
              <img
                src={centreLogo}
                alt="Logo Central"
                className="director-confirmation-logo"
              />
              <p>¿Estás seguro que quieres cerrar sesión?</p>
              <button onClick={() => handleConfirmLogout(true)}>Sí</button>
              <button onClick={() => handleConfirmLogout(false)}>No</button>
            </div>
          </div>
        )}

        <div className="director-footer-bar">
          <img
            src={logoImage}
            alt="Logo Cesmag"
            className="director-footer-logo"
          />
          <span className="director-footer-text">
            Todos los derechos son reservados © {new Date().getFullYear()}
          </span>
          <img
            src={centreLogo}
            alt="Logo Central"
            className="director-footer-logo"
          />
        </div>
      </div>
    </div>
  );
};

export default Director;
