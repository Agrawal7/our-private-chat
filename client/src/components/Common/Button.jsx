import React from 'react';
import './Button.css'; // Optional: create simple button styles

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  type = 'button',
  className = ''
}) => {
  const getVariantClass = () => {
    switch(variant) {
      case 'primary':
        return 'btn-primary';
      case 'secondary':
        return 'btn-secondary';
      case 'danger':
        return 'btn-danger';
      default:
        return 'btn-primary';
    }
  };

  return (
    <button
      type={type}
      className={`btn ${getVariantClass()} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;z