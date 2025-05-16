import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/PageEstudiante.css";
import logoImage from "../assets/logo_cesmag.png";
import centreLogo from "../assets/logo2.png";
import Carousel from "../components/carousel/carousel";
import { User, UserCircle, Lock, Calendar, BookOpen, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import Perfil from "./Perfil";
import CambiarClave from "./CambiarClave";
import { X } from "lucide-react";

const Estudiante = () => {
  const navigate = useNavigate();
  const { logout, usuario } = useAuth();
  const [activeSection, setActiveSection] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPerfil, setShowPerfil] = useState(false);
  const [showCambiarClave, setShowCambiarClave] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroAsignatura, setFiltroAsignatura] = useState("");
  const [asesoriaACalificar, setAsesoriaACalificar] = useState(null);
  const [calificacion, setCalificacion] = useState(0);
  const [comentarioCalificacion, setComentarioCalificacion] = useState("");
  const [showCalificarModal, setShowCalificarModal] = useState(false);

  // Estados para la gestión de asesorías
  const [asignaturas, setAsignaturas] = useState([]);
  const [docentesDisponibles, setDocentesDisponibles] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [misAsesorias, setMisAsesorias] = useState([]);
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState("");
  const [docenteSeleccionado, setDocenteSeleccionado] = useState("");
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState([]);
  const [motivoAsesoria, setMotivoAsesoria] = useState("");
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [asesoriaACancelar, setAsesoriaACancelar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarView, setCalendarView] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalificacionObligatoria, setShowCalificacionObligatoria] = useState(false);
  const [asesoriaPendiente, setAsesoriaPendiente] = useState(null);
  const [showAsistenciaModal, setShowAsistenciaModal] = useState(false);
  const [asesoriaAsistencia, setAsesoriaAsistencia] = useState(null);
  const [bloquesAsistencia, setBloquesAsistencia] = useState([]);

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

  // Cargar asignaturas cuando se selecciona la sección de solicitar asesoría
  useEffect(() => {
    if (activeSection === "solicitar-asesoria") {
      cargarAsignaturas();
    }
    if (activeSection === "mis-asesorias") {
      cargarMisAsesorias();
    }
  }, [activeSection]);

  // Cargar docentes cuando se selecciona una asignatura
  useEffect(() => {
    if (asignaturaSeleccionada) {
      cargarDocentes(asignaturaSeleccionada);
    } else {
      setDocentesDisponibles([]);
      setDocenteSeleccionado("");
    }
  }, [asignaturaSeleccionada]);

  // Cargar horarios cuando se selecciona un docente
  useEffect(() => {
    if (docenteSeleccionado) {
      cargarHorarios(docenteSeleccionado);
    } else {
      setHorariosDisponibles([]);
      setBloquesSeleccionados([]);
    }
  }, [docenteSeleccionado]);

  ////////////////
  useEffect(() => {
    if (!calendarView) return; // Solo escuchar cuando está en vista de calendario

    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        setCurrentMonth(newMonth);
      } else if (event.key === 'ArrowRight') {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        setCurrentMonth(newMonth);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Limpieza cuando el componente se desmonta o cambia calendarView
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [calendarView, currentMonth]);

  useEffect(() => {
    // Este useEffect se ejecuta cuando cambia alguno de los filtros o la lista de asesorías
  }, [filtroEstado, filtroFecha, filtroAsignatura, misAsesorias]);

  // Abrir modal de calificación (ahora puede ser forzado)
  const openCalificarModal = (asesoria, esObligatorio = false) => {
    // Verificar si el docente asistió a todos los bloques
    const todosAsistieron = asesoria.bloques.every(bloque => bloque.docente_asistio);

    if (!todosAsistieron) {
      setMensajeError("No puedes calificar esta asesoría porque el docente no asistió a todos los bloques");
      return;
    }

    setAsesoriaACalificar(asesoria);
    setCalificacion(0);
    setComentarioCalificacion("");
    setShowCalificarModal(true);
    if (esObligatorio) {
      setAsesoriaPendiente(asesoria);
      setShowCalificacionObligatoria(true);
    }
  };
  const openAsistenciaModal = (asesoria) => {
    setAsesoriaAsistencia(asesoria);
    // Inicializar el estado de asistencia con la información existente
    const asistenciaInicial = asesoria.bloques.map(bloque => ({
      bloque_id: bloque.id,
      docente_asistio: bloque.docente_asistio || false
    }));
    setBloquesAsistencia(asistenciaInicial);
    setShowAsistenciaModal(true);
  };

  // Cerrar modal de calificación (con verificación si es obligatorio)
  const closeCalificarModal = () => {
    if (showCalificacionObligatoria) {
      setMensajeError("Debes calificar esta asesoría para continuar");
      return;
    }
    setShowCalificarModal(false);
    setAsesoriaACalificar(null);
    setShowCalificacionObligatoria(false);
    setAsesoriaPendiente(null);
  };
  const closeAsistenciaModal = () => {
    setShowAsistenciaModal(false);
    setAsesoriaAsistencia(null);
    setBloquesAsistencia([]);
  };


  // Enviar calificación al backend
  const enviarCalificacion = async () => {
    if (calificacion === 0) {
      setMensajeError("Por favor selecciona una calificación");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/calificar-asesoria/${asesoriaACalificar.id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          calificacion: calificacion,
          comentario: comentarioCalificacion
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al calificar la asesoría");
      }

      setMensajeExito("¡Asesoría calificada exitosamente!");
      setShowCalificacionObligatoria(false);
      setAsesoriaPendiente(null);
      closeCalificarModal();
      cargarMisAsesorias(); // Actualizar la lista
    } catch (error) {
      console.error("Error al calificar asesoría:", error);
      setMensajeError(error.message || "No se pudo calificar la asesoría. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };
  const enviarAsistencia = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/registrar-asistencia-docente/${asesoriaAsistencia.id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bloques_asistencia: bloquesAsistencia
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar la asistencia");
      }

      setMensajeExito(data.message);
      closeAsistenciaModal();
      cargarMisAsesorias(); // Actualizar la lista
    } catch (error) {
      console.error("Error al registrar asistencia:", error);
      setMensajeError(error.message || "No se pudo registrar la asistencia. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };


  const filtrarAsesorias = () => {
    return misAsesorias.filter(asesoria => {
      const pasaFiltroEstado = filtroEstado === "" || asesoria.estado === filtroEstado;
      let pasaFiltroFecha = true;

      if (filtroFecha !== "") {
        // Parsear la fecha IGNORANDO la zona horaria (tratarla como UTC)
        const parsearFechaLocal = (fechaStr) => {
          const parts = fechaStr.split('-');
          return new Date(parts[0], parts[1] - 1, parts[2]);
        };

        const fechaAsesoria = parsearFechaLocal(asesoria.fecha);
        const hoy = new Date();

        // Normalizar fechas (ignorar horas)
        const hoyNormalizado = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const fechaAsesoriaNormalizada = new Date(
          fechaAsesoria.getFullYear(),
          fechaAsesoria.getMonth(),
          fechaAsesoria.getDate()
        );

        console.log("Comparando fechas:", {
          hoy: hoyNormalizado.toDateString(),
          asesoria: fechaAsesoriaNormalizada.toDateString(),
          filtro: filtroFecha
        });

        switch (filtroFecha) {
          case "hoy":
            pasaFiltroFecha = fechaAsesoriaNormalizada.getTime() === hoyNormalizado.getTime();
            break;
          // ... (resto de casos igual)


          case "semana":
            const inicioSemana = new Date(hoyNormalizado);
            inicioSemana.setDate(hoyNormalizado.getDate() - hoyNormalizado.getDay());
            const finSemana = new Date(inicioSemana);
            finSemana.setDate(inicioSemana.getDate() + 6);
            pasaFiltroFecha = fechaAsesoriaNormalizada >= inicioSemana && fechaAsesoriaNormalizada <= finSemana;
            break;

          case "mes":
            const inicioMes = new Date(hoyNormalizado.getFullYear(), hoyNormalizado.getMonth(), 1);
            const finMes = new Date(hoyNormalizado.getFullYear(), hoyNormalizado.getMonth() + 1, 0);
            pasaFiltroFecha = fechaAsesoriaNormalizada >= inicioMes && fechaAsesoriaNormalizada <= finMes;
            break;

          case "pasadas":
            pasaFiltroFecha = fechaAsesoriaNormalizada < hoyNormalizado;
            break;

          case "futuras":
            pasaFiltroFecha = fechaAsesoriaNormalizada > hoyNormalizado;
            break;

          default:
            pasaFiltroFecha = true;
        }
      }

      const pasaFiltroAsignatura = filtroAsignatura === "" || asesoria.asignatura === filtroAsignatura;

      console.log(`Resultados filtros - Estado: ${pasaFiltroEstado}, Fecha: ${pasaFiltroFecha}, Asignatura: ${pasaFiltroAsignatura}`); // Depuración

      return pasaFiltroEstado && pasaFiltroFecha && pasaFiltroAsignatura;
    });
  };





  // Calcular las asesorías filtradas
  const misAsesoriasFiltradas = filtrarAsesorias();

  const limpiarFiltros = () => {
    setFiltroEstado("");
    setFiltroFecha("");
    setFiltroAsignatura("");
  };



  // Función para cargar asignaturas del estudiante
  const cargarAsignaturas = async () => {
    console.log('Easter egg de Santiago')
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/obtener-asignaturas-por-semestre", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al cargar asignaturas");
      }

      const data = await response.json();
      setAsignaturas(data.asignaturas);
    } catch (error) {
      console.error("Error al cargar asignaturas:", error);
      setMensajeError("No se pudieron cargar las asignaturas. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar docentes por asignatura
  const cargarDocentes = async (asignaturaId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/obtener-docentes-por-asignatura/${asignaturaId}/`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al cargar docentes");
      }

      const data = await response.json();
      setDocentesDisponibles(data.docentes);
    } catch (error) {
      console.error("Error al cargar docentes:", error);
      setMensajeError("No se pudieron cargar los docentes. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar horarios disponibles por docente
  const cargarHorarios = async (docenteId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/obtener-horarios-disponibles/${docenteId}/`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al cargar horarios");
      }

      const data = await response.json();
      setHorariosDisponibles(data.bloques_horario);
    } catch (error) {
      console.error("Error al cargar horarios:", error);
      setMensajeError("No se pudieron cargar los horarios disponibles. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar mis asesorías
  const cargarMisAsesorias = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/mis-asesorias/", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al cargar asesorías");
      }

      const data = await response.json();
      setMisAsesorias(data.asesorias);

      // Verificar si hay asesorías pendientes de calificar
      const pendientes = data.asesorias.filter(
        a => a.estado === 'Finalizada' && a.calificacion === null
      );
      if (pendientes.length > 0) {
        setMensajeError(`Tienes ${pendientes.length} asesoría(s) pendiente(s) de calificar`);
      }
    } catch (error) {
      console.error("Error al cargar mis asesorías:", error);
      setMensajeError("No se pudieron cargar tus asesorías. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  // Función para solicitar una asesoría
  const solicitarAsesoria = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensajeExito("");
    setMensajeError("");

    try {
      if (!asignaturaSeleccionada || !docenteSeleccionado || bloquesSeleccionados.length === 0) {
        throw new Error("Por favor completa todos los campos requeridos.");
      }

      const response = await fetch("http://localhost:8000/solicitar-asesoria/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          asignatura_id: asignaturaSeleccionada,
          docente_id: docenteSeleccionado,
          bloques_horario_ids: bloquesSeleccionados, // Array de IDs
          motivo: motivoAsesoria
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al solicitar la asesoría");
      }

      setMensajeExito("¡Tu solicitud de asesoría ha sido enviada exitosamente!");
      // Limpiar formulario
      setAsignaturaSeleccionada("");
      setDocenteSeleccionado("");
      setBloquesSeleccionados([]);
      setMotivoAsesoria("");
    } catch (error) {
      console.error("Error al solicitar asesoría:", error);
      setMensajeError(error.message || "No se pudo solicitar la asesoría. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  // Función para cancelar una asesoría
  const cancelarAsesoria = async () => {

    setLoading(true);

    try {

      const response = await fetch(`http://localhost:8000/cancelar-asesoria/${asesoriaACancelar.id}/`, {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify({

          motivo: motivoCancelacion

        }),

        credentials: "include",

      });


      const data = await response.json();


      if (!response.ok) {

        throw new Error(data.error || "Error al cancelar la asesoría");

      }


      // Actualizar el estado local eliminando la asesoría cancelada

      setMisAsesorias(prevAsesorias =>

        prevAsesorias.filter(asesoria => asesoria.id !== asesoriaACancelar.id)

      );


      setMensajeExito("La asesoría ha sido cancelada exitosamente.");

      setShowCancelModal(false);

      setAsesoriaACancelar(null);

      setMotivoCancelacion("");


      // Recargar todas las asesorías para asegurarte de tener la lista más actualizada

      cargarMisAsesorias();

    } catch (error) {

      console.error("Error al cancelar asesoría:", error);

      setMensajeError(error.message || "No se pudo cancelar la asesoría. Intenta más tarde.");

    } finally {

      setLoading(false);

    }

  };
  useEffect(() => {

    // Cargar mis asesorías al montar el componente

    cargarMisAsesorias();

  }, []);

  // Cuando se monta el componente, verificar si hay calificaciones pendientes
  useEffect(() => {
    const asesoriasPendientes = misAsesorias.filter(
      a => a.estado === 'Finalizada' && a.calificacion === null && a.bloques.every(bloque => bloque.docente_asistio)
    );

    if (asesoriasPendientes.length > 0) {
      // Abrir automáticamente el modal para la primera asesoría pendiente
      openCalificarModal(asesoriasPendientes[0], true);
    }
  }, [misAsesorias]);

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
    setMensajeExito("");
    setMensajeError("");
    window.scrollTo(0, 0);
  };

  const toggleUserMenu = (e) => {
    e.stopPropagation();  // Evita que el click cierre el menú inmediatamente
    setShowUserMenu(!showUserMenu);
  };
  const toggleBloqueSeleccion = (bloqueId) => {
    setBloquesSeleccionados(prevBloques => {
      // Si ya está seleccionado, lo quitamos del array
      if (prevBloques.includes(bloqueId)) {
        return prevBloques.filter(id => id !== bloqueId);
      }
      // Si no está seleccionado, lo añadimos al array
      return [...prevBloques, bloqueId];
    });
  };
  const toggleAsistenciaBloque = (bloqueId) => {
    setBloquesAsistencia(prevState =>
      prevState.map(item =>
        item.bloque_id === bloqueId
          ? { ...item, docente_asistio: !item.docente_asistio }
          : item
      )
    );
  };

  const openCancelModal = (asesoria) => {
    setAsesoriaACancelar(asesoria);
    setShowCancelModal(true);
  };
  // Añadir esta función para generar el grid del calendario
  const generateCalendarDays = (date, horarios, setSelectedDate, selectedDate) => {
    const month = date.getMonth();
    const year = date.getFullYear();

    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);

    // Día de la semana del primer día (0 es domingo)
    const firstDayOfWeek = firstDay.getDay();

    // Total de días en el mes
    const daysInMonth = lastDay.getDate();

    // Arreglo para almacenar los elementos del calendario
    const calendarDays = [];

    // Espacios en blanco antes del primer día
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="estudiante-calendar-day empty"></div>);
    }

    // Crear mapa de fechas disponibles para búsqueda rápida
    // Crear mapa de fechas disponibles para búsqueda rápida
    const availableDates = new Set();
    horarios.forEach(horario => {
      // Asegúrate de crear la fecha correctamente
      const [year, month, day] = horario.fecha.split('-');
      const horarioFecha = new Date(year, month - 1, parseInt(day, 10));
      availableDates.add(horarioFecha.toDateString());
    });

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dateString = currentDate.toDateString();
      const isAvailable = availableDates.has(dateString);
      const isSelected = selectedDate && selectedDate.toDateString() === dateString;

      calendarDays.push(
        <div
          key={`day-${day}`}
          className={`estudiante-calendar-day ${isAvailable ? 'available' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => isAvailable && setSelectedDate(new Date(currentDate))}
        >
          {day}
          {isAvailable && <span className="disponible-indicator"></span>}
        </div>
      );
    }

    return calendarDays;
  };
  // Función para formatear fecha a "Mes/día/año"
  function formatearFecha(fecha) {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const partes = fecha.split('-'); // separar año, mes y día
    const anio = partes[0];
    const mes = parseInt(partes[1], 10) - 1; // los meses en el array son 0-indexados
    const dia = partes[2];

    return `${meses[mes]} ${dia} ${anio}`;
  }

  function ajustarFecha(fecha) {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const dateObj = new Date(fecha);

    // Corregir las 5 horas de desfase manualmente
    dateObj.setHours(dateObj.getHours() - 5);

    const nombreMes = meses[dateObj.getMonth()];
    const dia = dateObj.getDate();
    const anio = dateObj.getFullYear();

    let horas = dateObj.getHours();
    let minutos = dateObj.getMinutes();

    // Formato 2 dígitos para hora y minutos
    if (horas < 10) horas = `0${horas}`;
    if (minutos < 10) minutos = `0${minutos}`;

    return `${nombreMes} ${dia} ${anio} ${horas}:${minutos}`;
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
  const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

  const mostrarHorario = (bloques) => {
    if (bloques.length === 1) {
      return (
        <span className="horario-bloque">
          {formatearHorario(bloques[0].hora_inicio)}
          <span className="horario-separador">-</span>
          {formatearHorario(bloques[0].hora_fin)}
        </span>
      );
    }

    // Verificar si todos los bloques son consecutivos
    const sonConsecutivos = bloques.every((bloque, index) => {
      if (index === 0) return true;
      const bloqueAnterior = bloques[index - 1];
      return bloqueAnterior.hora_fin === bloque.hora_inicio;
    });

    if (sonConsecutivos) {
      return (
        <span className="horario-bloque horario-bloque-consecutivo">
          {formatearHorario(bloques[0].hora_inicio)}
          <span className="horario-separador">-</span>
          {formatearHorario(bloques[bloques.length - 1].hora_fin)}
          <span className="horario-bloque-badge">{bloques.length} bloques</span>
        </span>
      );
    }

    return (
      <div className="horario-container">
        {bloques.map((bloque, index) => (
          <span key={index} className="horario-bloque">
            {formatearHorario(bloque.hora_inicio)}
            <span className="horario-separador">-</span>
            {formatearHorario(bloque.hora_fin)}
          </span>
        ))}
      </div>
    );
  };

  const mostrarEstadoAsistencia = (bloques) => {
    if (!bloques || bloques.length === 0) return "Sin información";

    const todosAsistieron = bloques.every(bloque => bloque.docente_asistio);
    const algunosAsistieron = bloques.some(bloque => bloque.docente_asistio);

    if (todosAsistieron) return "Asistió a todos los bloques";
    if (algunosAsistieron) return "Asistió parcialmente";
    return "No asistió";
  };

  const renderSectionContent = () => {
    if (showPerfil) {
      return <Perfil />;
    }
    if (showCambiarClave) {
      return <CambiarClave />;
    }
    switch (activeSection) {
      case "solicitar-asesoria":
        return (
          <div className="estudiante-section-content">
            <h2>Solicitar Asesoría</h2>

            {/* Mensajes de notificación */}
            {mensajeExito && <div className="estudiante-success-message">{mensajeExito}</div>}
            {mensajeError && <div className="estudiante-error-message">{mensajeError}</div>}

            <form onSubmit={solicitarAsesoria} className="estudiante-form">
              {/* Sección 1: Selección de Asignatura */}
              <div className="estudiante-form-group">
                <label>Asignatura:</label>
                <select
                  value={asignaturaSeleccionada}
                  onChange={(e) => setAsignaturaSeleccionada(e.target.value)}
                  required
                >
                  <option value="">Selecciona una asignatura</option>
                  {asignaturas.map(asignatura => (
                    <option key={asignatura.id} value={asignatura.id}>
                      {asignatura.nombre} - {asignatura.semestre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sección 2: Selección de Docente (visible solo si hay asignatura seleccionada) */}
              {asignaturaSeleccionada && (
                <div className="estudiante-form-group">
                  <label>Docente:</label>
                  <select
                    value={docenteSeleccionado}
                    onChange={(e) => {
                      setDocenteSeleccionado(e.target.value);
                      setSelectedDate(null); // Reiniciar la fecha seleccionada al cambiar de docente
                      setBloquesSeleccionados([]); // También limpiar los bloques seleccionados
                    }}
                    required
                  >
                    <option value="">Selecciona un docente</option>
                    {docentesDisponibles.map(docente => (
                      <option key={docente.id} value={docente.id}>
                        {docente.nombre_usuario} ({docente.correo}) {docente.subtipo ? `- ${docente.subtipo}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sección 3: Selección de Horario (visible solo si hay docente seleccionado) */}
              {docenteSeleccionado && (
                <div className="estudiante-form-group">
                  <label>Selecciona un horario disponible:</label>

                  {/* Botón para alternar entre vista de calendario y lista */}
                  <div className="estudiante-calendar-toggle">
                    <button
                      type="button"
                      onClick={() => setCalendarView(!calendarView)}
                      className="estudiante-calendar-toggle-btn"
                    >
                      <Calendar size={18} />
                      {calendarView ? 'Ver como lista' : 'Ver calendario'}
                    </button>
                  </div>

                  {/* Vista de Calendario */}
                  {calendarView ? (
                    <div className="estudiante-calendar-container">
                      {/* Encabezado del calendario con navegación de meses */}
                      <div className="estudiante-calendar-header">
                        <button
                          type="button"
                          onClick={() => {
                            const newMonth = new Date(currentMonth);
                            newMonth.setMonth(newMonth.getMonth() - 1);
                            setCurrentMonth(newMonth);
                          }}
                          className="estudiante-calendar-nav-btn"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <h3>
                          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            const newMonth = new Date(currentMonth);
                            newMonth.setMonth(newMonth.getMonth() + 1);
                            setCurrentMonth(newMonth);
                          }}
                          className="estudiante-calendar-nav-btn"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>

                      {/* Días de la semana */}
                      <div className="estudiante-calendar-days">
                        <div>Dom</div>
                        <div>Lun</div>
                        <div>Mar</div>
                        <div>Mié</div>
                        <div>Jue</div>
                        <div>Vie</div>
                        <div>Sáb</div>
                      </div>

                      {/* Cuadrícula del calendario */}
                      <div className="estudiante-calendar-grid">
                        {generateCalendarDays(currentMonth, horariosDisponibles, setSelectedDate, selectedDate)}
                      </div>

                      {/* Franjas horarias del día seleccionado */}
                      {selectedDate && (
                        <div className="estudiante-time-slots">
                          <h4>
                            Horarios disponibles para {capitalize(selectedDate.toLocaleString('es-ES', { month: 'long' }))} {selectedDate.getDate()} {selectedDate.getFullYear()}
                          </h4>
                          <div className="estudiante-time-slots-grid">
                            {horariosDisponibles
                              .filter(horario => {
                                const [year, month, day] = horario.fecha.split('-');
                                const horarioFecha = new Date(year, month - 1, parseInt(day, 10));
                                return horarioFecha.toDateString() === selectedDate.toDateString();
                              })
                              .map(horario => (
                                <div
                                  key={horario.id}
                                  className={`estudiante-time-slot ${bloquesSeleccionados.includes(horario.id) ? 'selected' : ''}`}
                                  onClick={() => toggleBloqueSeleccion(horario.id)}
                                >
                                  <span>{formatearHorario(horario.hora_inicio)} - {formatearHorario(horario.hora_fin)}</span>
                                  <span className="estudiante-time-slot-lugar">{horario.lugar || 'No especificado'}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Vista de Lista */
                    <div className="estudiante-horario-list">
                      {horariosDisponibles.length > 0 ? (
                        horariosDisponibles.map(bloque => (
                          <div
                            key={bloque.id}
                            className={`estudiante-horario-item ${bloquesSeleccionados.includes(bloque.id) ? 'selected' : ''}`}
                            onClick={() => toggleBloqueSeleccion(bloque.id)}
                          >
                            <div className="estudiante-horario-day">
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                              </svg>
                              <span>{bloque.dia_semana}</span>
                            </div>

                            <div className="estudiante-horario-date">
                              {formatearFecha(bloque.fecha)}
                            </div>

                            <div className="estudiante-horario-time">
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                              <span>{formatearHorario(bloque.hora_inicio)} - {formatearHorario(bloque.hora_fin)}</span>

                            </div>

                            <div className="estudiante-horario-lugar">
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                              <span className="info-label">Lugar:</span> {bloque.lugar || 'No especificado'}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="estudiante-no-data">
                          No hay horarios disponibles para este docente.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Campo oculto para guardar el bloque seleccionado */}
                  <input
                    type="hidden"
                    value={bloquesSeleccionados.join(',')}
                    required={bloquesSeleccionados.length > 0}
                  />
                </div>
              )}

              {/* Sección 4: Motivo de la asesoría (visible solo si hay bloque seleccionado) */}
              {bloquesSeleccionados.length > 0 && (
                <div className="estudiante-form-group">
                  <label>Motivo de la asesoría (opcional):</label>
                  <textarea
                    value={motivoAsesoria}
                    onChange={(e) => setMotivoAsesoria(e.target.value)}
                    placeholder="Describe brevemente el motivo de tu solicitud de asesoría..."
                    rows={4}
                  />
                </div>
              )}

              {/* Botón de Envío */}
              <button
                type="submit"
                className="estudiante-submit-button"
                disabled={loading || !asignaturaSeleccionada || !docenteSeleccionado || bloquesSeleccionados.length === 0}              >
                {loading ? "Enviando..." : "Solicitar Asesoría"}
              </button>
            </form>
          </div>
        );
      case "mis-asesorias":
        return (
          <div className="visualizar-materia-container">
            <div className="materia-header">
              <h2>Mis Asesorías</h2>
              <p className="subtitle">
                Aquí encontrarás todas las asesorías que has solicitado y su estado actual.
              </p>
            </div>

            {mensajeExito && <div className="estudiante-success-message">{mensajeExito}</div>}
            {mensajeError && <div className="estudiante-error-message">{mensajeError}</div>}

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Cargando asesorías...</p>
              </div>
            ) : (
              <>
                <div className="filtros-container">
                  <div className="filtros-inputs">
                    <div className="filtro-grupo">
                      <label htmlFor="filtro-estado">Filtrar por estado:</label>
                      <select
                        id="filtro-estado"
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                      >
                        <option value="">Todos los estados</option>
                        <option value="Aprobada">Aprobada</option>
                        <option value="Finalizada">Finalizada</option>
                      </select>
                    </div>

                    <div className="filtro-grupo">
                      <label htmlFor="filtro-fecha">Filtrar por período:</label>
                      <select
                        id="filtro-fecha"
                        value={filtroFecha}
                        onChange={(e) => setFiltroFecha(e.target.value)}
                      >
                        <option value="">Todas las fechas</option>
                        <option value="hoy">Hoy</option>
                        <option value="semana">Esta semana</option>
                        <option value="mes">Este mes</option>
                        <option value="pasadas">Pasadas</option>
                        <option value="futuras">Futuras</option>
                      </select>
                    </div>

                    <div className="filtro-grupo">
                      <label htmlFor="filtro-asignatura">Filtrar por asignatura:</label>
                      <select
                        id="filtro-asignatura"
                        value={filtroAsignatura}
                        onChange={(e) => setFiltroAsignatura(e.target.value)}
                      >
                        <option value="">Todas las asignaturas</option>
                        {[...new Set(misAsesorias.map(asesoria => asesoria.asignatura))].map((asignatura) => (
                          <option key={asignatura} value={asignatura}>
                            {asignatura}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="filtros-actions">
                    <button
                      onClick={limpiarFiltros}
                      className="asignatura-clear-filter"
                      disabled={filtroEstado === "" && filtroFecha === "" && filtroAsignatura === ""}
                    >
                      <span className="clear-filter-icon">↺</span>
                      Limpiar Filtros
                    </button>
                  </div>
                </div>

                <div className="acciones-container">
                  <button
                    onClick={cargarMisAsesorias}
                    className="estudiante-refresh-button"
                    disabled={loading}
                  >
                    {loading ? "Cargando..." : "Actualizar"}
                  </button>
                </div>

                {misAsesoriasFiltradas.length === 0 ? (
                  <div className="no-asignaturas">
                    <p>No se encontraron asesorías con los filtros seleccionados.</p>
                  </div>
                ) : (
                  <div className="asignaturas-grid">
                    {misAsesoriasFiltradas.map(asesoria => (
                      <div
                        key={asesoria.id}
                        className="asignatura-card"
                      >
                        <div className="asignatura-header">
                          <h3>{asesoria.asignatura}</h3>
                          <span className="asignatura-semestre">{asesoria.estado}</span>
                          {asesoria.calificacion && (
                            <span className="asignatura-calificacion">
                              {'⭐'.repeat(asesoria.calificacion)}
                            </span>
                          )}
                        </div>
                        <div className="asignatura-info">
                          <p>
                            <span className="info-label">Docente:</span> {asesoria.nombre_docente} ({asesoria.docente})
                          </p>
                          <p>
                            <span className="info-label">Fecha:</span> {formatearFecha(asesoria.fecha)}
                          </p>
                          <div className="horario-info">
                            <p>
                              <span className="info-label horario-label">Horario: {mostrarHorario(asesoria.bloques)}</span>

                            </p>
                          </div>
                          <p>
                            <span className="info-label">Lugar:</span> {asesoria.lugar || 'No especificado'}
                          </p>
                          <p>
                            <span className="info-label">Fecha Solicitada:</span> {ajustarFecha(asesoria.fecha_solicitud)}
                          </p>
                          {asesoria.motivo && (
                            <p>
                              <span className="info-label">Motivo:</span> {asesoria.motivo}
                            </p>
                          )}
                          {asesoria.comentarios && (
                            <p>
                              <span className="info-label">Comentarios:</span> {asesoria.comentarios}
                            </p>
                          )}

                          {/* Solo mostrar el botón de cancelar si la asesoría está en estado Aprobada y no Finalizada */}
                          {(asesoria.estado === 'Aprobada') && (
                            <button
                              className="estudiante-cancel-button"
                              onClick={() => openCancelModal(asesoria)}
                            >
                              <X size={16} /> Cancelar Asesoría
                            </button>
                          )}
                          {/* Dentro de la tarjeta de asesoría en la sección de mis-asesorias, 
   antes del botón de calificar y después de mostrar info del docente */}
                          {asesoria.estado === 'Finalizada' && (
                            <div className="asistencia-docente-info">
                              <p>
                                <span className="info-label">Asistencia docente:</span>
                                <span className={`asistencia-estado ${mostrarEstadoAsistencia(asesoria.bloques).startsWith('Asistió a todos') ? 'asistio' : 'no-asistio'}`}>
                                  {mostrarEstadoAsistencia(asesoria.bloques)}
                                </span>
                              </p>
                            </div>
                          )}
                          {/* Antes del botón de calificar asesoría */}
                          {asesoria.estado === 'Finalizada' && !asesoria.calificacion && (
                            <button
                              className="estudiante-reg-asistencia-button"
                              onClick={() => openAsistenciaModal(asesoria)}
                            >
                              ✓ Registrar Asistencia Docente
                            </button>
                          )}
                          {/* Dentro de la tarjeta de asesoría, después del botón de cancelar */}
                          {/* Solo mostrar el botón de calificar si finalizó Y el docente asistió a todos los bloques */}
                          {asesoria.estado === 'Finalizada' && !asesoria.calificacion &&
                            asesoria.bloques.every(bloque => bloque.docente_asistio) && (
                              <button
                                className="estudiante-rate-button"
                                onClick={() => openCalificarModal(asesoria)}
                              >
                                ⭐ Calificar Asesoría
                              </button>
                            )}

                          {asesoria.estado === 'Finalizada' && asesoria.calificacion && (
                            <div className="estudiante-calificacion-info">
                              <p>Calificación: {'⭐'.repeat(asesoria.calificacion)}</p>
                              {asesoria.comentario_calificacion && (
                                <p>Comentario: {asesoria.comentario_calificacion}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      default:
        return (
          <div className="estudiante-welcome-content">
            <Carousel />
            {/*<div className="estudiante-welcome-text-container">
              <h2>Sistema de Asesorías Académicas</h2>
              <p>
                Bienvenido al sistema de asesorías académicas. Aquí podrás solicitar asesorías con tus docentes
                de acuerdo a tu semestre y las asignaturas que estás cursando.
              </p>
              <p>
                Para comenzar, selecciona "Solicitar Asesoría" en el menú superior.
              </p>
            </div>*/}
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
                    onClick={() => handleSectionClick("solicitar-asesoria")}
                    className={
                      activeSection === "solicitar-asesoria"
                        ? "estudiante-active"
                        : ""
                    }
                  >
                    <BookOpen size={18} />
                    Solicitar Asesoría
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() => handleSectionClick("mis-asesorias")}
                    className={
                      activeSection === "mis-asesorias"
                        ? "estudiante-active"
                        : ""
                    }
                  >
                    <ClipboardList size={18} />
                    Mis Asesorías
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div className="estudiante-user-info">
          <p>Usuario: {usuario?.nombre_usuario} ({usuario?.correo})</p>
          <div className="estudiante-docente-user-actions">
            <button className="estudiante-docente-user-icon-button" onClick={(e) => toggleUserMenu(e)}>
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
          <div className="estudiante-docente-user-menu-dropdown">
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

        {showCancelModal && (
          <div className="estudiante-modal-overlay">
            <div className="estudiante-modal-content">
              <h3>Cancelar Asesoría</h3>
              <p>¿Estás seguro que deseas cancelar esta asesoría?</p>
              <p>
                <strong>Asignatura:</strong> {asesoriaACancelar?.asignatura}<br />
                <strong>Fecha:</strong> {formatearFecha(asesoriaACancelar?.fecha)}<br />
                <strong>Hora:</strong> {formatearHorario(asesoriaACancelar?.hora_inicio)} - {formatearHorario(asesoriaACancelar?.hora_fin)}<br />
                <strong>Lugar:</strong> {asesoriaACancelar?.lugar || "No especificado"}
              </p>
              {/*<div className="estudiante-form-group">
        <label>Motivo de cancelación (opcional):</label>
        <textarea
          value={motivoCancelacion}
          onChange={(e) => setMotivoCancelacion(e.target.value)}
          placeholder="Describe brevemente por qué cancelas esta asesoría..."
          rows={3}
        />
      </div>*/}
              <div className="estudiante-modal-buttons">
                <button
                  onClick={cancelarAsesoria}
                  className="estudiante-confirm-button"
                  disabled={loading}
                >
                  {loading ? "Procesando..." : "Confirmar Cancelación"}
                </button>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setAsesoriaACancelar(null);
                    setMotivoCancelacion("");
                  }}
                  className="estudiante-back-button"
                  disabled={loading}
                >
                  Volver
                </button>
              </div>
            </div>
          </div>
        )}
        {showAsistenciaModal && asesoriaAsistencia && (
          <div className="estudiante-asistencia-modal-overlay">
            <div className="estudiante-asistencia-modal">
              <div className="estudiante-asistencia-modal-header">
                <h3>Registrar Asistencia del Docente</h3>
              </div>

              <div className="estudiante-asistencia-modal-body">
                <div className="estudiante-asistencia-info-container">
                  <h4>Detalles de la Asesoría</h4>

                  <div className="estudiante-asistencia-info-grid">
                    <div className="estudiante-asistencia-info-item">
                      <span className="estudiante-asistencia-info-label">Docente:</span>
                      <span className="estudiante-asistencia-info-value">
                        {asesoriaAsistencia.nombre_docente}
                      </span>
                    </div>

                    <div className="estudiante-asistencia-info-item">
                      <span className="estudiante-asistencia-info-label">Asignatura:</span>
                      <span className="estudiante-asistencia-info-value">
                        {asesoriaAsistencia.asignatura}
                      </span>
                    </div>

                    <div className="estudiante-asistencia-info-item">
                      <span className="estudiante-asistencia-info-label">Estado:</span>
                      <span className="estudiante-asistencia-info-value">
                        {asesoriaAsistencia.estado}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="estudiante-asistencia-section">
                  <h4>Bloques de Asesoría</h4>
                  <p>Por favor registra la asistencia del docente a cada bloque:</p>

                  <div className="estudiante-asistencia-bloques">
                    {asesoriaAsistencia.bloques.map((bloque, index) => {
                      // Buscar el estado de asistencia actual para este bloque
                      const estadoBloque = bloquesAsistencia.find(b => b.bloque_id === bloque.id);
                      const asistio = estadoBloque ? estadoBloque.docente_asistio : false;

                      return (
                        <div key={index} className="estudiante-asistencia-bloque-item">
                          <div className="bloque-info">
                            <span>Fecha: {formatearFecha(bloque.fecha)}</span>
                            <span>Horario: {bloque.hora_inicio} - {bloque.hora_fin}</span>
                            <span>Lugar: {bloque.lugar || 'No especificado'}</span>
                          </div>
                          <div className="bloque-asistencia">
                            <label className="switch">
                              <input
                                type="checkbox"
                                checked={asistio}
                                onChange={() => toggleAsistenciaBloque(bloque.id)}
                              />
                              <span className="slider round"></span>
                            </label>
                            <span className="asistencia-text">
                              {asistio ? "Asistió" : "No asistió"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="estudiante-asistencia-info">
                    <p className="asistencia-nota">
                      <strong>Nota:</strong> Solo podrás calificar la asesoría si el docente asistió a todos los bloques.
                    </p>
                  </div>
                </div>
              </div>

              <div className="estudiante-asistencia-modal-footer">
                <button
                  onClick={closeAsistenciaModal}
                  className="estudiante-asistencia-modal-cancel"
                >
                  Cancelar
                </button>
                <button
                  onClick={enviarAsistencia}
                  className="estudiante-asistencia-modal-confirm"
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Guardar Asistencia"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal para calificación obligatoria */}
        {/* Modal para calificación obligatoria */}
        {showCalificacionObligatoria && (
          <div className="estudiante-calificacion-asesoria-modal-overlay">
            <div className="estudiante-calificacion-asesoria-modal">
              <div className="estudiante-calificacion-asesoria-modal-header">
                <h3>Calificación Obligatoria</h3>
              </div>

              <div className="estudiante-calificacion-asesoria-modal-body">
                <div className="estudiante-calificacion-asesoria-info-container">
                  <h4>Detalles de la Asesoría a Calificar</h4>

                  <div className="estudiante-calificacion-asesoria-info-grid">
                    <div className="estudiante-calificacion-asesoria-info-item">
                      <span className="estudiante-calificacion-asesoria-info-label">Docente:</span>
                      <span className="estudiante-calificacion-asesoria-info-value">
                        {asesoriaACalificar.nombre_docente}
                      </span>
                    </div>

                    <div className="estudiante-calificacion-asesoria-info-item">
                      <span className="estudiante-calificacion-asesoria-info-label">Correo Docente:</span>
                      <span className="estudiante-calificacion-asesoria-info-value">
                        {asesoriaACalificar.docente}
                      </span>
                    </div>

                    <div className="estudiante-calificacion-asesoria-info-item">
                      <span className="estudiante-calificacion-asesoria-info-label">Asignatura:</span>
                      <span className="estudiante-calificacion-asesoria-info-value">
                        {asesoriaACalificar.asignatura}
                      </span>
                    </div>

                    <div className="estudiante-calificacion-asesoria-info-item">
                      <span className="estudiante-calificacion-asesoria-info-label">Fecha:</span>
                      <span className="estudiante-calificacion-asesoria-info-value">
                        {formatearFecha(asesoriaACalificar.fecha)}
                      </span>

                    </div>

                    <div className="estudiante-calificacion-asesoria-info-item">
                      <span className="estudiante-calificacion-asesoria-info-label">Horario:</span>
                      <span className="estudiante-calificacion-asesoria-info-value">
                        {formatearHorario(asesoriaACalificar.hora_inicio)} - {formatearHorario(asesoriaACalificar.hora_fin)}
                      </span>

                    </div>

                    <div className="estudiante-calificacion-asesoria-info-item">
                      <span className="estudiante-calificacion-asesoria-info-label">Lugar:</span>
                      <span className="estudiante-calificacion-asesoria-info-value">
                        {asesoriaACalificar.lugar || 'No especificado'}
                      </span>
                    </div>

                    <div className="estudiante-calificacion-asesoria-info-item">
                      <span className="estudiante-calificacion-asesoria-info-label">Estado:</span>
                      <span className="estudiante-calificacion-asesoria-info-value">
                        {asesoriaACalificar.estado}
                      </span>
                    </div>

                    {asesoriaACalificar.motivo && (
                      <div className="estudiante-calificacion-asesoria-info-item full-width">
                        <span className="estudiante-calificacion-asesoria-info-label">Motivo:</span>
                        <span className="estudiante-calificacion-asesoria-info-value">
                          {asesoriaACalificar.motivo}
                        </span>
                      </div>
                    )}

                    {asesoriaACalificar.comentarios && (
                      <div className="estudiante-calificacion-asesoria-info-item full-width">
                        <span className="estudiante-calificacion-asesoria-info-label">Comentarios:</span>
                        <span className="estudiante-calificacion-asesoria-info-value">
                          {asesoriaACalificar.comentarios}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="estudiante-calificacion-asesoria-section">
                  <h4>Califica esta asesoría</h4>
                  <p>Por favor evalúa tu experiencia con esta asesoría:</p>

                  <div className="estudiante-calificacion-asesoria-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`star ${star <= calificacion ? 'filled' : ''}`}
                        onClick={() => setCalificacion(star)}
                      >
                        ★
                      </span>
                    ))}
                    <span className="estudiante-calificacion-asesoria-rating-text">
                      {calificacion > 0 ? `${calificacion} estrella${calificacion !== 1 ? 's' : ''}` : "Selecciona una calificación"}
                    </span>
                  </div>

                  <div className="estudiante-calificacion-asesoria-form-group">
                    <label>Comentario (opcional):</label>
                    <textarea
                      value={comentarioCalificacion}
                      onChange={(e) => setComentarioCalificacion(e.target.value)}
                      placeholder="¿Cómo fue tu experiencia con esta asesoría? ¿Qué aspectos destacarías o mejorarías?"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="estudiante-calificacion-asesoria-modal-footer">
                <button
                  onClick={enviarCalificacion}
                  className="estudiante-calificacion-asesoria-modal-confirm"
                  disabled={loading || calificacion === 0}
                >
                  {loading ? "Enviando..." : "Enviar Calificación"}
                </button>
              </div>
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