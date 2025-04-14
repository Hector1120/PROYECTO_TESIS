import React, { useState, useEffect } from 'react';
import '../styles/VisualizeHorario.css';

const VisualizarHorario = () => {
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('week'); // 'week' o 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [periodo, setPeriodo] = useState('2025-1');
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [permisoEditar, setPermisoEditar] = useState(false);
  const [permisoEliminar, setPermisoEliminar] = useState(false);
  
  // Nuevos estados para la edición
  const [dia, setDia] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [fecha, setFecha] = useState(''); // Nuevo estado para la fecha

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

  // Función para editar un horario
  const handleEditarHorario = async (e) => {
    e.preventDefault();

    // Validar el intervalo de tiempo
    if (!validateTimeInterval(horaInicio, horaFin)) {
      alert("El intervalo de tiempo debe ser múltiplo de 15 minutos y mínimo 15 minutos");
      return;
    }

    // Validar que se haya seleccionado una fecha
    if (!fecha) {
      alert("Debe seleccionar una fecha");
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
          fecha: fecha, // Enviamos la fecha seleccionada
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

      // Actualizar la vista refrescando los datos desde el servidor
      fetchHorarios();
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

      // Actualizar la vista refrescando los datos desde el servidor
      fetchHorarios();
    } catch (error) {
      alert(error.message);
    }
  };

  // Abrir el formulario de edición
  const abrirEdicion = (bloque) => {
    setHorarioSeleccionado(bloque);
    setDia(bloque.dia);
    setHoraInicio(bloque.hora_inicio);
    setHoraFin(bloque.hora_fin);
    setFecha(bloque.fecha); // Inicializar la fecha con la del bloque
    verificarPermisosHorario(bloque.horario_id);
    setModoEdicion(true);
  };

  // Cancelar la edición
  const cancelarEdicion = () => {
    setModoEdicion(false);
    setHorarioSeleccionado(null);
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

  // Modificar la función para mostrar todos los bloques que tienen intersección con la celda
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

  // Determinar qué día de la semana corresponde a una fecha (0=Domingo, 1=Lunes, ...)
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

  // Renderizar vista semanal
  const renderWeekView = () => {
    const weekDays = getWeekDays();
    const hours = getHours();

    return (
      <div className="calendario-container">
        <div className="calendario-header">
          <div className="calendario-hora-cell"></div>
          {weekDays.map((day, index) => (
            <div key={index} className="calendario-day-header">
              <div className="day-name">{getDayName(day)}</div>
              <div className="day-date">{formatDayMonth(day)}</div>
            </div>
          ))}
        </div>
        <div className="calendario-body">
          {hours.map((hour, hourIndex) => (
            <div key={hourIndex} className="calendario-row">
              <div className="calendario-hora-cell">{hour}</div>
              {weekDays.map((day, dayIndex) => {
                const bloquesEnHora = getBloqueEnHora(day, hour);
                return (
                  <div key={dayIndex} className="calendario-cell">
                    {bloquesEnHora.length > 0 && (
                      <div className="bloque-horario">
                        {bloquesEnHora.map((bloque, bloqueIndex) => (
                          <div 
                            key={bloqueIndex} 
                            className="bloque-content"
                            onClick={() => abrirEdicion(bloque)}
                          >
                            <span className="bloque-hora">
                              {bloque.hora_inicio.substring(0, 5)} - {bloque.hora_fin.substring(0, 5)}
                            </span>
                            <span className="bloque-periodo">{periodo}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Formulario de edición
  const renderFormularioEdicion = () => {
    if (!horarioSeleccionado) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Editar Horario</h3>
          
          <form onSubmit={handleEditarHorario}>
            <div className="form-group">
              <label>Fecha:</label>
              <input 
                type="date" 
                value={fecha} 
                onChange={handleFechaChange}
                disabled={!permisoEditar}
                min="2025-01-01"
                max="2025-12-31"
              />
            </div>
            
            <div className="form-group">
              <label>Día de la semana:</label>
              <input 
                type="text" 
                value={dia} 
                readOnly 
                disabled={true}
                className="readonly-field"
              />
              <small className="form-hint">El día se establece automáticamente según la fecha seleccionada</small>
            </div>
            
            <div className="form-group">
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
            </div>
            
            <div className="form-group">
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
            </div>
            
            <div className="form-actions">
              {permisoEditar && (
                <button type="submit" className="btn-primary">
                  Guardar Cambios
                </button>
              )}
              
              {permisoEliminar && (
                <button 
                  type="button" 
                  className="btn-danger"
                  onClick={() => handleEliminarHorario(horarioSeleccionado.horario_id)}
                >
                  Eliminar Horario
                </button>
              )}
              
              <button 
                type="button" 
                className="btn-secondary"
                onClick={cancelarEdicion}
              >
                Cancelar
              </button>
              
              {!permisoEditar && !permisoEliminar && (
                <p className="permiso-mensaje">
                  No tiene permisos para editar o eliminar este horario.
                  Contacte al director de su departamento para solicitar permisos.
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="visualizar-horario-container">
      <div className="horario-controles">
        <div className="horario-title">
          <h2>Visualizar Horario</h2>
          <div className="periodo-badge">{periodo}</div>
        </div>
        <div className="horario-navegacion">
          <button onClick={prevWeek} className="nav-button">
            <span>&#10094;</span> Semana Anterior
          </button>
          <button onClick={goToToday} className="nav-button today-button">
            Hoy
          </button>
          <button onClick={nextWeek} className="nav-button">
            Semana Siguiente <span>&#10095;</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando horarios...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <p>Por favor intenta de nuevo más tarde.</p>
        </div>
      ) : bloques.length === 0 ? (
        <div className="no-horarios-message">
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