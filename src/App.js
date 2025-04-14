// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/login';
import Estudiantes from './pages/Estudiantes';
import Docentes from './pages/Docentes';
import ProtectedRoute from './components/ProtectedRoute';
import RecuperarContraseña from './pages/RecuperarContraseña';
import MenuDocentes from './pages/MenuDocentes';
import Administradores from './pages/Administracion';
import Director from './pages/Director';

// Importamos los componentes específicos para cada tipo de director
// Estos componentes utilizarán el mismo Director.jsx pero con configuraciones específicas
import DirectorIngSistemas from './pages/DirectorIng.Sistemas';
import DirectorIngElectronica from './pages/DirectorIng.Electronica';
import DirectorHumanidades from './pages/DirectorHumanidades';
import DirectorCienciasBasicas from './pages/DirectorCienciasBasicas';
import DirectorIdiomas from './pages/DirectorIdiomas';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/*<Route path="/menu-docentes" element={<MenuDocentes/>} />*/}
          <Route path="/" element={<Login />} />
          <Route path="/recuperar-contraseña" element={<RecuperarContraseña />} />
          <Route path="/estudiantes" element={
            <ProtectedRoute rolRequerido="Estudiante">
              <Estudiantes />
            </ProtectedRoute>
          } />
          <Route path="/docentes" element={
            <ProtectedRoute rolRequerido="Docente">
              <Docentes />
            </ProtectedRoute>
          } />
          <Route path="/administracion" element={
            <ProtectedRoute rolRequerido="Administrador">
              <Administradores />
            </ProtectedRoute>
          } />
          {/* Ruta genérica para directores */}
          <Route path="/directores" element={
            <ProtectedRoute rolRequerido="Director">
              <Director />
            </ProtectedRoute>
          } />
          {/* Rutas específicas para cada tipo de director */}
          <Route path="/directores/ing-sistemas" element={
            <ProtectedRoute rolRequerido="Director" subtipoRequerido="Director de Ing.Sistemas">
              <DirectorIngSistemas />
            </ProtectedRoute>
          } />
          <Route path="/directores/ing-electronica" element={
            <ProtectedRoute rolRequerido="Director" subtipoRequerido="Director de Ing.Electrónica">
              <DirectorIngElectronica />
            </ProtectedRoute>
          } />
          <Route path="/directores/humanidades" element={
            <ProtectedRoute rolRequerido="Director" subtipoRequerido="Director de Humanidades">
              <DirectorHumanidades />
            </ProtectedRoute>
          } />
          <Route path="/directores/ciencias-basicas" element={
            <ProtectedRoute rolRequerido="Director" subtipoRequerido="Director de Ciencias Básicas">
              <DirectorCienciasBasicas />
            </ProtectedRoute>
          } />
          <Route path="/directores/idiomas" element={
            <ProtectedRoute rolRequerido="Director" subtipoRequerido="Director de Idiomas">
              <DirectorIdiomas />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;