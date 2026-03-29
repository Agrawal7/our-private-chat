import { io } from "socket.io-client";

// Use environment variable for production URL
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});