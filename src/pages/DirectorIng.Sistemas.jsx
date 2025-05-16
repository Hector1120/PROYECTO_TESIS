import React from 'react';
import Director from './Director';
import { Users, GraduationCap, CalendarDays, BookOpen, FileBarChart2 } from "lucide-react";

const DirectorIngSistemas = () => {
  const navbarOptions = [
    { id: 'gestion-estudiantes', label: 'Gestión de Estudiantes', icon: Users },
    { id: 'gestion-docentes', label: 'Gestión de Docentes', icon: GraduationCap },
    { id: 'gestion-horarios', label: 'Gestión de Horarios', icon: CalendarDays },
    { id: 'gestion-asignaturas', label: 'Gestión de Asignaturas', icon: BookOpen },
    { id: 'reportes-programa', label: 'Reportes del Programa', icon: FileBarChart2 }
  ];

  const welcomeText = "Bienvenido Director de Ing.Sistemas";

  return <Director navbarOptions={navbarOptions} welcomeText={welcomeText} />;
};

export default DirectorIngSistemas;
