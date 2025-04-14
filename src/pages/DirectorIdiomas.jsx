import React from 'react';
import Director from './Director';

const DirectorIdiomas = () => {
  const navbarOptions = [
    { id: 'gestion-docentes', label: 'Gestión de Docentes',  },
    { id: 'gestion-horarios', label: 'Gestión de Horarios'},
    { id: 'gestion-asignaturas', label: 'Gestión de Asignaturas',  },
    { id: 'cursos-idiomas', label: 'Cursos de Idiomas' },
    { id: 'recursos-linguisticos', label: 'Recursos Lingüísticos'},
    { id: 'intercambios', label: 'Programas de Intercambio'}
  ];

  const welcomeText = "Bienvenido Director de Idiomas";

  return <Director navbarOptions={navbarOptions} welcomeText={welcomeText} />;
};

export default DirectorIdiomas;