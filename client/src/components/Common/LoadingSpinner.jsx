import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = '#6366f1' }) => {
  const sizeMap = {
    small: 20,
    medium: 40,
    large: 60
  };

  const spinnerSize = sizeMap[size] || 40;

  const styles = {
    container: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    spinner: {
      width: spinnerSize,
      height: spinnerSize,
      border: `3px solid rgba(99, 102, 241, 0.1)`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;