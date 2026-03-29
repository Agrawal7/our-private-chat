import { useState, useEffect, useCallback } from 'react';
import { socket, connectSocket } from '../utils/socket';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    connectSocket();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const emit = useCallback((event, data, callback) => {
    socket.emit(event, data, callback);
  }, []);

  const on = useCallback((event, handler) => {
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

  return { socket, isConnected, emit, on };
};