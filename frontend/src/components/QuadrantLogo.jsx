import React from 'react';
import logoImg from '../assets/logo.png';

const QuadrantLogo = ({ className = "h-6 w-6" }) => {
  return (
    <img 
      src={logoImg} 
      alt="Quadrant IT Services" 
      className={`${className} object-contain`} 
    />
  );
};

export default QuadrantLogo;
