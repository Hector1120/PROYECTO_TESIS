import React, { useState, useEffect } from 'react';
import '../styles/VisualizeHorario.css';
import ReactDOM from 'react-dom';

const VisualizarHorario = () => {
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('week'); // 'week' o 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [permisoEditar, setPermisoEditar] = useState(false);
  const [permisoEliminar, setPermisoEliminar] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [periodo, setPeriodo] = useState("");
  const [fechaInicioPeriodo, setFechaInicioPeriodo] = useState("");
  const [fechaFinPeriodo, setFechaFinPeriodo] = useState("");
  const [lugar, setLugar] = useState("");

  // Estados para la edición
  const [dia, setDia] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [fecha, setFecha] = useState('');
  const [isModalClosing, setIsModalClosing] = useState(false); // Nuevo estado para animación de cierre

  // Función para obtener los horarios del docente
  const fetchHorarios = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/obtener-horarios/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Para enviar cookies de sesión
      });

      if (!response.ok) {
        throw new Error('Error al cargar los horarios');
      }

      const data = await response.json();
      setBloques(data.bloques || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHorarios();

    // Agregar estilos para notificaciones de éxito y bloqueo de scroll
    const style = document.createElement('style');
    style.textContent = `
      .docente-visualizar-horario-success-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #34A853;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1100;
        opacity: 0;
        transform: translateY(20px);
        animation: notificationFadeIn 0.3s forwards, notificationFadeOut 0.3s forwards 2.7s;
        font-family: 'Roboto', Arial, sans-serif;
        font-size: 0.9rem;
      }
      
      @keyframes notificationFadeIn {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes notificationFadeOut {
        to {
          opacity: 0;
          transform: translateY(-20px);
        }
      }
      
      .docente-visualizar-horario-modal-closing {
        animation: slide-down 0.3s ease forwards;
      }
      
      @keyframes slide-down {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(20px);
        }
      }
      
      .docente-visualizar-horario-body.no-scroll {
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
      // Asegurarse de restaurar el scroll si el componente se desmonta
      enableScroll();
    };
  }, []);

  // Función para deshabilitar el scroll
  const disableScroll = () => {
    // Guardar la posición actual del scroll
    setScrollPosition(window.pageYOffset);
    // Aplicar la clase no-scroll al body
    document.body.classList.add('no-scroll');
    // Fijar el body en la posición actual
    document.body.style.position = 'fixed';
    document.body.style.top = `-${window.pageYOffset}px`;
    document.body.style.width = '100%';
  };

  // Función para habilitar el scroll
  const enableScroll = () => {
    // Eliminar la clase no-scroll
    document.body.classList.remove('no-scroll');
    // Restaurar las propiedades del body
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    // Restaurar la posición del scroll
    window.scrollTo(0, scrollPosition);
  };

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
    }
  };

  useEffect(() => {
    obtenerPeriodoVigente(); // Llamada inicial
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

  // Verificar permisos para un horario
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

  // Función para cerrar el modal con animación
  const closeModalWithAnimation = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setModoEdicion(false);
      setHorarioSeleccionado(null);
      setIsModalClosing(false);

      // Habilitar scroll cuando se cierra el modal
      document.body.style.overflow = '';
    }, 300);
  };

  const handleEditarHorario = async (e) => {
    e.preventDefault();

    // Validar el intervalo de tiempo si tiene permisos para editar el horario
    if (permisoEditar) {
      if (!validateTimeInterval(horaInicio, horaFin)) {
        alert("El intervalo de tiempo debe ser múltiplo de 15 minutos y mínimo 15 minutos");
        return;
      }

      // Validar que se haya seleccionado una fecha
      if (!fecha) {
        alert("Debe seleccionar una fecha");
        return;
      }

      // Validar que la fecha no sea pasada
      const fechaSeleccionada = new Date(fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Resetear la hora para comparar solo fechas

      // Validar que la fecha seleccionada no sea el día actual con hora pasada
      if (fechaSeleccionada.toDateString() === hoy.toDateString()) {
        const horaActual = new Date();
        const horaSeleccionada = new Date(fecha);
        if (horaSeleccionada < horaActual) {
          alert("No se puede seleccionar el día de hoy con una hora pasada");
          return;
        }
      }
    }

    // Validar que el lugar no esté vacío (siempre requerido, incluso sin otros permisos)
    if (!lugar.trim()) {
      alert("El lugar de encuentro es obligatorio");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/editar-horario/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          horario_id: horarioSeleccionado.horario_id,
          dia: dia,
          fecha: fecha,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          lugar: lugar.trim(),  // Incluir el lugar en el cuerpo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || "Error al editar el horario");
      }

      // Mostrar notificación y cerrar modal
      const successNotification = document.createElement('div');
      successNotification.className = 'docente-visualizar-horario-success-notification';
      successNotification.textContent = '✓ Horario editado con éxito';
      document.body.appendChild(successNotification);

      // Cerrar el modal con animación
      closeModalWithAnimation();

      // Actualizar la vista refrescando los datos
      fetchHorarios();

      // Eliminar la notificación después de 3 segundos
      setTimeout(() => {
        if (document.body.contains(successNotification)) {
          document.body.removeChild(successNotification);
        }
      }, 3000);

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

      // Mostrar notificación y cerrar modal
      const successNotification = document.createElement('div');
      successNotification.className = 'docente-visualizar-horario-success-notification';
      successNotification.textContent = '✓ Horario eliminado con éxito';
      document.body.appendChild(successNotification);

      // Cerrar el modal con animación
      closeModalWithAnimation();

      // Actualizar la vista refrescando los datos
      fetchHorarios();

      // Eliminar la notificación después de 3 segundos
      setTimeout(() => {
        if (document.body.contains(successNotification)) {
          document.body.removeChild(successNotification);
        }
      }, 3000);

    } catch (error) {
      alert(error.message);
    }
  };

  // Abrir el formulario de edición
  const abrirEdicion = (bloque) => {
    // Calcular la altura de la barra de navegación (ajusta este valor según tu barra real)
    const navbarHeight = 60; // Por ejemplo, 60px

    // Primero hacer scroll hacia abajo para asegurarnos que estamos debajo de la barra de navegación
    // pero solo si estamos muy arriba en la página
    if (window.scrollY < navbarHeight) {
      window.scrollTo({
        top: navbarHeight,
        behavior: 'instant' // Usar 'smooth' puede causar problemas de timing
      });
    }

    // Pequeña espera para asegurar que el scroll se ha completado
    setTimeout(() => {
      setHorarioSeleccionado(bloque);
      setDia(bloque.dia);
      setHoraInicio(bloque.hora_inicio);
      setHoraFin(bloque.hora_fin);
      setFecha(bloque.fecha);
      verificarPermisosHorario(bloque.horario_id);
      setModoEdicion(true);
      setLugar(bloque.lugar);

      // Deshabilitar scroll cuando se abre el modal
      document.body.style.overflow = 'hidden';
    }, 10);
  };

  // Cancelar la edición
  const cancelarEdicion = () => {
    closeModalWithAnimation();
  };

  // Obtener el primer y último día de la semana actual
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajuste para que la semana comience en lunes
    startOfWeek.setDate(diff);

    for (let i = 0; i < 5; i++) { // Solo días laborables (L-V)
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Calcular las horas del día para la vista de calendario
  const getHours = () => {
    const hours = [];
    // Desde las 7:00 AM hasta las 8:00 PM
    for (let hour = 7; hour <= 20; hour++) {
      hours.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 20) { // No agregar la media hora después de las 20:00
        hours.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return hours;
  };

  // Función para formatear fecha en formato YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Formato para mostrar el día y mes
  const formatDayMonth = (date) => {
    const options = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('es-ES', options);
  };

  // Obtener el nombre del día de la semana
  const getDayName = (date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  };

  // Calcular la posición y altura del bloque de horario
  const calculateBlockStyle = (bloque, hour) => {
    const [hourPart, minutePart] = hour.split(':').map(Number);
    const [bloqueHoraInicioH, bloqueHoraInicioM] = bloque.hora_inicio.split(':').map(Number);
    const [bloqueHoraFinH, bloqueHoraFinM] = bloque.hora_fin.split(':').map(Number);

    const cellTimeMinutes = hourPart * 60 + minutePart;
    const bloqueInicioMinutos = bloqueHoraInicioH * 60 + bloqueHoraInicioM;
    const bloqueFinMinutos = bloqueHoraFinH * 60 + bloqueHoraFinM;

    // Calcular posición top y altura
    const topOffset = Math.max(0, (bloqueInicioMinutos - cellTimeMinutes) / 30 * 100);
    const height = Math.min(100, (bloqueFinMinutos - bloqueInicioMinutos) / 30 * 100);

    return {
      top: `${topOffset}%`,
      height: `${height}%`,
      backgroundColor: getRandomColor(bloque.horario_id), // Color aleatorio basado en el ID
    };
  };

  // Generar color semi-aleatorio basado en el ID del horario
  const getRandomColor = (id) => {
    // Colores de Google Calendar
    const colors = [
      'rgba(66, 133, 244, 0.8)',   // Azul
      'rgba(219, 68, 55, 0.8)',     // Rojo
      'rgba(15, 157, 88, 0.8)',     // Verde
      'rgba(244, 180, 0, 0.8)',     // Amarillo
      'rgba(171, 71, 188, 0.8)',    // Púrpura
      'rgba(0, 172, 193, 0.8)',     // Turquesa
      'rgba(255, 112, 67, 0.8)',    // Naranja
    ];

    // Usar el ID para seleccionar un color consistente
    const colorIndex = parseInt(id) % colors.length;
    return colors[colorIndex];
  };

  // Modificar la función para mostrar todos los bloques
  const getBloqueEnHora = (date, hour) => {
    const formattedDate = formatDate(date);
    const [hourPart, minutePart] = hour.split(':');

    // Convertir la hora de la celda a minutos
    const cellTimeMinutes = parseInt(hourPart) * 60 + parseInt(minutePart);
    // Calcular el tiempo final de la celda (30 minutos después)
    const cellEndTimeMinutes = cellTimeMinutes + 30;

    return bloques.filter(bloque => {
      const bloqueDate = bloque.fecha;

      // Verificar si el bloque es para la fecha correcta
      if (bloqueDate !== formattedDate) return false;

      const [bloqueHoraInicioH, bloqueHoraInicioM] = bloque.hora_inicio.split(':');
      const [bloqueHoraFinH, bloqueHoraFinM] = bloque.hora_fin.split(':');

      const bloqueInicioMinutos = parseInt(bloqueHoraInicioH) * 60 + parseInt(bloqueHoraInicioM);
      const bloqueFinMinutos = parseInt(bloqueHoraFinH) * 60 + parseInt(bloqueHoraFinM);

      // Un bloque debe mostrarse si hay alguna intersección entre
      // el tiempo de la celda y el tiempo del bloque
      return (
        (bloqueInicioMinutos < cellEndTimeMinutes && bloqueFinMinutos > cellTimeMinutes)
      );
    });
  };

  // Cambiar a la semana anterior
  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  // Cambiar a la semana siguiente
  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Ir a la semana actual
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  // Detectar las teclas del teclado (flechas izquierda y derecha)
  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.key === "ArrowLeft") {
        prevWeek();
      } else if (event.key === "ArrowRight") {
        nextWeek();
      }
    };

    // Agregar el event listener al componente
    window.addEventListener("keydown", handleKeydown);

    // Limpiar el event listener cuando el componente se desmonte
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [currentDate]); // Solo se actualiza cuando currentDate cambia

  // Determinar qué día de la semana corresponde a una fecha
  const getDayOfWeekFromDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month es 0-indexed en JavaScript
    return date.getDay();
  };

  // Asignar automáticamente el día de la semana según la fecha seleccionada
  const handleFechaChange = (e) => {
    const newFecha = e.target.value;
    setFecha(newFecha);

    if (newFecha) {
      const dayIndex = getDayOfWeekFromDate(newFecha);
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      setDia(days[dayIndex]);
    }
  };

  // Renderizar vista semanal mejorada con estilo Google Calendar
  const renderWeekView = () => {
    const weekDays = getWeekDays();
    const hours = getHours();

    return (
      <div className="docente-visualizar-horario-calendario-container">
        <div className="docente-visualizar-horario-calendario-header">
          <div className="docente-visualizar-horario-calendario-hora-cell"></div>
          {weekDays.map((day, index) => (
            <div key={index} className="docente-visualizar-horario-calendario-day-header">
              <div className="docente-visualizar-horario-day-name">{getDayName(day)}</div>
              <div className="docente-visualizar-horario-day-date">{formatDayMonth(day)}</div>
            </div>
          ))}
        </div>
        <div className="docente-visualizar-horario-calendario-body">
          {hours.map((hour, hourIndex) => (
            <div key={hourIndex} className="docente-visualizar-horario-calendario-row">
              <div className="docente-visualizar-horario-calendario-hora-cell">{hour}</div>
              {weekDays.map((day, dayIndex) => {
                const bloquesEnHora = getBloqueEnHora(day, hour);
                return (
                  <div key={dayIndex} className="docente-visualizar-horario-calendario-cell">
                    {bloquesEnHora.map((bloque, bloqueIndex) => {
                      const blockStyle = calculateBlockStyle(bloque, hour);
                      return (
                        <div
                          key={bloqueIndex}
                          className="docente-visualizar-horario-bloque-horario"
                          style={blockStyle}
                          onClick={() => abrirEdicion(bloque)}
                        >
                          <div className="docente-visualizar-horario-bloque-content">
                            <span className="docente-visualizar-horario-bloque-hora">
                              {bloque.hora_inicio.substring(0, 5)} - {bloque.hora_fin.substring(0, 5)}
                            </span>
                            <span className="docente-visualizar-horario-bloque-periodo">{periodo}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Actualiza el renderFormularioEdicion en VisualizeHorario.jsx

  // Actualizar el renderFormularioEdicion para incluir el campo lugar
  const renderFormularioEdicion = () => {
    if (!horarioSeleccionado) return null;

    // Obtener la fecha actual en formato YYYY-MM-DD para usarla como fecha mínima
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const diaActual = String(hoy.getDate()).padStart(2, '0');
    const fechaMinima = `${anio}-${mes}-${diaActual}`;

    // Crear un portal para el modal que siempre estará posicionado correctamente
    return ReactDOM.createPortal(
      <div
        className="docente-visualizar-horario-modal-overlay"
        style={{
          paddingTop: '25px',
        }}
        onClick={(e) => {
          // Si el clic fue directamente en el overlay (y no dentro del contenido)
          if (e.target === e.currentTarget) {
            cancelarEdicion(); // o cualquier función que cierre el modal
          }
        }}
      >
        <div
          className={`docente-visualizar-horario-modal-content ${isModalClosing ? 'docente-visualizar-horario-modal-closing' : ''}`}
        >
          <h3>Editar Horario</h3>
          <form onSubmit={handleEditarHorario}>
            {!permisoEditar && !permisoEliminar && (
              <p className="docente-visualizar-horario-permiso-mensaje">
                No tiene permisos para editar horario o fecha.<br />
                Puede modificar solo el lugar de encuentro.
              </p>
            )}
            <div className="docente-visualizar-horario-form-group">
              <label>Fecha:</label>
              <input
                type="date"
                value={fecha}
                onChange={handleFechaChange}
                disabled={!permisoEditar}
                min={fechaMinima}
                max="2025-05-30"
              />
            </div>

            <div className="docente-visualizar-horario-form-group">
              <label>Día de la semana:</label>
              <input
                type="text"
                value={dia}
                readOnly
                disabled={true}
                className="docente-visualizar-horario-readonly-field"
              />
              <small className="docente-visualizar-horario-form-hint">El día se establece automáticamente según la fecha seleccionada</small>
            </div>

            <div className="docente-visualizar-horario-form-group">
              <label>Hora Inicio:</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                min="07:00"
                max="20:00"
                step="900"
                disabled={!permisoEditar}
              />
              <small className="docente-visualizar-horario-form-hint">Formato: HH:MM (intervalos de 15 minutos)</small>
            </div>

            <div className="docente-visualizar-horario-form-group">
              <label>Hora Fin:</label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                min="07:15"
                max="20:00"
                step="900"
                disabled={!permisoEditar}
              />
              <small className="docente-visualizar-horario-form-hint">Formato: HH:MM (intervalos de 15 minutos)</small>
            </div>

            {/* Campo para el lugar (siempre editable) */}
            <div className="docente-visualizar-horario-form-group">
              <label>Lugar:</label>
              <input
                type="text"
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                placeholder="Ej: Oficina 301, Bloque C"
                required
              />
              <small className="docente-visualizar-horario-form-hint">Este campo siempre se puede editar</small>
            </div>

            <div className="docente-visualizar-horario-form-actions">
              {/* Botón para guardar cambios (disponible incluso sin permisos de edición) */}
              <button type="submit" className="docente-visualizar-horario-btn-primary">
                Guardar Cambios
              </button>

              {permisoEliminar && (
                <button
                  type="button"
                  className="docente-visualizar-horario-btn-danger"
                  onClick={() => handleEliminarHorario(horarioSeleccionado.horario_id)}
                >
                  Eliminar Horario
                </button>
              )}

              <button
                type="button"
                className="docente-visualizar-horario-btn-secondary"
                onClick={cancelarEdicion}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body // El portal se monta directamente en el body
    );
  };

  // Nota: Necesitas importar ReactDOM al principio del archivo:
  // import ReactDOM from 'react-dom';

  return (
    <div className="docente-visualizar-horario-visualizar-horario-container">
      <div className="docente-visualizar-horario-horario-controles">
        <div className="docente-visualizar-horario-horario-title">
          <h2>Visualizar Horario</h2>
          <div className="docente-visualizar-horario-periodo-badge">{periodo || "Cargando..."}</div>
          <p>
            <span className="docente-visualizar-horario-fechas-label">Fechas:</span>{" "}
            <span className="docente-visualizar-horario-periodo-dates">
              {fechaInicioPeriodo && fechaFinPeriodo
                ? `${new Date(fechaInicioPeriodo).toLocaleDateString('es-ES', { timeZone: 'UTC' })} - ${new Date(
                  fechaFinPeriodo
                ).toLocaleDateString('es-ES', { timeZone: 'UTC' })}`
                : "Cargando fechas..."}
            </span>
          </p>

        </div>
        <div className="docente-visualizar-horario-horario-navegacion">
          <button onClick={prevWeek} className="docente-visualizar-horario-nav-button">
            <span>&#10094;</span> Semana Anterior
          </button>
          <button onClick={goToToday} className="docente-visualizar-horario-nav-button today-button">
            Hoy
          </button>
          <button onClick={nextWeek} className="docente-visualizar-horario-nav-button">
            Semana Siguiente <span>&#10095;</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="docente-visualizar-horario-loading-container">
          <div className="docente-visualizar-horario-loading-spinner"></div>
          <p>Cargando horarios...</p>
        </div>
      ) : error ? (
        <div className="docente-visualizar-horario-error-message">
          <p>{error}</p>
          <p>Por favor intenta de nuevo más tarde.</p>
        </div>
      ) : bloques.length === 0 ? (
        <div className="docente-visualizar-horario-no-horarios-message">
          <p>No se encontraron horarios registrados para este periodo.</p>
          <p>Puedes registrar nuevos horarios en la sección "Registrar Horario".</p>
        </div>
      ) : (
        renderWeekView()
      )}

      {/* Modal de edición */}
      {modoEdicion && renderFormularioEdicion()}
    </div>
  );
};

export default VisualizarHorario;