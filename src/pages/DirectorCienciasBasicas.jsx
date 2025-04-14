import React from 'react';
import Director from './Director';

const DirectorCienciasBasicas = () => {
  const navbarOptions = [
    { id: 'gestion-docentes', label: 'Gestión de Docentes',  },
    { id: 'gestion-asignaturas', label: 'Gestión de Asignaturas',  },
    { id: 'gestion-horarios', label: 'Gestión de Horarios',  },
    { id: 'laboratorios', label: 'Gestión de Laboratorios',  },
    { id: 'investigacion', label: 'Proyectos de Investigación',  },
    { id: 'practicas', label: 'Prácticas Científicas', }
  ];

  const welcomeText = "Bienvenido Director de Ciencias Básicas";

  return <Director navbarOptions={navbarOptions} welcomeText={welcomeText} />;
};

export default DirectorCienciasBasicas;