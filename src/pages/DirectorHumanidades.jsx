import React from 'react';
import Director from './Director';

const DirectorHumanidades = () => {
  const navbarOptions = [
    { id: 'gestion-docentes', label: 'Gestión de Docentes',  },
    { id: 'gestion-horarios', label: 'Gestión de Horarios', },
    { id: 'gestion-asignaturas', label: 'Gestión de Asignaturas',  },
    { id: 'cursos-humanidades', label: 'Cursos de Humanidades',  },
    { id: 'materiales-didacticos', label: 'Materiales Didácticos',}
  ];

  const welcomeText = "Bienvenido Director de Humanidades";

  return <Director navbarOptions={navbarOptions} welcomeText={welcomeText} />;
};

export default DirectorHumanidades;