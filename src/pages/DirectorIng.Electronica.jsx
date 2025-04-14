import React from 'react';
import Director from './Director';

const DirectorIngElectronica = () => {
  const navbarOptions = [
    { id: 'gestion-docentes', label: 'Gestión de Docentes',  },
    { id: 'gestion-horarios', label: 'Gestión de Horarios',  },
    { id: 'gestion-asignaturas', label: 'Gestión de Asignaturas',  },
    { id: 'gestion-programa', label: 'Gestión del Programa',  },
    { id: 'reportes-programa', label: 'Reportes del Programa',  }
  ];

  const welcomeText = "Bienvenido Director de Ing.Electrónica";

  return <Director navbarOptions={navbarOptions} welcomeText={welcomeText} />;
};

export default DirectorIngElectronica;