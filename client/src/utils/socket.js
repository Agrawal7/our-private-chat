import { io } from "socket.io-client";

// Automatically use local server when running on localhost
const getSocketUrl = () => {
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return "http://localhost:5000";
  }
  return process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";
};

const SOCKET_URL = getSocketUrl();


console.log("🔌 Connecting to server at:", SOCKET_URL);

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling']
});

// Connection event listeners for debugging
socket.on('connect', () => {
  console.log('✅ Socket connected successfully!', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error.message);
  console.log('🔄 Attempting to reconnect...');
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Socket disconnected:', reason);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
});

export const connectSocket = () => {
  if (!socket.connected) {
    console.log('🔄 Connecting socket...');
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    console.log('🔌 Disconnecting socket...');
    socket.disconnect();
  }
};