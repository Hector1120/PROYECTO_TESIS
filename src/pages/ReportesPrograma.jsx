import React, { useState, useEffect } from "react";
import "../styles/ReportesPrograma.css"; 

const ReportesPrograma = () => {
  const [docentes, setDocentes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [docenteSeleccionado, setDocenteSeleccionado] = useState("");
  const [periodos, setPeriodos] = useState([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");
  const [generandoReporte, setGenerandoReporte] = useState(false);

  // Cargar la lista de docentes y periodos cuando el componente se monta
  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      setError("");
      
      try {
        // Cargar docentes
        const responseDocentes = await fetch("http://localhost:8000/listar-docentes-para-reportes/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        
        if (!responseDocentes.ok) {
          throw new Error(`Error al cargar docentes: ${responseDocentes.status}`);
        }
        
        const dataDocentes = await responseDocentes.json();
        setDocentes(dataDocentes.docentes || []);
        
        // Cargar periodos desde el servidor
        try {
          const responsePeriodos = await fetch("http://localhost:8000/get-periodos/", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          });
          
          if (responsePeriodos.ok) {
            const dataPeriodos = await responsePeriodos.json();
            if (dataPeriodos && dataPeriodos.length > 0) {
              // Ordenar periodos de más reciente a más antiguo
              const periodosOrdenados = dataPeriodos.sort((a, b) => 
                b.codigo.localeCompare(a.codigo)
              );
              setPeriodos(periodosOrdenados.map(p => p.codigo));
              
              // Seleccionar el periodo activo por defecto
              const periodoActivo = periodosOrdenados.find(p => p.activo);
              if (periodoActivo) {
                setPeriodoSeleccionado(periodoActivo.codigo);
              } else {
                setPeriodoSeleccionado(periodosOrdenados[0].codigo);
              }
              return; // Terminar función si obtenemos periodos del servidor
            }
          }
        } catch (e) {
          console.warn("No se pudieron cargar los periodos desde el servidor:", e);
          // Si hay error, continuamos con la generación local de periodos
        }
        
        // Generar periodos localmente como fallback
        const periodosList = [];
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= currentYear - 3; year--) {
          periodosList.push(`${year}-01`); // Primer semestre
          periodosList.push(`${year}-02`); // Segundo semestre
        }
        setPeriodos(periodosList);
        setPeriodoSeleccionado(periodosList[0]); // Seleccionar el periodo actual por defecto
        
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError(`No se pudieron cargar los datos: ${err.message}`);
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, []);

  const generarReporte = async () => {
    if (!docenteSeleccionado) {
      setError("Por favor seleccione un docente para generar el reporte");
      return;
    }
    
    setGenerandoReporte(true);
    setError("");
    
    try {
      // Construimos la URL con parámetros de consulta para el periodo
      const url = `http://localhost:8000/generar-reporte-asesoria-docente/${docenteSeleccionado}/?periodo=${periodoSeleccionado}`;
      
      // Abrimos la URL en una nueva ventana o pestaña para descargar el archivo
      window.open(url, "_blank");
    } catch (err) {
      console.error("Error al generar reporte:", err);
      setError(`No se pudo generar el reporte: ${err.message}`);
    } finally {
      setGenerandoReporte(false);
    }
  };

  return (
    <div className="docente-reportes-programa-container">
      <h2 className="docente-reportes-programa-title">Reportes de Asesorías por Docente</h2>
      
      {error && (
        <div className="docente-reportes-programa-error" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <div className="docente-reportes-programa-grid">
        <div>
          <label htmlFor="docente" className="docente-reportes-programa-label">
            Seleccionar Docente
          </label>
          <select
            id="docente"
            className="docente-reportes-programa-select"
            value={docenteSeleccionado}
            onChange={(e) => setDocenteSeleccionado(e.target.value)}
            disabled={cargando || generandoReporte}
          >
            <option value="">Seleccione un docente</option>
            {docentes.map((docente) => (
              <option key={docente.id} value={docente.id}>
                {docente.nombre} - {docente.correo} ({docente.subtipo})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="periodo" className="docente-reportes-programa-label">
            Seleccionar Periodo
          </label>
          <select
            id="periodo"
            className="docente-reportes-programa-select"
            value={periodoSeleccionado}
            onChange={(e) => setPeriodoSeleccionado(e.target.value)}
            disabled={cargando || generandoReporte}
          >
            {periodos.map((periodo) => (
              <option key={periodo} value={periodo}>
                {periodo.split("-")[0]} - Semestre {periodo.split("-")[1]}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="docente-reportes-programa-button-container">
        <button
          type="button"
          className={`docente-reportes-programa-button ${
            !docenteSeleccionado || generandoReporte
              ? "docente-reportes-programa-button-disabled"
              : "docente-reportes-programa-button-enabled"
          }`}
          onClick={generarReporte}
          disabled={!docenteSeleccionado || generandoReporte}
        >
          {generandoReporte ? (
            <>
              <svg className="docente-reportes-programa-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="docente-reportes-programa-spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="docente-reportes-programa-spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generando...
            </>
          ) : (
            "Generar Reporte de Asesorías"
          )}
        </button>
      </div>
      
      <div className="docente-reportes-programa-info-container">
        <h3 className="docente-reportes-programa-info-title">Información del Reporte</h3>
        <p className="docente-reportes-programa-info-text">
          El reporte incluirá todas las asesorías finalizadas del docente seleccionado para el periodo indicado.
          Se generará un documento DOCX que podrá descargar inmediatamente.
        </p>
        <p className="docente-reportes-programa-info-text">
          El reporte contiene información detallada de cada asesoría, incluyendo:
        </p>
        <ul className="docente-reportes-programa-info-list">
          <li>Fecha y hora de las asesorías</li>
          <li>Información de los estudiantes atendidos</li>
          <li>Temas abordados en cada sesión</li>
          <li>Control de asistencia</li>
          <li>Calificaciones asignadas</li>
        </ul>
      </div>
    </div>
  );
};

export default ReportesPrograma;