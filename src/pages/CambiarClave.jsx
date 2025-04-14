import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  Shield, 
  KeyRound,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import '../styles/PageCambiarClave.css';

const CambiarClave = () => {
  const [formData, setFormData] = useState({
    contraseñaActual: '',
    nuevaContraseña: '',
    confirmarContraseña: ''
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [animateShake, setAnimateShake] = useState(false);

  // Efecto para manejar la animación de shake cuando hay un error
  useEffect(() => {
    if (status.type === 'error') {
      setAnimateShake(true);
      const timer = setTimeout(() => {
        setAnimateShake(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Nuevo efecto para ocultar los mensajes de estado después de 5 segundos
  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => {
        setStatus({ type: '', message: '' });
      }, 5000); // 5 segundos
      
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validatePassword = (password) => {
    // Requiere al menos 8 caracteres, 1 letra mayúscula, 1 minúscula y 1 número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    // Validación de formulario
    if (!formData.contraseñaActual || !formData.nuevaContraseña || !formData.confirmarContraseña) {
      setStatus({ type: 'error', message: 'Todos los campos son obligatorios' });
      setLoading(false);
      return;
    }

    if (formData.nuevaContraseña !== formData.confirmarContraseña) {
      setStatus({ type: 'error', message: 'Las contraseñas nuevas no coinciden' });
      setLoading(false);
      return;
    }

    if (!validatePassword(formData.nuevaContraseña)) {
      setStatus({ 
        type: 'error', 
        message: 'La contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 minúscula y 1 número' 
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/cambiar-contraseña/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          contraseña_actual: formData.contraseñaActual,
          nueva_contraseña: formData.nuevaContraseña
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: data.mensaje || 'Contraseña actualizada con éxito' });
        // Limpiar el formulario después de un cambio exitoso
        setFormData({
          contraseñaActual: '',
          nuevaContraseña: '',
          confirmarContraseña: ''
        });
      } else {
        setStatus({ type: 'error', message: data.mensaje || 'Error al actualizar la contraseña' });
      }
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      setStatus({ type: 'error', message: 'Error de conexión al servidor' });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    switch(field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };

  // Para mostrar la fortaleza de la contraseña
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', class: '' };
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    let text = '';
    let className = '';
    
    switch(strength) {
      case 1:
        text = 'Muy débil';
        className = 'clave-very-weak';
        break;
      case 2:
        text = 'Débil';
        className = 'clave-weak';
        break;
      case 3:
        text = 'Moderada';
        className = 'clave-moderate';
        break;
      case 4:
        text = 'Fuerte';
        className = 'clave-strong';
        break;
      case 5:
        text = 'Muy fuerte';
        className = 'clave-very-strong';
        break;
      default:
        text = '';
        className = '';
    }

    return { strength, text, class: className };
  };

  const passwordStrength = getPasswordStrength(formData.nuevaContraseña);

  return (
    <div className="clave-cambiar-clave-container">
      {/* Animated background elements */}
      <div className="clave-floating-element clave-floating-element-1"></div>
      <div className="clave-floating-element clave-floating-element-2"></div>
      <div className="clave-floating-element clave-floating-element-3"></div>
      
      <div className={`clave-cambiar-clave-card ${animateShake ? 'shake' : ''}`}>
        <div className="clave-card-header">
          <div className="clave-lock-icon-wrapper">
            <Lock size={36} strokeWidth={1.5} className="clave-lock-icon" />
          </div>
          <h2>Cambiar Contraseña</h2>
          <p>Actualiza tu contraseña para mantener tu cuenta segura</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="clave-form-group">
            <label htmlFor="contraseñaActual">
              <KeyRound size={16} className="input-icon" /> Contraseña Actual
            </label>
            <div className="clave-password-input-container">
              <input
                type={showCurrentPassword ? "text" : "password"}
                id="contraseñaActual"
                name="contraseñaActual"
                value={formData.contraseñaActual}
                onChange={handleInputChange}
                placeholder="Ingresa tu contraseña actual"
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className="clave-toggle-password-visibility"
                onClick={() => togglePasswordVisibility('current')}
                aria-label={showCurrentPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {!showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="clave-form-group">
            <label htmlFor="nuevaContraseña">
              <Shield size={16} className="input-icon" /> Nueva Contraseña
            </label>
            <div className="clave-password-input-container">
              <input
                type={showNewPassword ? "text" : "password"}
                id="nuevaContraseña"
                name="nuevaContraseña"
                value={formData.nuevaContraseña}
                onChange={handleInputChange}
                placeholder="Ingresa tu nueva contraseña"
                autoComplete="new-password"
              />
              <button 
                type="button" 
                className="clave-toggle-password-visibility"
                onClick={() => togglePasswordVisibility('new')}
                aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {!showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {formData.nuevaContraseña && (
              <div className="clave-password-strength-container">
                <div className="clave-strength-bars">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div 
                      key={level} 
                      className={`clave-strength-bar ${level <= passwordStrength.strength ? passwordStrength.class : ''}`}
                    ></div>
                  ))}
                </div>
                <span className={`clave-strength-text ${passwordStrength.class}`}>
                  {passwordStrength.text}
                </span>
              </div>
            )}
            
            <div className="clave-password-requirements">
              <p>La contraseña debe contener:</p>
              <ul>
                <li className={formData.nuevaContraseña.length >= 8 ? 'clave-valid' : ''}>
                  Al menos 8 caracteres
                </li>
                <li className={/[A-Z]/.test(formData.nuevaContraseña) ? 'clave-valid' : ''}>
                  Al menos 1 letra mayúscula
                </li>
                <li className={/[a-z]/.test(formData.nuevaContraseña) ? 'clave-valid' : ''}>
                  Al menos 1 letra minúscula
                </li>
                <li className={/[0-9]/.test(formData.nuevaContraseña) ? 'clave-valid' : ''}>
                  Al menos 1 número
                </li>
              </ul>
            </div>
          </div>

          <div className="clave-form-group">
            <label htmlFor="confirmarContraseña">
              <Check size={16} className="input-icon" /> Confirmar Contraseña
            </label>
            <div className="clave-password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmarContraseña"
                name="confirmarContraseña"
                value={formData.confirmarContraseña}
                onChange={handleInputChange}
                placeholder="Confirma tu nueva contraseña"
                autoComplete="new-password"
              />
              <button 
                type="button" 
                className="clave-toggle-password-visibility"
                onClick={() => togglePasswordVisibility('confirm')}
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {!showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.confirmarContraseña && formData.nuevaContraseña && (
              <div className={`clave-passwords-match-indicator ${formData.nuevaContraseña === formData.confirmarContraseña ? 'clave-match' : 'clave-no-match'}`}>
                {formData.nuevaContraseña === formData.confirmarContraseña ? (
                  <>
                    <CheckCircle2 size={18} /> Las contraseñas coinciden
                  </>
                ) : (
                  <>
                    <XCircle size={18} /> Las contraseñas no coinciden
                  </>
                )}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="clave-submit-button" 
            disabled={loading}
          >
            <div className="clave-button-content">
              {loading ? (
                <>
                  <span className="clave-loader"></span>
                  Procesando...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  Actualizar Contraseña
                </>
              )}
            </div>
          </button>
        </form>
        
        {/* Mensaje de estado que aparece en el centro y desaparece automáticamente */}
        {status.message && (
          <div className={`clave-status-message-overlay ${status.type}`}>
            <div className={`clave-status-message ${status.type}`}>
              {status.type === 'success' ? (
                <CheckCircle2 size={22} strokeWidth={2} />
              ) : (
                <AlertCircle size={22} strokeWidth={2} />
              )}
              <span>{status.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CambiarClave;