// Generate random room code
export const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Format timestamp
export const formatTime = (date = new Date()) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Validate room code
export const isValidRoomCode = (code) => {
  return /^[A-Z0-9]{6}$/.test(code);
};

// Validate name
export const isValidName = (name) => {
  return name && name.trim().length >= 1 && name.trim().length <= 30;
};

// Debounce function for typing indicator
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Format call duration
export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};