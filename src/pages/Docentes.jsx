import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MenuDocentes from "./MenuDocentes";

const Docentes = () => {
  const { usuario } = useAuth();
  
  // Redireccionar directamente a MenuDocentes
  return <MenuDocentes />;
};

export default Docentes;