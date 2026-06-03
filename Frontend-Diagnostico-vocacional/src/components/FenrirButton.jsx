import React, { useRef, useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const FenrirButton = ({ children, onClick, className = '', variant }) => {
  const btnRef = useRef(null);
  const [perimeter, setPerimeter] = useState(0);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    if (btnRef.current) {
      const width = btnRef.current.offsetWidth;
      const height = btnRef.current.offsetHeight;
      setPerimeter(2 * (width + height));
    }
  }, [children]);

  // Si no se pasa variant, calculamos una por defecto basada en el tema global
  // Pero permitimos forzar 'light' o 'dark' para secciones con fondo fijo.
  const activeVariant = variant || (theme === 'dark' ? 'light' : 'dark');
  const variantClass = activeVariant === 'dark' ? 'button--fenrir-dark' : 'button--fenrir-light';

  return (
    <button 
      ref={btnRef}
      className={`button--fenrir ${variantClass} ${className}`} 
      onClick={onClick}
      style={{ '--perimeter': perimeter }}
    >
      <svg aria-hidden="true" className="progress">
        <rect 
          className="progress__rect" 
          x="0" 
          y="0" 
          width="100%" 
          height="100%"
        ></rect>
      </svg>
      <span>{children}</span>
    </button>
  );
};

export default FenrirButton;
