import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/PageDocente.css";
import logoImage from "../assets/logo_cesmag.png";
import centreLogo from "../assets/logo2.png";
import Carousel from "../components/carousel/carousel";
import VisualizarHorario from "../components/VisualizeHorario";
import { User, UserCircle, Lock, AlertTriangle, RefreshCw, } from "lucide-react";
import { Calendar, Book, Users, CalendarArrowUp } from "lucide-react";
import { CheckSquare, Clock, FileText } from "lucide-react";
import { CheckCircle, BookOpen, UserX, HelpCircle } from "lucide-react";
import { Eye, Clipboard, Star, MessageSquare, Filter, Download, ListChecks, AlertCircle } from "lucide-react";
import { Search, X, Database, BarChart2, PieChart, Settings, CalendarClock } from "lucide-react";
import Perfil from "./Perfil";
import CambiarClave from "./CambiarClave";
import VisualizarAsignatura from "../components/VisualizeAsignatura";

const MenuDocentes = () => {
  const navigate = useNavigate();
  const { logout, usuario } = useAuth();
  const [activeSection, setActiveSection] = useState("");
  const [dia, setDia] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPerfil, setShowPerfil] = useState(false);
  const [showCambiarClave, setShowCambiarClave] = useState(false);
  const [permisoEditar, setPermisoEditar] = useState(false);
  const [permisoEliminar, setPermisoEliminar] = useState(false);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [horarios, setHorarios] = useState([]);
  const [periodo, setPeriodo] = useState("");
  const [fechaInicioPeriodo, setFechaInicioPeriodo] = useState("");
  const [fechaFinPeriodo, setFechaFinPeriodo] = useState("");
  // Añade esto junto a los demás estados en la parte superior del componente
  const [asesoriasView, setAsesoriasView] = useState('estudiantes');
  // Estados para el permiso y notificaciones
  const [puedeCrearHorarios, setPuedeCrearHorarios] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  // Nuevo estado para controlar la verificación de permisos en curso
  const [verificandoPermisos, setVerificandoPermisos] = useState(false);

  const [asesoriasEstudiantes, setAsesoriasEstudiantes] = useState([]);

  const [asesoriasFinalizadas, setAsesoriasFinalizadas] = useState([]);
  const [fechaFiltroAsistencia, setFechaFiltroAsistencia] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [lugar, setLugar] = useState("");
  const [fechaInicioFiltro, setFechaInicioFiltro] = useState("");
  const [fechaFinFiltro, setFechaFinFiltro] = useState("");
  const [asignaturaFiltro, setAsignaturaFiltro] = useState("");
  const [estadoAsistioFiltro, setEstadoAsistioFiltro] = useState(true);
  const [estadoNoAsistioFiltro, setEstadoNoAsistioFiltro] = useState(true);
  const [asignaturas, setAsignaturas] = useState([]);
  const [cargandoExportacion, setCargandoExportacion] = useState(false);
  const [historialAsesorias, setHistorialAsesorias] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  const [totalAsesorias, setTotalAsesorias] = useState(0);
  const [filtrosAplicados, setFiltrosAplicados] = useState(false);
  const [asesoriaSeleccionada, setAsesoriaSeleccionada] = useState(null);
  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  const obtenerPeriodoVigente = async () => {
    try {
      const response = await fetch("http://localhost:8000/periodo-vigente/", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("No se pudo obtener el periodo vigente");
      const data = await response.json();
      setPeriodo(data.codigo);
      setFechaInicioPeriodo(data.fecha_inicio);
      setFechaFinPeriodo(data.fecha_fin);
    } catch (error) {
      console.error("Error al obtener el periodo vigente:", error);
      mostrarMensaje("Error al obtener el periodo vigente", "error");
    }
  };

  // Función para verificar si el docente tiene permiso para crear horarios
  const verificarPermisoCrearHorarios = async () => {
    // No verificar nuevamente si ya se está realizando una verificación
    if (verificandoPermisos) return puedeCrearHorarios; // Devuelve el valor actual si está verificando

    try {
      setVerificandoPermisos(true);
      const response = await fetch("http://localhost:8000/verificar-permiso-crear-horarios/", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al verificar permisos");
      }

      const data = await response.json();
      // Actualizar el estado de permisos sin mostrar el mensaje
      setPuedeCrearHorarios(data.puede_crear_horarios);
      return data.puede_crear_horarios;
    } catch (error) {
      console.error("Error al verificar permisos:", error);
      return false;
    } finally {
      setVerificandoPermisos(false);
    }
  };

  // Función para mostrar mensajes temporales
  const mostrarMensaje = (texto, tipo) => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    setTimeout(() => {
      setMensaje("");
      setTipoMensaje("");
    }, 3000);
  };

  useEffect(() => {
    obtenerPeriodoVigente();
    verificarPermisoCrearHorarios();

    // Eliminar horarios pasados al cargar el componente
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

    /*// Iniciar la verificación periódica de permisos (cada 30 segundos)
    const intervalId = setInterval(() => {
      verificarPermisoCrearHorarios();
    }, 30000);

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId);
  }, []);*/
  }, []);

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

  const handleRegistrarHorario = async (e) => {
    e.preventDefault();

    // Verificar si tiene permiso para crear horarios (verificación inmediata)
    await verificarPermisoCrearHorarios();

    if (!puedeCrearHorarios) {
      mostrarMensaje("No tienes permiso para crear horarios", "error");
      return;
    }

    // Validación de intervalos de 15 minutos
    if (!validateTimeInterval(horaInicio, horaFin)) {
      mostrarMensaje("La duración debe ser múltiplo de 15 minutos (15, 30, 45, 60 minutos, etc.)", "error");
      return;
    }

    // Validación de lugar
    if (!lugar.trim()) {
      mostrarMensaje("El lugar de encuentro es obligatorio", "error");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/registrar-horario/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          periodo,
          dia,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          lugar: lugar.trim(),  // Incluir el lugar en el cuerpo
        }),
      });

      const data = await response.json();

      if (response.ok) {
        mostrarMensaje("Horario registrado con éxito", "exito");
        setDia("");
        setHoraInicio("");
        setHoraFin("");
        setLugar("");  // Limpiar el campo de lugar

        // Si estamos en la sección de visualizar horario, actualizar la vista
        if (activeSection === "visualizar-horario") {
          setActiveSection("");
          setTimeout(() => setActiveSection("visualizar-horario"), 100);
        }
      } else {
        mostrarMensaje(data.mensaje || "Error al registrar horario", "error");
      }
    } catch (error) {
      console.error("Error al registrar horario:", error);
      mostrarMensaje("Error al conectar con el servidor", "error");
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

      mostrarMensaje("Horario editado con éxito", "exito");
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
      mostrarMensaje(error.message, "error");
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

      mostrarMensaje("Horario eliminado con éxito", "exito");

      // Actualizar la vista
      const updatedHorarios = horarios.filter(
        (h) => h.horario_id !== horarioId
      );
      setHorarios(updatedHorarios);
    } catch (error) {
      mostrarMensaje(error.message, "error");
    }
  };

  // Función para obtener las asesorías finalizadas
  const obtenerAsesoriasFinalizadas = async (filtro = '') => {
    try {
      let url = 'http://localhost:8000/asesorias-finalizadas-docente/';

      // Si el filtro es una fecha específica (formato YYYY-MM-DD)
      if (filtro && /^\d{4}-\d{2}-\d{2}$/.test(filtro)) {
        url += `?fecha=${filtro}`;
      }
      // Si es uno de nuestros nuevos filtros
      else if (['hoy', 'semana', 'mes', 'pasadas'].includes(filtro)) {
        url += `?filtro=${filtro}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al obtener las asesorías finalizadas');
      }

      const data = await response.json();
      setAsesoriasFinalizadas(data.asesorias);
      setFechaFiltroAsistencia(filtro);
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al cargar las asesorías finalizadas', 'error');
    }
  };
  // Función para actualizar la asistencia de una asesoría
  const actualizarAsistencia = async (asesoriaId, datos) => {
    try {
      // Primero obtenemos la asesoría para ver si es de un solo bloque
      const asesoria = asesoriasFinalizadas.find(a => a.id === asesoriaId);
      if (!asesoria) return;

      // Si es un solo bloque, sincronizamos los datos generales con el bloque único
      if (asesoria.es_bloque_unico) {
        const bloqueUnico = asesoria.bloques[0];
        datos = {
          ...datos,
          bloques: [{
            id: bloqueUnico.id,
            asistio: datos.asistio,
            temas_tratados: datos.temas_tratados || bloqueUnico.temas_tratados,
            observaciones: datos.observaciones || bloqueUnico.observaciones
          }]
        };
      }

      const response = await fetch(
        `http://localhost:8000/registrar-asistencia-asesoria/${asesoriaId}/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(datos),
        }
      );

      if (!response.ok) {
        throw new Error('Error al actualizar la asistencia');
      }

      mostrarMensaje('Asistencia registrada correctamente', 'exito');
      obtenerAsesoriasFinalizadas(fechaFiltroAsistencia);
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al registrar la asistencia', 'error');
    }
  };

  // Modificar la función que actualiza un bloque específico
  const actualizarAsistenciaBloque = async (asesoriaId, bloqueId, asistio, temasTratados, observaciones) => {
    try {
      const asesoriaActual = asesoriasFinalizadas.find(a => a.id === asesoriaId);
      if (!asesoriaActual) return;

      const bloquesActualizados = asesoriaActual.bloques.map(bloque => {
        if (bloque.id === bloqueId) {
          return {
            ...bloque,
            asistio: asistio,
            temas_tratados: temasTratados,
            observaciones: observaciones
          };
        }
        return bloque;
      });

      // Solo actualizamos asistencia general si NO es un bloque único
      const asistioGeneral = asesoriaActual.es_bloque_unico ?
        asistio : // Para bloque único, la asistencia general es igual a la del bloque
        bloquesActualizados.some(bloque => bloque.asistio); // Para múltiples bloques, si alguno tiene asistencia

      await actualizarAsistencia(asesoriaId, {
        asistio: asistioGeneral,
        temas_tratados: asesoriaActual.temas_tratados,
        observaciones: asesoriaActual.observaciones,
        compromisos: asesoriaActual.compromisos,
        bloques: bloquesActualizados
      });
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al actualizar la asistencia del bloque', 'error');
    }
  };
  // 3. Componente para renderizar un bloque individual de asesoría
  const BloqueAsistencia = ({ bloque, asesoriaId, actualizar, esUnico }) => {
    const [asistio, setAsistio] = useState(bloque.asistio || false);
    const [temasTratados, setTemasTratados] = useState(bloque.temas_tratados || '');
    const [observaciones, setObservaciones] = useState(bloque.observaciones || '');

    const handleChange = async (field, value) => {
      let newAsistio = asistio;
      let newTemas = temasTratados;
      let newObs = observaciones;

      if (field === 'asistio') {
        newAsistio = value;
        setAsistio(value);
      } else if (field === 'temasTratados') {
        newTemas = value;
        setTemasTratados(value);
      } else if (field === 'observaciones') {
        newObs = value;
        setObservaciones(value);
      }

      await actualizar(asesoriaId, bloque.id, newAsistio, newTemas, newObs);
    };

    return (
      <div className="docentes-asesorias-bloque-card">
        <div className="docentes-asesorias-bloque-header">
          {!esUnico && ( // Solo mostrar fecha/hora si no es único (para evitar duplicados)
            <div className="docentes-asesorias-bloque-fecha">
              <Calendar size={14} />
              <span>{formatFecha(bloque.fecha)}</span>
              <Clock size={14} />
              <span>{bloque.hora_inicio} - {bloque.hora_fin}</span>
            </div>
          )}
          <div className="docentes-asesorias-bloque-switch">
            <label className="docentes-asesorias-asistencia-switch-label">
              <input
                type="checkbox"
                checked={asistio}
                onChange={(e) => handleChange('asistio', e.target.checked)}
              />
              <span className="docentes-asesorias-asistencia-slider"></span>
            </label>
            <span className="docentes-asesorias-asistencia-switch-text">
              {esUnico ? 'Asistió a la asesoría' : 'Asistió a este bloque'}
            </span>
          </div>
        </div>

        <div className="docentes-asesorias-bloque-content">
          <div className="docentes-asesorias-bloque-form-field">
            <div className="docentes-asesorias-tab-header">
              <FileText size={16} />
              <label>{esUnico ? 'Temas tratados:' : 'Temas tratados en este bloque:'}</label>
            </div>
            <textarea
              value={temasTratados}
              onChange={(e) => setTemasTratados(e.target.value)}
              onBlur={(e) => handleChange('temasTratados', e.target.value)}
              placeholder={esUnico ? "Describe los temas tratados en la asesoría" : "Describe los temas tratados en este bloque"}
              rows="2"
              className="docentes-asesorias-asistencia-textarea"
            />
          </div>

          <div className="docentes-asesorias-bloque-form-field">
            <div className="docentes-asesorias-tab-header">
              <Eye size={16} />
              <label>{esUnico ? 'Observaciones:' : 'Observaciones para este bloque:'}</label>
            </div>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              onBlur={(e) => handleChange('observaciones', e.target.value)}
              placeholder={esUnico ? "Observaciones adicionales" : "Observaciones adicionales de este bloque"}
              rows="2"
              className="docentes-asesorias-asistencia-textarea"
            />
          </div>
        </div>
      </div>
    );
  };

  const handleSectionClick = async (section) => {
    // Determinar si vamos a activar o desactivar la sección
    const activatingSection = activeSection !== section;

    if (section === "estudiantes-asesorias" && activeSection !== section) {
      obtenerAsesoriasEstudiantes();
      if (asesoriasView === 'asistencia') {
        obtenerAsesoriasFinalizadas();
      }
    }

    // Si está activando la sección registrar-horario
    if (section === "registrar-horario" && activatingSection) {
      // Verificar los permisos en tiempo real y usar ese resultado
      const tienePermiso = await verificarPermisoCrearHorarios();

      if (!tienePermiso) {
        mostrarMensaje("No tienes permiso para registrar horarios", "error");
        return;
      } else {
        // Mostrar mensaje de éxito sólo cuando realmente tiene permiso
        mostrarMensaje("¡Ahora tienes permiso para registrar horarios!", "exito");
      }
    }

    obtenerPeriodoVigente();
    setActiveSection(activeSection === section ? "" : section);
    setShowPerfil(false);
    setShowCambiarClave(false);
    // Scroll to top of content area when switching sections
    window.scrollTo(0, 0);
  };

  const toggleUserMenu = (e) => {
    e.stopPropagation();  // Evita que el click cierre el menú inmediatamente
    verificarPermisoCrearHorarios();
    setShowUserMenu(!showUserMenu);
  };

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


  // Función para obtener las asesorías con estudiantes inscritos
  // Función para obtener las asesorías con estudiantes inscritos
  const obtenerAsesoriasEstudiantes = async (fecha = null) => {
    try {
      let url = "http://localhost:8000/asesorias-programadas-docente/";

      if (fecha) {
        // Usar comillas backtick para la interpolación de variables
        url += `?fecha=${fecha}`;
      }

      console.log("Consultando URL:", url); // Agregar log para depuración

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al obtener las asesorías");
      }

      const data = await response.json();
      console.log("Datos recibidos:", data); // Agregar log para depuración
      setAsesoriasEstudiantes(data.asesorias);
    } catch (error) {
      console.error("Error:", error);
      mostrarMensaje("Error al cargar los estudiantes inscritos", "error");
    }
  };

  // Función para formatear una fecha como YYYY-MM-DD
  const formatearFechaParaAPI = (fecha) => {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  // Función para manejar el cambio de filtro de fecha
  const handleFiltroFechaChange = (nuevoFiltro) => {
    setFiltroFecha(nuevoFiltro);

    // Si el filtro es "hoy", solicitamos específicamente las asesorías de hoy
    if (nuevoFiltro === 'hoy') {
      const fechaHoy = new Date();
      obtenerAsesoriasEstudiantes(formatearFechaParaAPI(fechaHoy));
    }
    // Para otros filtros, obtenemos todas y filtramos en el frontend
    else {
      obtenerAsesoriasEstudiantes();
    }
  };


  // Función para formatear fecha
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "";
    const fecha = new Date(fechaStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return fecha.toLocaleDateString('es-ES', { ...options, timeZone: 'UTC' });
  };
  {/* Función para formatear la fecha */ }
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';

    // Crear un objeto Date con la fecha recibida
    const fechaUTC = new Date(fechaStr);

    // Ajustar la zona horaria restando 5 horas
    const fechaLocal = new Date(fechaUTC.getTime() - (5 * 60 * 60 * 1000));

    // Array con los nombres de los meses en español
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Obtener los componentes de la fecha ajustada
    const dia = fechaLocal.getDate();
    const mes = meses[fechaLocal.getMonth()];
    const año = fechaLocal.getFullYear();

    // Obtener la hora en formato 12 horas
    let hora = fechaLocal.getHours();
    const minutos = fechaLocal.getMinutes().toString().padStart(2, '0');
    const ampm = hora >= 12 ? 'pm' : 'am';

    // Ajustar la hora al formato de 12 horas
    hora = hora % 12;
    hora = hora ? hora : 12; // Si es 0, cambiarlo a 12

    // Construir el string formateado
    return `${mes} ${dia} ${año} ${hora}:${minutos} ${ampm}`;
  }
  // Función para convertir horario a formato am/pm
  const formatearHorario = (hora) => {
    if (!hora) return "";

    const [horaStr, minutosStr] = hora.split(':');
    let horas = parseInt(horaStr, 10);
    const minutos = minutosStr || "00";
    const ampm = horas >= 12 ? 'pm' : 'am';
    horas = horas % 12;
    horas = horas ? horas : 12; // las 0 horas deben ser 12 en formato 12h

    return `${horas}:${minutos} ${ampm}`;
  };
  // Función dedicada para actualizar manualmente los permisos
  const actualizarPermisos = async () => {
    mostrarMensaje("Verificando permisos...", "info");
    const tienePermiso = await verificarPermisoCrearHorarios();
    if (tienePermiso) {
      mostrarMensaje("¡Tienes permiso para registrar horarios!", "exito");
    } else {
      mostrarMensaje("No tienes permiso para registrar horarios", "error");
    }
  };

  // Implementación recomendada para la función filtrarAsesorias
  const filtrarAsesorias = (asesorias) => {
    if (!asesorias || asesorias.length === 0) return [];

    // Crear fecha de hoy normalizada (UTC)
    const hoy = new Date();
    const hoyUTC = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));

    // Calcular rangos para semana y mes
    const diaSemana = hoy.getDay(); // 0 (domingo) a 6 (sábado)
    const inicioSemana = new Date(hoyUTC);
    inicioSemana.setUTCDate(hoyUTC.getUTCDate() - diaSemana);

    const finSemana = new Date(inicioSemana);
    finSemana.setUTCDate(inicioSemana.getUTCDate() + 6);

    const inicioMes = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), 1));
    const finMes = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth() + 1, 0));

    return asesorias.filter(asesoria => {
      // Parsear fecha de la asesoría (asumiendo formato YYYY-MM-DD)
      const fechaParts = (asesoria.fecha_inicio || asesoria.fecha).split('-');
      const fechaAsesoria = new Date(Date.UTC(
        parseInt(fechaParts[0]),
        parseInt(fechaParts[1]) - 1,
        parseInt(fechaParts[2])
      ));

      switch (filtroFecha) {
        case 'hoy':
          return fechaAsesoria.getTime() === hoyUTC.getTime();

        case 'semana':
          return fechaAsesoria >= inicioSemana && fechaAsesoria <= finSemana;

        case 'mes':
          return fechaAsesoria >= inicioMes && fechaAsesoria <= finMes;

        case 'futuras':
          return fechaAsesoria > hoyUTC;

        case 'pasadas':
          return fechaAsesoria < hoyUTC;

        default:
          return true;
      }
    });
  };
  // Añadir esta función para obtener las asignaturas del docente
  const obtenerAsignaturas = async () => {
    try {
      const response = await fetch("http://localhost:8000/obtener-asignaturas-docente/", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("No se pudieron obtener las asignaturas");
      const data = await response.json();
      setAsignaturas(data.asignaturas);
    } catch (error) {
      console.error("Error al obtener asignaturas:", error);
    }
  };

  // Añadir esta llamada al useEffect inicial
  useEffect(() => {
    obtenerPeriodoVigente();
    verificarPermisoCrearHorarios();
    obtenerAsignaturas(); // Añadir esta línea

    // El resto del código existente...
  }, []);

  // Añadir esta función para exportar el historial
  const exportarHistorial = async () => {
    try {
      setCargandoExportacion(true);

      // Construir la URL con los parámetros de filtro
      let url = "http://localhost:8000/exportar-historial-asesorias/?";

      if (fechaInicioFiltro) {
        url += `fecha_inicio=${fechaInicioFiltro}&`;
      }

      if (fechaFinFiltro) {
        url += `fecha_fin=${fechaFinFiltro}&`;
      }

      if (asignaturaFiltro) {
        url += `asignatura_id=${asignaturaFiltro}&`;
      }

      // Modificación: Revisar y aplicar correctamente los filtros de asistencia
      if (estadoAsistioFiltro && !estadoNoAsistioFiltro) {
        url += `estado=asistio&`;
      } else if (!estadoAsistioFiltro && estadoNoAsistioFiltro) {
        url += `estado=no_asistio&`;
      } else if (!estadoAsistioFiltro && !estadoNoAsistioFiltro) {
        mostrarMensaje("Seleccione al menos un estado de asistencia para exportar", "error");
        setCargandoExportacion(false);
        return;
      }
      // Si ambos están seleccionados, no se aplica filtro de asistencia

      // Realizar la solicitud para exportar
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al exportar el historial");
      }

      // Obtener el blob del archivo Excel
      const blob = await response.blob();

      // Crear un enlace para descargar el archivo
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Obtener el nombre del archivo desde los headers o usar uno predeterminado
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'Historial_Asesorias.xlsx';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      mostrarMensaje("Historial exportado correctamente", "exito");
    } catch (error) {
      console.error("Error al exportar historial:", error);
      mostrarMensaje("Error al exportar el historial", "error");
    } finally {
      setCargandoExportacion(false);
    }
  };
  // Añadir esta función para cargar el historial de asesorías
  const cargarHistorialAsesorias = async (pagina = 1, aplicarFiltros = false) => {
    try {
      setCargandoHistorial(true);

      // Construir la URL con los parámetros de paginación y filtros
      let url = `http://localhost:8000/historial-asesorias/?pagina=${pagina}&items_por_pagina=${itemsPorPagina}`;

      // Añadir filtros si están aplicados
      if (aplicarFiltros) {
        if (fechaInicioFiltro) {
          url += `&fecha_inicio=${fechaInicioFiltro}`;
        }

        if (fechaFinFiltro) {
          url += `&fecha_fin=${fechaFinFiltro}`;
        }

        if (asignaturaFiltro) {
          url += `&asignatura_id=${asignaturaFiltro}`;
        }

        if (estadoAsistioFiltro && !estadoNoAsistioFiltro) {
          url += `&asistio=true`;
        } else if (!estadoAsistioFiltro && estadoNoAsistioFiltro) {
          url += `&asistio=false`;
        } else if (!estadoAsistioFiltro && !estadoNoAsistioFiltro) {
          // No mostrar nada o mostrar alerta (aquí lo mejor sería prevenirlo)
          setHistorialAsesorias([]);  // Limpiar lista
          setTotalPaginas(1);
          setTotalAsesorias(0);
          mostrarMensaje("Seleccione al menos un estado de asistencia", "error");
          setCargandoHistorial(false);
          return;
        }

      }

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al cargar el historial de asesorías");
      }

      const data = await response.json();

      setHistorialAsesorias(data.asesorias);
      setPaginaActual(data.paginacion.pagina_actual);
      setTotalPaginas(data.paginacion.total_paginas);
      setTotalAsesorias(data.paginacion.total);

      if (aplicarFiltros) {
        setFiltrosAplicados(true);
        mostrarMensaje("Filtros aplicados correctamente", "exito");
      }
    } catch (error) {
      console.error("Error al cargar historial:", error);
      mostrarMensaje("Error al cargar el historial de asesorías", "error");
    } finally {
      setCargandoHistorial(false);
    }
  };


  // Añadir esta función para aplicar los filtros
  const aplicarFiltros = () => {
    cargarHistorialAsesorias(1, true);
  };

  // Modificar la función limpiarFiltros
  const limpiarFiltros = () => {
    setFechaInicioFiltro("");
    setFechaFinFiltro("");
    setAsignaturaFiltro("");
    setEstadoAsistioFiltro(true);
    setEstadoNoAsistioFiltro(true);
    setFiltrosAplicados(false);
    cargarHistorialAsesorias(1, false);
    mostrarMensaje("Filtros limpiados", "exito");
  };
  // Añadir función para cambiar de página
  const cambiarPagina = (nuevaPagina) => {
    cargarHistorialAsesorias(nuevaPagina, filtrosAplicados);
  };
  // Modificar el useEffect para cargar el historial cuando se seleccione la sección correspondiente
  useEffect(() => {
    if (activeSection === "historial") {
      cargarHistorialAsesorias();
    }
  }, [activeSection]);

  useEffect(() => {
    // Cargar datos iniciales
    obtenerAsesoriasEstudiantes();

    // Opcional: Configurar un intervalo para refrescar datos periódicamente
    const intervalo = setInterval(() => {
      // Mantener el mismo filtro que esté activo
      if (filtroFecha === 'hoy') {
        const fechaHoy = new Date();
        obtenerAsesoriasEstudiantes(formatearFechaParaAPI(fechaHoy));
      } else {
        obtenerAsesoriasEstudiantes();
      }
    }, 300000); // Cada 5 minutos

    // Limpiar el intervalo al desmontar
    return () => clearInterval(intervalo);
  }, []); // Dependencias vacías para ejecutarse solo al montar
  // Función para ver detalles de una asesoría específica
  const verDetallesAsesoria = async (asesoriaId) => {
    try {
      setCargandoDetalles(true);

      // Buscar la asesoría en los datos ya cargados
      const asesoria = historialAsesorias.find(a => a.id === asesoriaId);

      if (asesoria) {
        setAsesoriaSeleccionada(asesoria);
        setMostrarModalDetalles(true);
      } else {
        // Si por alguna razón no está en el historial actual, cargarla desde el backend
        const response = await fetch(`http://localhost:8000/obtener-asesoria/${asesoriaId}/`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Error al cargar los detalles de la asesoría");
        }

        const data = await response.json();
        setAsesoriaSeleccionada(data);
        setMostrarModalDetalles(true);
      }
    } catch (error) {
      console.error("Error al cargar detalles:", error);
      mostrarMensaje("Error al cargar los detalles de la asesoría", "error");
    } finally {
      setCargandoDetalles(false);
    }
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
          <div className="docente-section-content docente-horario-section">
            <div className="docente-horario-header">
              <h2>Registrar Horario</h2>
              <div className="docente-periodo-info">
                <span className="docente-periodo-dates">Periodo:</span>
                <div className="docente-periodo-badge">{periodo || "Cargando..."}</div>
                <p>
                  Fechas:{" "}
                  <span className="docente-periodo-dates">
                    {fechaInicioPeriodo && fechaFinPeriodo
                      ? `${new Date(fechaInicioPeriodo).toLocaleDateString('es-ES', { timeZone: 'UTC' })} - ${new Date(
                        fechaFinPeriodo
                      ).toLocaleDateString('es-ES', { timeZone: 'UTC' })}`
                      : "Cargando fechas..."}
                  </span>
                </p>
              </div>
            </div>

            {puedeCrearHorarios ? (
              <form onSubmit={handleRegistrarHorario} className="docente-horario-form">
                <div className="docente-form-grid">
                  {/* Sección combinada de día y horario */}
                  <div className="docente-day-time-container">
                    {/* Día */}
                    <div className="docente-form-group docente-day-group">
                      <label htmlFor="dia">
                        <span className="docente-label-text">Día de la semana</span>
                        <select
                          id="dia"
                          value={dia}
                          onChange={(e) => setDia(e.target.value)}
                          required
                          className="docente-form-control"
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

                    {/* Horario compacto */}
                    <div className="docente-time-inputs-compact">
                      <div className="docente-form-group">
                        <label htmlFor="hora-inicio">
                          <span className="docente-label-text">Hora Inicio</span>
                          <div className="docente-time-input-wrapper">
                            <input
                              id="hora-inicio"
                              type="time"
                              value={horaInicio}
                              onChange={(e) => setHoraInicio(e.target.value)}
                              min="07:00"
                              max="19:45"
                              step="900"
                              required
                              className="docente-form-control"
                            />
                            <span className="docente-time-icon">🕗</span>
                          </div>
                        </label>
                      </div>

                      <div className="docente-form-group">
                        <label htmlFor="hora-fin">
                          <span className="docente-label-text">Hora Fin</span>
                          <div className="docente-time-input-wrapper">
                            <input
                              id="hora-fin"
                              type="time"
                              value={horaFin}
                              onChange={(e) => setHoraFin(e.target.value)}
                              min="07:15"
                              max="20:00"
                              step="900"
                              required
                              className="docente-form-control"
                            />
                            <span className="docente-time-icon">🕘</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Lugar */}
                  <div className="docente-form-group docente-location-group">
                    <label htmlFor="lugar">
                      <span className="docente-label-text">Lugar de encuentro para todos los bloques de horario de asesoría</span>
                      <div className="docente-location-input-wrapper">
                        <input
                          id="lugar"
                          type="text"
                          value={lugar}
                          onChange={(e) => setLugar(e.target.value)}
                          placeholder="Ej: Aula Hall San Francisco, Aula 2, Piso 3 Edificio Italia"
                          required
                          className="docente-form-control"
                        />
                        <span className="docente-location-icon">📍</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="docente-horario-info">
                  <div className="docente-info-icon">ℹ️</div>
                  <div className="docente-info-text">
                    <p>
                      Este horario se aplicará a todos los{" "}
                      {dia.toLowerCase() || "días seleccionados"} del periodo académico.
                    </p>
                    <p>
                      El horario debe estar entre las <strong>7:00 AM</strong> y las{" "}
                      <strong>8:00 PM</strong>.
                    </p>
                    <p>
                      <strong>Formato requerido:</strong> Los horarios deben comenzar y terminar en intervalos de <strong>15 minutos exactos</strong> (00, 15, 30 ó 45).<br />
                      Ejemplos válidos: <strong>7:00-7:15</strong> | <strong>12:30-12:45</strong><br />
                      No válidos: 7:05-7:20 | 12:20-12:35
                    </p>
                    <p>
                      Si deseas editar algún bloque de horario, lo puedes hacer en la sesión de{" "}
                      <strong>Visualizar Horario</strong> con permiso del <strong>Director</strong>.
                    </p>
                  </div>
                </div>

                {/* Botón de submit */}
                <button type="submit" className="docente-submit-button">
                  <span className="docente-button-icon">✓</span>
                  <span>Registrar Horario</span>
                </button>
              </form>
            ) : (
              <div className="docente-no-permission">
                <div className="docente-no-permission-icon">
                  <AlertTriangle size={48} />
                </div>
                <div className="docente-no-permission-message">
                  <h3>No tienes permiso para registrar horarios</h3>
                  <p>Comunícate con el director de programa para solicitar el permiso.</p>
                  <button
                    className="docente-refresh-permissions-button"
                    onClick={actualizarPermisos}
                    disabled={verificandoPermisos}
                  >
                    <div className="docente-refresh-button-content">
                      <RefreshCw
                        size={20}
                        className={`docente-refresh-icon ${verificandoPermisos ? "spin" : ""}`}
                      />
                      <span>Verificar permisos</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
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
          <div>
            <VisualizarAsignatura />
          </div>
        );
      case "estudiantes-asesorias":
        return (
          <div className="docente-section-content docente-asesorias-section">
            <div className="docente-asesorias-header">
              <div className="docente-asesorias-title-container">
                <h2>Gestión de Asesorías</h2>
                <div className="docente-asesorias-subtitle">
                  <Calendar size={18} />
                  <span>Centro de asesorías académicas</span>
                </div>
              </div>
              <div className="docente-asesorias-stats">
                <div className="docente-stat-card">
                  <div className="docente-stat-icon">
                    <Users size={18} />
                  </div>
                  <div className="docente-stat-info">
                    <span className="docente-stat-value">{asesoriasEstudiantes.length}</span>
                    <span className="docente-stat-label">Estudiantes</span>
                  </div>
                </div>
                <div className="docente-stat-card">
                  <div className="docente-stat-icon">
                    <CheckCircle size={18} />
                  </div>
                  <div className="docente-stat-info">
                    <span className="docente-stat-value">{asesoriasFinalizadas.filter(a => a.asistio).length}</span>
                    <span className="docente-stat-label">Asistencias</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="docente-asesorias-nav">
              <button
                className={`docente-asesoria-nav-button ${asesoriasView === 'estudiantes' ? 'active' : ''}`}
                onClick={() => setAsesoriasView('estudiantes')}
              >
                <div className="docente-nav-button-icon">
                  <CalendarClock size={18} />
                </div>
                <span>Asesorías Pendientes</span>
              </button>
              <button
                className={`docente-asesoria-nav-button ${asesoriasView === 'asistencia' ? 'active' : ''}`}
                onClick={() => setAsesoriasView('asistencia')}
              >
                <div className="docente-nav-button-icon">
                  <CheckSquare size={18} />
                </div>
                <span>Registrar Asistencia</span>
              </button>
              <button
                className={`docente-asesoria-nav-button ${asesoriasView === 'historial' ? 'active' : ''}`}
                onClick={() => setAsesoriasView('historial')}
              >
                <div className="docente-nav-button-icon">
                  <Clock size={18} />
                </div>
                <span>Historial de Asesorías</span>
              </button>
            </div>

            <div className="docente-asesorias-content">
              {asesoriasView === 'estudiantes' && (
                <div className="docente-asesorias-pendientes-view">
                  <div className="docente-asesorias-pendientes-header">
                    <div className="docente-asesorias-pendientes-title">
                      <CalendarClock size={20} />
                      <h3>Asesorías Pendientes</h3>
                    </div>
                    {/* Botones de filtro de fecha */}
                    <div className="docente-asesorias-pendientes-filter-section">
                      <div className="docente-asesorias-pendientes-filter-buttons">
                        <button
                          className={`docente-asesorias-pendientes-filter-button ${filtroFecha === 'hoy' ? 'active' : ''}`}
                          onClick={() => handleFiltroFechaChange('hoy')}
                        >
                          Hoy
                        </button>
                        <button
                          className={`docente-asesorias-pendientes-filter-button ${filtroFecha === 'semana' ? 'active' : ''}`}
                          onClick={() => handleFiltroFechaChange('semana')}
                        >
                          Esta Semana
                        </button>
                        <button
                          className={`docente-asesorias-pendientes-filter-button ${filtroFecha === 'mes' ? 'active' : ''}`}
                          onClick={() => handleFiltroFechaChange('mes')}
                        >
                          Este Mes
                        </button>
                        <button
                          className={`docente-asesorias-pendientes-filter-button ${filtroFecha === 'futuras' ? 'active' : ''}`}
                          onClick={() => handleFiltroFechaChange('futuras')}
                        >
                          Futuras
                        </button>
                      </div>
                      <button
                        onClick={() => handleFiltroFechaChange('')}
                        className={`docente-asesorias-pendientes-refresh-button ${filtroFecha === '' ? 'active' : ''}`}
                      >
                        <RefreshCw size={16} />
                        <span>Todos</span>
                      </button>
                    </div>
                  </div>

                  {filtrarAsesorias(asesoriasEstudiantes).length > 0 ? (
                    <div className="docente-asesorias-pendientes-grid">
                      {filtrarAsesorias(asesoriasEstudiantes).map((asesoria) => (
                        <div key={asesoria.id} className="docente-asesorias-pendientes-card">
                          <div className="docente-asesorias-pendientes-card-header">
                            <div className="docente-asesorias-pendientes-header-left">
                              <div className="docente-asesorias-pendientes-asignatura-badge">{asesoria.asignatura}</div>
                              <div className="docente-asesorias-pendientes-fecha">
                                <Calendar size={14} />
                                <span>{formatFecha(asesoria.fecha_inicio || asesoria.fecha)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="docente-asesorias-pendientes-content">
                            {/* Perfil del estudiante */}
                            <div className="docente-asesorias-pendientes-profile">
                              <div className="docente-asesorias-pendientes-avatar">
                                <User size={24} />
                              </div>
                              <div className="docente-asesorias-pendientes-details">
                                <h4>{asesoria.estudiante.correo}</h4>
                                <div className="docente-asesorias-pendientes-metadata">
                                  <span className="docente-asesorias-pendientes-badge">
                                    <BookOpen size={12} />
                                    <span>Semestre {asesoria.estudiante.semestre}</span>
                                  </span>
                                  {asesoria.estudiante.grupo && (
                                    <span className="docente-asesorias-pendientes-badge">
                                      <Users size={12} />
                                      <span>Grupo {asesoria.estudiante.grupo}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Sección de bloques */}
                            <div className="docente-asesorias-pendientes-bloques-section">
                              <div className="docente-asesorias-pendientes-section-title">
                                <Clock size={16} />
                                <h4>Horarios programados</h4>
                              </div>

                              {asesoria.bloques && asesoria.bloques.length > 0 ? (
                                <div className="docente-asesorias-pendientes-bloques-list">
                                  {asesoria.bloques.map((bloque, index) => (
                                    <div key={index} className="docente-asesorias-pendientes-bloque-card">
                                      <div className="docente-asesorias-pendientes-bloque-header">
                                        <div className="docente-asesorias-pendientes-bloque-fecha">
                                          <Clock size={14} />
                                          <span>{formatearHorario(bloque.hora_inicio)} - {formatearHorario(bloque.hora_fin)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="docente-asesorias-pendientes-bloque-card">
                                  <div className="docente-asesorias-pendientes-bloque-header">
                                    <div className="docente-asesorias-pendientes-bloque-fecha">
                                      <Clock size={14} />
                                      <span>{formatearHorario(asesoria.hora_inicio)} - {formatearHorario(asesoria.hora_fin)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Motivo de la asesoría */}
                            <div className="docente-asesorias-pendientes-general">
                              <div className="docente-asesorias-pendientes-section-title">
                                <MessageSquare size={16} />
                                <h4>Motivo de asesoría</h4>
                              </div>
                              <p>{asesoria.motivo || "No especificado"}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="docente-asesorias-pendientes-empty-state">
                      <div className="docente-asesorias-pendientes-empty-icon">
                        <UserX size={48} />
                      </div>
                      <h4>No hay asesorías pendientes</h4>
                      <p>No se encontraron estudiantes inscritos en asesorías actualmente.</p>
                    </div>
                  )}
                </div>
              )}

              {asesoriasView === 'asistencia' && (
                <div className="docentes-asesorias-asistencia-view">
                  <div className="docentes-asesorias-asistencia-header">
                    <div className="docentes-asesorias-asistencia-title">
                      <CheckSquare size={20} />
                      <h3>Registrar Asistencia</h3>
                    </div>
                    <p className="docentes-asesorias-asistencia-description">
                      Registra la asistencia, temas tratados y observaciones de las asesorías finalizadas.
                    </p>

                    <div className="docentes-asesorias-asistencia-filter-section">
                      <div className="docentes-asesorias-asistencia-filter-buttons">
                        <button
                          className={`docentes-asesorias-asistencia-filter-button ${filtroFecha === 'hoy' ? 'active' : ''}`}
                          onClick={() => {
                            setFiltroFecha('hoy');
                            obtenerAsesoriasFinalizadas('hoy');
                          }}
                        >
                          Hoy
                        </button>
                        <button
                          className={`docentes-asesorias-asistencia-filter-button ${filtroFecha === 'semana' ? 'active' : ''}`}
                          onClick={() => {
                            setFiltroFecha('semana');
                            obtenerAsesoriasFinalizadas('semana');
                          }}
                        >
                          Esta Semana
                        </button>
                        <button
                          className={`docentes-asesorias-asistencia-filter-button ${filtroFecha === 'mes' ? 'active' : ''}`}
                          onClick={() => {
                            setFiltroFecha('mes');
                            obtenerAsesoriasFinalizadas('mes');
                          }}
                        >
                          Este Mes
                        </button>
                        <button
                          className={`docentes-asesorias-asistencia-filter-button ${filtroFecha === 'pasadas' ? 'active' : ''}`}
                          onClick={() => {
                            setFiltroFecha('pasadas');
                            obtenerAsesoriasFinalizadas('pasadas');
                          }}
                        >
                          Pasadas
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setFiltroFecha('');
                          obtenerAsesoriasFinalizadas();
                        }}
                        className={`docentes-asesorias-asistencia-refresh-button ${filtroFecha === '' ? 'active' : ''}`}
                      >
                        <RefreshCw size={16} />
                        <span>Todos</span>
                      </button>
                    </div>
                  </div>

                  {filtrarAsesorias(asesoriasFinalizadas).map((asesoria) => (
                    <div key={asesoria.id} className="docentes-asesorias-asistencia-card">
                      <div className="docentes-asesorias-asistencia-card-header">
                        <div className="docentes-asesorias-asistencia-header-left">
                          <div className="docentes-asesorias-asistencia-asignatura-badge">{asesoria.asignatura}</div>
                          <div className="docentes-asesorias-asistencia-fecha">
                            <Calendar size={14} />
                            <span>{formatFecha(asesoria.fecha)}</span>
                          </div>
                        </div>
                        <div className="docentes-asesorias-asistencia-status">
                          {asesoria.asistio ? (
                            <span className="docentes-asesorias-asistencia-status-badge success">
                              <CheckCircle size={14} />
                              <span>Asistió</span>
                            </span>
                          ) : (
                            <span className="docentes-asesorias-asistencia-status-badge pending">
                              <HelpCircle size={14} />
                              <span>Pendiente</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="docentes-asesorias-asistencia-content">
                        <div className="docentes-asesorias-asistencia-profile">
                          <div className="docentes-asesorias-asistencia-avatar">
                            <User size={28} />
                          </div>
                          <div className="docentes-asesorias-asistencia-details">
                            <h4>{asesoria.estudiante.correo}</h4>
                            <div className="docentes-asesorias-asistencia-metadata">
                              <span className="docentes-asesorias-asistencia-badge">
                                <BookOpen size={12} />
                                <span>Semestre {asesoria.estudiante.semestre}</span>
                              </span>
                              {asesoria.estudiante.grupo && (
                                <span className="docentes-asesorias-asistencia-badge">
                                  <Users size={12} />
                                  <span>Grupo {asesoria.estudiante.grupo}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bloques de Horario con hora visible para bloques individuales */}
                        <div className="docentes-asesorias-bloques-section">
                          <h4 className="docentes-asesorias-section-title">
                            <Clock size={16} />
                            <span>Bloques de Horario ({asesoria.bloques ? asesoria.bloques.length : 0})</span>
                          </h4>

                          {asesoria.bloques && asesoria.bloques.length > 0 ? (
                            <div className="docentes-asesorias-bloques-list">
                              {asesoria.bloques.map((bloque) => (
                                <div key={`${asesoria.id}-bloque-${bloque.id}`} className="docentes-asesorias-bloque-card">
                                  <div className="docentes-asesorias-bloque-header">
                                    {!asesoria.es_bloque_unico && (
                                      <div className="docentes-asesorias-bloque-fecha">
                                        <Calendar size={14} />
                                        <span>{formatFecha(bloque.fecha)}</span>
                                        <Clock size={14} />
                                        <span>{bloque.hora_inicio} - {bloque.hora_fin}</span>
                                      </div>
                                    )}
                                    {asesoria.es_bloque_unico && (
                                      <div className="docentes-asesorias-bloque-hora">
                                        <Clock size={14} />
                                        <span>{bloque.hora_inicio} - {bloque.hora_fin}</span>
                                      </div>
                                    )}
                                    <div className="docentes-asesorias-bloque-switch">
                                      <label className="docentes-asesorias-asistencia-switch-label">
                                        <input
                                          type="checkbox"
                                          checked={bloque.asistio || false}
                                          onChange={(e) => {
                                            actualizarAsistenciaBloque(
                                              asesoria.id,
                                              bloque.id,
                                              e.target.checked,
                                              bloque.temas_tratados,
                                              bloque.observaciones
                                            );
                                          }}
                                        />
                                        <span className="docentes-asesorias-asistencia-slider"></span>
                                      </label>
                                      <span className="docentes-asesorias-asistencia-switch-text">
                                        {asesoria.es_bloque_unico ? 'Asistió a la asesoría' : 'Asistió a este bloque'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="docentes-asesorias-bloque-content">
                                    <div className="docentes-asesorias-bloque-form-field">
                                      <div className="docentes-asesorias-tab-header">
                                        <FileText size={16} />
                                        <label>{asesoria.es_bloque_unico ? 'Temas tratados:' : 'Temas tratados en este bloque:'}</label>
                                      </div>
                                      <textarea
                                        value={bloque.temas_tratados || ''}
                                        onChange={(e) => {
                                          const updatedAsesorias = asesoriasFinalizadas.map(a => {
                                            if (a.id === asesoria.id) {
                                              const updatedBloques = a.bloques.map(b =>
                                                b.id === bloque.id ? { ...b, temas_tratados: e.target.value } : b
                                              );
                                              return { ...a, bloques: updatedBloques };
                                            }
                                            return a;
                                          });
                                          setAsesoriasFinalizadas(updatedAsesorias);
                                        }}
                                        onBlur={(e) => {
                                          actualizarAsistenciaBloque(
                                            asesoria.id,
                                            bloque.id,
                                            bloque.asistio,
                                            e.target.value,
                                            bloque.observaciones
                                          );
                                        }}
                                        placeholder={asesoria.es_bloque_unico ? "Describe los temas tratados en la asesoría" : "Describe los temas tratados en este bloque"}
                                        rows="2"
                                        className="docentes-asesorias-asistencia-textarea"
                                      />
                                    </div>

                                    <div className="docentes-asesorias-bloque-form-field">
                                      <div className="docentes-asesorias-tab-header">
                                        <Eye size={16} />
                                        <label>{asesoria.es_bloque_unico ? 'Observaciones:' : 'Observaciones para este bloque:'}</label>
                                      </div>
                                      <textarea
                                        value={bloque.observaciones || ''}
                                        onChange={(e) => {
                                          const updatedAsesorias = asesoriasFinalizadas.map(a => {
                                            if (a.id === asesoria.id) {
                                              const updatedBloques = a.bloques.map(b =>
                                                b.id === bloque.id ? { ...b, observaciones: e.target.value } : b
                                              );
                                              return { ...a, bloques: updatedBloques };
                                            }
                                            return a;
                                          });
                                          setAsesoriasFinalizadas(updatedAsesorias);
                                        }}
                                        onBlur={(e) => {
                                          actualizarAsistenciaBloque(
                                            asesoria.id,
                                            bloque.id,
                                            bloque.asistio,
                                            bloque.temas_tratados,
                                            e.target.value
                                          );
                                        }}
                                        placeholder={asesoria.es_bloque_unico ? "Observaciones adicionales" : "Observaciones adicionales de este bloque"}
                                        rows="2"
                                        className="docentes-asesorias-asistencia-textarea"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="docentes-asesorias-bloques-empty">
                              <AlertCircle size={18} />
                              <span>No hay bloques de horario disponibles</span>
                            </div>
                          )}
                        </div>

                        {/* Información General de la Asesoría - Solo compromisos */}
                        <div className="docentes-asesorias-asistencia-general">
                          <h4 className="docentes-asesorias-section-title">
                            <ListChecks size={16} />
                            <span>Información General</span>
                          </h4>

                          <div className="docentes-asesorias-asistencia-form">
                            <div className="docentes-asesorias-asistencia-tab">
                              <div className="docentes-asesorias-asistencia-tab-header">
                                <Clipboard size={16} />
                                <label>Compromisos:</label>
                              </div>
                              <textarea
                                value={asesoria.compromisos || ''}
                                onChange={(e) => {
                                  const updatedAsesorias = asesoriasFinalizadas.map(a =>
                                    a.id === asesoria.id ? { ...a, compromisos: e.target.value } : a
                                  );
                                  setAsesoriasFinalizadas(updatedAsesorias);
                                }}
                                onBlur={(e) => {
                                  actualizarAsistencia(asesoria.id, {
                                    asistio: asesoria.asistio,
                                    temas_tratados: asesoria.temas_tratados,
                                    observaciones: asesoria.observaciones,
                                    compromisos: e.target.value
                                  });
                                }}
                                placeholder="Compromisos adquiridos para futuras asesorías"
                                rows="2"
                                className="docentes-asesorias-asistencia-textarea"
                              />
                            </div>
                          </div>
                        </div>

                        {asesoria.calificacion && (
                          <div className="docentes-asesorias-asistencia-calificacion">
                            <div className="docentes-asesorias-asistencia-calificacion-header">
                              <Star size={16} />
                              <h4>Calificación del estudiante</h4>
                            </div>
                            <div className="docentes-asesorias-asistencia-estrellas">
                              {'⭐'.repeat(asesoria.calificacion)}
                            </div>
                            {asesoria.comentario_calificacion && (
                              <div className="docentes-asesorias-asistencia-comentario">
                                <MessageSquare size={14} />
                                <p>{asesoria.comentario_calificacion}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {asesoriasView === 'historial' && (
                <div className="docente-historial-asesorias-view">
                  <div className="docente-historial-asesorias-view-header">
                    <div className="docente-historial-asesorias-view-title">
                      <Clock size={20} />
                      <h3>Historial de Asesorías</h3>
                    </div>
                    <div className="docente-historial-asesorias-view-actions">
                      <button
                        className="docente-historial-asesorias-export-button"
                        onClick={exportarHistorial}
                        disabled={cargandoExportacion}
                      >
                        <Download size={16} />
                        <span>{cargandoExportacion ? "Exportando..." : "Exportar a Excel"}</span>
                      </button>
                    </div>
                  </div>

                  <p className="docente-historial-asesorias-view-description">
                    Consulta el registro histórico completo de todas las asesorías realizadas.
                  </p>

                  <div className="docente-historial-filters-container">
                    <div className="docente-historial-filters-header">
                      <Filter size={16} />
                      <h4>Filtros de búsqueda</h4>
                    </div>

                    <div className="docente-historial-filters-form">
                      {/* Fila 1: Fechas */}
                      <div className="docente-historial-filter-row">
                        <div className="docente-historial-filter-field">
                          <label>Rango de fechas:</label>
                          <div className="docente-historial-date-range-inputs">
                            <div className="docente-historial-input-with-icon">
                              <Calendar size={16} className="docente-historial-input-icon" />
                              <input
                                type="date"
                                className="docente-historial-form-control"
                                placeholder="Desde"
                                value={fechaInicioFiltro}
                                onChange={(e) => setFechaInicioFiltro(e.target.value)}
                              />
                            </div>
                            <span className="docente-historial-date-separator">a</span>
                            <div className="docente-historial-input-with-icon">
                              <Calendar size={16} className="docente-historial-input-icon" />
                              <input
                                type="date"
                                className="docente-historial-form-control"
                                placeholder="Hasta"
                                value={fechaFinFiltro}
                                onChange={(e) => setFechaFinFiltro(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Fila 2: Asignatura */}
                      <div className="docente-historial-filter-row">
                        <div className="docente-historial-filter-field">
                          <label>Asignatura:</label>
                          <div className="docente-historial-input-with-icon">
                            <BookOpen size={16} className="docente-historial-input-icon" />
                            <select
                              className="docente-historial-form-control"
                              value={asignaturaFiltro}
                              onChange={(e) => setAsignaturaFiltro(e.target.value)}
                            >
                              <option value="">Todas las asignaturas</option>
                              {asignaturas.map(asignatura => (
                                <option key={asignatura.id} value={asignatura.id}>
                                  {asignatura.nombre}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Fila 3: Estado y botones */}
                      <div className="docente-historial-filter-row">
                        <div className="docente-historial-filter-field">
                          <label>Estado:</label>
                          <div className="docente-historial-checkbox-group">
                            <label className="docente-historial-checkbox-option">
                              <input
                                type="checkbox"
                                checked={estadoAsistioFiltro}
                                onChange={(e) => setEstadoAsistioFiltro(e.target.checked)}
                              />
                              <span>Asistieron</span>
                            </label>
                            <label className="docente-historial-checkbox-option">
                              <input
                                type="checkbox"
                                checked={estadoNoAsistioFiltro}
                                onChange={(e) => setEstadoNoAsistioFiltro(e.target.checked)}
                              />
                              <span>No asistieron</span>
                            </label>
                          </div>
                        </div>

                        <div className="docente-historial-filter-actions">
                          <button className="btn btn-apply" onClick={aplicarFiltros}>
                            <Search size={16} />
                            <span>Aplicar filtros</span>
                          </button>
                          <button className="btn btn-clear" onClick={limpiarFiltros}>
                            <X size={16} />
                            <span>Limpiar</span>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>

                  {cargandoHistorial ? (
                    <div className="docente-historial-asesorias-loading-state">
                      <RefreshCw size={32} className="docente-historial-asesorias-spinner" />
                      <p>Cargando historial de asesorías...</p>
                    </div>
                  ) : historialAsesorias.length > 0 ? (
                    <div className="docente-historial-asesorias-table-container">
                      <table className="docente-historial-asesorias-table">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Hora</th>
                            <th>Estudiante</th>
                            <th>Asignatura</th>
                            <th>Estado</th>
                            <th>Asistencia por Bloque</th>
                            <th>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historialAsesorias.map((asesoria) => (
                            <tr key={asesoria.id}>
                              <td>{asesoria.fecha_inicio}</td>
                              <td>
                                {asesoria.bloques && asesoria.bloques.length > 0 ? (
                                  asesoria.bloques.map((bloque, index) => (
                                    <div key={index}>
                                      {bloque.hora_inicio} - {bloque.hora_fin}
                                    </div>
                                  ))
                                ) : (
                                  `${asesoria.hora_inicio_primer_bloque} - ${asesoria.hora_fin_ultimo_bloque}`
                                )}
                              </td>                              <td>{asesoria.estudiante.nombre}</td>
                              <td>{asesoria.asignatura.nombre}</td>
                              <td>
                                <span className={`docente-historial-asesorias-status-badge docente-historial-asesorias-status-${asesoria.estado.toLowerCase().replace(/\s+/g, '-')}`}>
                                  {asesoria.estado}
                                </span>
                              </td>
                              <td>
                                {/* Nuevo componente para mostrar asistencia por bloque */}
                                <div className="docente-historial-bloques-asistencia">
                                  {asesoria.bloques && asesoria.bloques.length > 0 ? (
                                    asesoria.bloques.map((bloque, index) => (
                                      <div key={index} className="docente-historial-bloque-asistencia-item">
                                        <span className="docente-historial-bloque-hora">
                                          {bloque.hora_inicio} - {bloque.hora_fin}:
                                        </span>
                                        {bloque.asistio === true ? (
                                          <span className="docente-historial-asesorias-status-badge docente-historial-asesorias-status-asistio">
                                            <CheckCircle size={14} /> Asistió
                                          </span>
                                        ) : bloque.asistio === false ? (
                                          <span className="docente-historial-asesorias-status-badge docente-historial-asesorias-status-no-asistio">
                                            <UserX size={14} /> No asistió
                                          </span>
                                        ) : (
                                          <span className="docente-historial-asesorias-status-badge docente-historial-asesorias-status-pendiente">
                                            <Clock size={14} /> Pendiente
                                          </span>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <span className="docente-historial-asesorias-status-badge docente-historial-asesorias-status-pendiente">
                                      <Clock size={14} /> Pendiente
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <button
                                  className="docente-historial-asesorias-action-button docente-historial-asesorias-view-button"
                                  onClick={() => verDetallesAsesoria(asesoria.id)}
                                >
                                  <Eye size={16} />
                                  <span>Ver</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Paginación */}
                      <div className="docente-historial-asesorias-pagination">
                        <div className="docente-historial-asesorias-pagination-info">
                          Mostrando {historialAsesorias.length} de {totalAsesorias} asesorías
                        </div>
                        <div className="docente-historial-asesorias-pagination-controls">
                          <button
                            className="docente-historial-asesorias-pagination-button"
                            disabled={paginaActual === 1}
                            onClick={() => cambiarPagina(1)}
                          >
                            &laquo;
                          </button>
                          <button
                            className="docente-historial-asesorias-pagination-button"
                            disabled={paginaActual === 1}
                            onClick={() => cambiarPagina(paginaActual - 1)}
                          >
                            &lsaquo;
                          </button>

                          <span className="docente-historial-asesorias-pagination-current">
                            Página {paginaActual} de {totalPaginas}
                          </span>

                          <button
                            className="docente-historial-asesorias-pagination-button"
                            disabled={paginaActual === totalPaginas}
                            onClick={() => cambiarPagina(paginaActual + 1)}
                          >
                            &rsaquo;
                          </button>
                          <button
                            className="docente-historial-asesorias-pagination-button"
                            disabled={paginaActual === totalPaginas}
                            onClick={() => cambiarPagina(totalPaginas)}
                          >
                            &raquo;
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="docente-historial-asesorias-empty-state">
                      <div className="docente-historial-asesorias-empty-icon">
                        <Database size={48} />
                      </div>
                      <h4>{filtrosAplicados ? "No se encontraron resultados" : "Historial disponible"}</h4>
                      <p>
                        {filtrosAplicados
                          ? "No hay asesorías que coincidan con los filtros seleccionados."
                          : "Aplica filtros para ver el historial de asesorías realizadas."}
                      </p>
                      <div className="docente-historial-asesorias-export-info">
                        <small>
                          Puedes exportar todo el historial o aplicar filtros para exportar datos específicos.
                        </small>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="docente-welcome-content">
            <Carousel />
          </div>
        );
    }
  };

  return (
    <div className="docente-background-image">
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
                    className={`${activeSection === "registrar-horario" ? "docente-active" : ""} ${!puedeCrearHorarios ? "docente-disabled" : ""}`}
                    title={!puedeCrearHorarios ? "No tienes permiso para registrar horarios" : ""}
                  >
                    <CalendarArrowUp size={18} />
                    Registrar Horario
                    {!puedeCrearHorarios && <span className="docente-lock-icon">🔒</span>}
                    {activeSection === "registrar-horario" && <span className="docente-lock-icon">🔓</span>}
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    onClick={() => {
                      verificarPermisoCrearHorarios();
                      handleSectionClick("visualizar-horario");
                    }}

                    className={
                      activeSection === "visualizar-horario"
                        ? "docente-active"
                        : ""
                    }
                  >
                    <Calendar size={18} />
                    Visualizar Horario
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() => {
                      verificarPermisoCrearHorarios();
                      handleSectionClick("visualizar-materia");
                    }}

                    className={
                      activeSection === "visualizar-materia"
                        ? "docente-active"
                        : ""
                    }
                  >
                    <Book size={18} />
                    Visualizar Materia
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() => {
                      verificarPermisoCrearHorarios();
                      handleSectionClick("estudiantes-asesorias");
                    }}

                    className={
                      activeSection === "estudiantes-asesorias"
                        ? "docente-active"
                        : ""
                    }
                  >
                    <Users size={18} />
                    Gestión de Asesorías
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Mensaje de notificación */}
        {mensaje && (
          <div className={`docente-mensaje-notificacion ${tipoMensaje}`}>
            {mensaje}
          </div>
        )}

        <div className="docente-user-info">
          <p>Usuario: {usuario?.nombre_usuario} ({usuario?.correo})</p>
          <div className="docente-user-actions">
            <button className="docente-user-icon-button" onClick={(e) => toggleUserMenu(e)}>
              <User size={24} strokeWidth={2} />
            </button>
            <button className="docente-logout-button" onClick={confirmLogout}>
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
                  verificarPermisoCrearHorarios(); // Verificar permisos aquí también
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
                  verificarPermisoCrearHorarios(); // Verificar permisos aquí también
                }}
              >
                <Lock size={20} strokeWidth={2} />
                <span>Cambiar Clave</span>
              </li>
            </ul>
          </div>
        )}

        <div className="docente-content-area">{renderSectionContent()}</div>

        {/* Ventana emergente de confirmación */}
        {showLogoutConfirm && (
          <div className="docente-logout-confirmation">
            <div className="docente-confirmation-content">
              <img
                src={centreLogo}
                alt="Logo Central"
                className="docente-confirmation-logo"
              />
              <p>¿Estás seguro que quieres cerrar sesión?</p>
              <button onClick={() => handleConfirmLogout(true)}>Sí</button>
              <button onClick={() => handleConfirmLogout(false)}>No</button>
            </div>
          </div>
        )}
        {mostrarModalDetalles && asesoriaSeleccionada && (
          <div className="docente-modal-detalle-asesoria-backdrop">
            <div className="docente-modal-detalle-asesoria docente-modal-detalle-asesoria-lg">
              <div className="docente-modal-detalle-asesoria-header">
                <h3>
                  <FileText size={20} />
                  Detalles de la Asesoría
                </h3>
                <button
                  className="docente-modal-detalle-asesoria-close"
                  onClick={() => setMostrarModalDetalles(false)}
                >
                  <X size={20} />
                </button>
              </div>

              {cargandoDetalles ? (
                <div className="docente-modal-detalle-asesoria-loading">
                  <RefreshCw size={32} className="docente-modal-detalle-asesoria-spinner" />
                  <p>Cargando detalles...</p>
                </div>
              ) : (
                <div className="docente-modal-detalle-asesoria-content">
                  {/* Información principal */}
                  <div className="docente-modal-detalle-asesoria-section">
                    <h4 className="docente-modal-detalle-asesoria-title">Información General</h4>
                    <div className="docente-modal-detalle-asesoria-grid">
                      <div className="docente-modal-detalle-asesoria-item">
                        <span className="docente-modal-detalle-asesoria-label">Estado:</span>
                        <span className={`docente-modal-detalle-asesoria-status-badge docente-modal-detalle-asesoria-status-${asesoriaSeleccionada.estado.toLowerCase().replace(/\s+/g, '-')}`}>
                          {asesoriaSeleccionada.estado}
                        </span>
                      </div>
                      {asesoriaSeleccionada.es_un_solo_bloque && (
                        <div className="docente-modal-detalle-asesoria-item">
                          <span className="docente-modal-detalle-asesoria-label">Asistencia:</span>
                          {asesoriaSeleccionada.asistio === true ? (
                            <span className="docente-modal-detalle-asesoria-status-badge docente-modal-detalle-asesoria-status-asistio">
                              <CheckCircle size={14} /> Asistió
                            </span>
                          ) : asesoriaSeleccionada.asistio === false ? (
                            <span className="docente-modal-detalle-asesoria-status-badge docente-modal-detalle-asesoria-status-no-asistio">
                              <UserX size={14} /> No asistió
                            </span>
                          ) : (
                            <span className="docente-modal-detalle-asesoria-status-badge docente-modal-detalle-asesoria-status-pendiente">
                              <Clock size={14} /> Pendiente
                            </span>
                          )}
                        </div>
                      )}
                      <div className="docente-modal-detalle-asesoria-item">
                        <span className="docente-modal-detalle-asesoria-label">Fecha de solicitud:</span>
                        <span>{asesoriaSeleccionada.fecha_solicitud}</span>
                      </div>
                      <div className="docente-modal-detalle-asesoria-item">
                        <span className="docente-modal-detalle-asesoria-label">Asignatura:</span>
                        <span>{asesoriaSeleccionada.asignatura.nombre}</span>
                      </div>
                    </div>
                  </div>

                  {/* Información del estudiante */}
                  <div className="docente-modal-detalle-asesoria-section">
                    <h4 className="docente-modal-detalle-asesoria-title">
                      <User size={16} /> Estudiante
                    </h4>
                    <div className="docente-modal-detalle-asesoria-grid">
                      <div className="docente-modal-detalle-asesoria-item">
                        <span className="docente-modal-detalle-asesoria-label">Nombre:</span>
                        <span>{asesoriaSeleccionada.estudiante.nombre}</span>
                      </div>
                      <div className="docente-modal-detalle-asesoria-item">
                        <span className="docente-modal-detalle-asesoria-label">Correo:</span>
                        <span>{asesoriaSeleccionada.estudiante.correo}</span>
                      </div>
                      <div className="docente-modal-detalle-asesoria-item">
                        <span className="docente-modal-detalle-asesoria-label">Semestre:</span>
                        <span>{asesoriaSeleccionada.estudiante.semestre}</span>
                      </div>
                      <div className="docente-modal-detalle-asesoria-item">
                        <span className="docente-modal-detalle-asesoria-label">Grupo:</span>
                        <span>{asesoriaSeleccionada.estudiante.grupo || 'No especificado'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bloques de horario */}
                  <div className="docente-modal-detalle-asesoria-section">
                    <h4 className="docente-modal-detalle-asesoria-title">
                      <CalendarClock size={16} /> Horarios
                    </h4>
                    <div className="docente-modal-detalle-asesoria-horarios-list">
                      {asesoriaSeleccionada.bloques && asesoriaSeleccionada.bloques.map((bloque, index) => (
                        <div key={index} className="docente-modal-detalle-asesoria-horario-item">
                          <div className="docente-modal-detalle-asesoria-horario-fecha">
                            <Calendar size={16} />
                            <span>{bloque.fecha}</span>
                            {bloque.dia_semana && <span className="docente-modal-detalle-asesoria-horario-dia">({bloque.dia_semana})</span>}
                          </div>
                          <div className="docente-modal-detalle-asesoria-horario-horas">
                            <Clock size={16} />
                            <span>{bloque.hora_inicio} - {bloque.hora_fin}</span>
                          </div>
                          <div className="docente-modal-detalle-asesoria-horario-lugar">
                            <span className="docente-modal-detalle-asesoria-label">Lugar:</span>
                            <span>{bloque.lugar}</span>
                          </div>
                          {!asesoriaSeleccionada.es_un_solo_bloque && (
                            <div className="docente-modal-detalle-asesoria-horario-asistencia">
                              <span className="docente-modal-detalle-asesoria-label">Asistencia:</span>
                              {bloque.asistio === true ? (
                                <span className="docente-modal-detalle-asesoria-status-badge docente-modal-detalle-asesoria-status-asistio">
                                  <CheckCircle size={14} /> Asistió
                                </span>
                              ) : bloque.asistio === false ? (
                                <span className="docente-modal-detalle-asesoria-status-badge docente-modal-detalle-asesoria-status-no-asistio">
                                  <UserX size={14} /> No asistió
                                </span>
                              ) : (
                                <span className="docente-modal-detalle-asesoria-status-badge docente-modal-detalle-asesoria-status-pendiente">
                                  <Clock size={14} /> Pendiente
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Motivo de la asesoría */}
                  <div className="docente-modal-detalle-asesoria-section">
                    <h4 className="docente-modal-detalle-asesoria-title">
                      <HelpCircle size={16} /> Motivo de la asesoría
                    </h4>
                    <div className="docente-modal-detalle-asesoria-text-content">
                      {asesoriaSeleccionada.motivo || 'No se especificó un motivo.'}
                    </div>
                  </div>

                  {/* Temas tratados y observaciones - Solo si ya se realizó */}
                  {(asesoriaSeleccionada.estado === "Finalizada" || asesoriaSeleccionada.ha_finalizado) && (
                    <>
                      {asesoriaSeleccionada.es_un_solo_bloque ? (
                        <>
                          <div className="docente-modal-detalle-asesoria-section">
                            <h4 className="docente-modal-detalle-asesoria-title">
                              <BookOpen size={16} /> Temas tratados
                            </h4>
                            <div className="docente-modal-detalle-asesoria-text-content">
                              {asesoriaSeleccionada.temas_tratados || 'No se registraron temas tratados.'}
                            </div>
                          </div>

                          <div className="docente-modal-detalle-asesoria-section">
                            <h4 className="docente-modal-detalle-asesoria-title">
                              <MessageSquare size={16} /> Observaciones
                            </h4>
                            <div className="docente-modal-detalle-asesoria-text-content">
                              {asesoriaSeleccionada.observaciones || 'No se registraron observaciones.'}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {asesoriaSeleccionada.bloques.map((bloque, index) => (
                            <div key={index} className="docente-modal-detalle-asesoria-section">
                              <h4 className="docente-modal-detalle-asesoria-title">
                                <BookOpen size={16} /> Bloque {index + 1} - {bloque.fecha} {bloque.hora_inicio}-{bloque.hora_fin}
                              </h4>
                              <div className="docente-modal-detalle-asesoria-grid">
                                <div className="docente-modal-detalle-asesoria-item">
                                  <span className="docente-modal-detalle-asesoria-label">Temas tratados:</span>
                                  <span>{bloque.temas_tratados || 'No especificado'}</span>
                                </div>
                                <div className="docente-modal-detalle-asesoria-item">
                                  <span className="docente-modal-detalle-asesoria-label">Observaciones:</span>
                                  <span>{bloque.observaciones || 'No especificado'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      <div className="docente-modal-detalle-asesoria-section">
                        <h4 className="docente-modal-detalle-asesoria-title">
                          <CheckSquare size={16} /> Compromisos
                        </h4>
                        <div className="docente-modal-detalle-asesoria-text-content">
                          {asesoriaSeleccionada.compromisos || 'No se registraron compromisos.'}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Calificación - Si existe */}
                  {asesoriaSeleccionada.tiene_calificacion && (
                    <div className="docente-modal-detalle-asesoria-section docente-modal-detalle-asesoria-calificacion">
                      <h4 className="docente-modal-detalle-asesoria-title">
                        <Star size={16} /> Calificación del estudiante
                      </h4>
                      <div className="docente-modal-detalle-asesoria-calificacion-content">
                        <div className="docente-modal-detalle-asesoria-stars">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              size={20}
                              fill={index < asesoriaSeleccionada.calificacion ? "#FFD700" : "none"}
                              color={index < asesoriaSeleccionada.calificacion ? "#FFD700" : "#ccc"}
                            />
                          ))}
                          <span className="docente-modal-detalle-asesoria-rating-value">{asesoriaSeleccionada.calificacion}/5</span>
                        </div>
                        {asesoriaSeleccionada.comentario_calificacion && (
                          <div className="docente-modal-detalle-asesoria-rating-comment">
                            <p>"{asesoriaSeleccionada.comentario_calificacion}"</p>
                            <small>
                              Calificado en {formatearFecha(asesoriaSeleccionada.fecha_calificacion)}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="docente-modal-detalle-asesoria-footer">
                <button
                  className="docente-modal-detalle-asesoria-btn-secondary"
                  onClick={() => setMostrarModalDetalles(false)}
                >
                  Cerrar
                </button>

                {/* Solo mostrar si la asesoría ya finalizó pero no se ha registrado asistencia */}
                {(asesoriaSeleccionada.estado === "Finalizada" || asesoriaSeleccionada.ha_finalizado) &&
                  asesoriaSeleccionada.asistio === null && (
                    <button
                      className="docente-modal-detalle-asesoria-btn-primary"
                      onClick={() => {
                        // Aquí podrías navegar a un formulario de registro o abrir otro modal
                        setMostrarModalDetalles(false);
                        // Implementar navegación o lógica adicional según sea necesario
                        mostrarMensaje("Redirigiendo al registro de asistencia", "info");
                      }}
                    >
                      <Clipboard size={16} />
                      Registrar asistencia
                    </button>
                  )}
              </div>
            </div>
          </div>
        )}

        <div className="docente-footer-bar">
          <img src={logoImage} alt="Logo Cesmag" className="docente-footer-logo" />
          <span className="docente-footer-text">
            Todos los derechos son reservados © {new Date().getFullYear()}
          </span>
          <img src={centreLogo} alt="Logo Central" className="docente-footer-logo" />
        </div>
      </div >
    </div >
  );
};

export default MenuDocentes;