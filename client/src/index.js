import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/global.css';
import App from './App';

// Global security measures
const disableDevTools = () => {
  // Disable right-click globally (except on input fields)
  document.addEventListener('contextmenu', (e) => {
    // Allow right-click on input fields (for copy/paste)
    if (!e.target.matches('input, textarea')) {
      e.preventDefault();
      return false;
    }
  });
  
  // Disable keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Disable F12 (DevTools)
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+S (Save)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+P (Print)
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+R (Refresh) - optional
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      return false;
    }
    
    // Disable F5 (Refresh)
    if (e.key === 'F5') {
      e.preventDefault();
      return false;
    }
  });
  
  // Disable drag and drop on non-input elements
  document.addEventListener('dragstart', (e) => {
    if (!e.target.matches('input, textarea')) {
      e.preventDefault();
      return false;
    }
  });
  
  // Optional: Clear console only in production (not during development)
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      if (typeof console !== 'undefined' && console.clear) {
        console.clear();
      }
    }, 10000); // Clear every 10 seconds instead of 1 second
  }
};

// Execute security measures only in production
if (process.env.NODE_ENV === 'production') {
  disableDevTools();
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);