import React from 'react';
import Director from './Director';
import {GraduationCap, CalendarDays, BookOpen, FileBarChart2 } from "lucide-react";

const DirectorIngElectronica = () => {
  const navbarOptions = [
    { id: 'gestion-docentes', label: 'Gestión de Docentes', icon: GraduationCap },
    { id: 'gestion-horarios', label: 'Gestión de Horarios', icon: CalendarDays },
    { id: 'gestion-asignaturas', label: 'Gestión de Asignaturas', icon: BookOpen },
    { id: 'reportes-programa', label: 'Reportes del Programa', icon: FileBarChart2 }
  ];

  const welcomeText = "Bienvenido Director de Ing.Electrónica";

  return <Director navbarOptions={navbarOptions} welcomeText={welcomeText} />;
};

export default DirectorIngElectronica;