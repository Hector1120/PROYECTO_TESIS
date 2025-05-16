import React from 'react';
import Director from './Director';
import {GraduationCap, CalendarDays, BookOpen, FileBarChart2 } from "lucide-react";

const DirectorCienciasBasicas = () => {
  const navbarOptions = [
    { id: 'gestion-docentes', label: 'Gestión de Docentes', icon: GraduationCap },
    { id: 'gestion-asignaturas', label: 'Gestión de Asignaturas', icon: CalendarDays },
    { id: 'gestion-horarios', label: 'Gestión de Horarios', icon: BookOpen },
    { id: 'reportes', label: 'Reportes del Departamento', icon: FileBarChart2 },
  ];

  const welcomeText = "Bienvenido Director de Ciencias Básicas";

  return <Director navbarOptions={navbarOptions} welcomeText={welcomeText} />;
};

export default DirectorCienciasBasicas;