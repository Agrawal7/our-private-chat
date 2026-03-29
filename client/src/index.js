import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Global security measures
const disableDevTools = () => {
  // Disable right-click globally
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });
  
  // Disable keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Disable F12
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+U
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+S
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      return false;
    }
  });
  
  // Clear console periodically
  setInterval(() => {
    if (typeof console !== 'undefined' && console.clear) {
      console.clear();
    }
  }, 1000);
};

// Execute security measures
disableDevTools();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);