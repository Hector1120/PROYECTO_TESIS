import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/VisualizeAsignatura.css";

const VisualizarAsignatura = () => {
  const { usuario } = useAuth();
  const [asignaturas, setAsignaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroArea, setFiltroArea] = useState("");
  const [filtroSemestre, setFiltroSemestre] = useState("");

  useEffect(() => {
    const fetchAsignaturas = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8000/obtener-asignaturas-docente/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Para enviar cookies de sesión
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setAsignaturas(data.asignaturas);
        setError(null);
      } catch (err) {
        setError(`Error al cargar asignaturas: ${err.message}`);
        console.error("Error al cargar asignaturas:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAsignaturas();
  }, []);

  // Obtener áreas únicas para el filtro
  const areas = [...new Set(asignaturas.map(asignatura => asignatura.area.nombre))];

  // Obtener semestres únicos para el filtro
  const semestres = [...new Set(asignaturas.map(asignatura => asignatura.semestre))];

  // Filtrar asignaturas
  const asignaturasFiltradas = asignaturas.filter(asignatura => {
    return (
      (filtroArea === "" || asignatura.area.nombre === filtroArea) &&
      (filtroSemestre === "" || asignatura.semestre === filtroSemestre)
    );
  });

  const limpiarFiltros = () => {
    setFiltroArea("");
    setFiltroSemestre("");
  };


  return (
    <div className="visualizar-materia-container">
      <div className="materia-header">
        <h2>Mis Asignaturas</h2>
        <p className="subtitle">
          Aquí encontrarás todas las asignaturas que tienes asignadas para el periodo actual.
        </p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando asignaturas...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-icon">❌</div>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="filtros-container">
            <div className="filtros-inputs">
              <div className="filtro-grupo">
                <label htmlFor="filtro-area">Filtrar por área:</label>
                <select
                  id="filtro-area"
                  value={filtroArea}
                  onChange={(e) => setFiltroArea(e.target.value)}
                >
                  <option value="">Todas las áreas</option>
                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filtro-grupo">
                <label htmlFor="filtro-semestre">Filtrar por semestre:</label>
                <select
                  id="filtro-semestre"
                  value={filtroSemestre}
                  onChange={(e) => setFiltroSemestre(e.target.value)}
                >
                  <option value="">Todos los semestres</option>
                  {semestres.map((semestre) => (
                    <option key={semestre} value={semestre}>
                      {semestre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="filtros-actions">
              <button 
                onClick={limpiarFiltros} 
                className="asignatura-clear-filter"
                disabled={filtroArea === "" && filtroSemestre === ""}
              >
                <span className="clear-filter-icon">↺</span>
                Limpiar Filtros
              </button>
            </div>
          </div>

          {asignaturasFiltradas.length === 0 ? (
            <div className="no-asignaturas">
              <p>No se encontraron asignaturas con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="asignaturas-grid">
              {asignaturasFiltradas.map((asignatura) => (
                <div key={asignatura.id} className="asignatura-card">
                  <div className="asignatura-header">
                    <h3>{asignatura.nombre}</h3>
                    <span className="asignatura-semestre">{asignatura.semestre}</span>
                  </div>
                  <div className="asignatura-info">
                    <p>
                      <span className="info-label">Área:</span> {asignatura.area.nombre}
                    </p>
                    <p>
                      <span className="info-label">Director área:</span>{" "}
                      {asignatura.area.subtipo_director}
                    </p>
                    <div className="asignacion-badge">
                      {asignatura.asignado_directamente
                        ? "Asignación directa"
                        : "Asignado por área"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VisualizarAsignatura;