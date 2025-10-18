import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = (token) => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const subscribeToNotifications = (callback) => {
  if (socket) {
    socket.on('notification', callback);
  }
};

export const unsubscribeFromNotifications = () => {
  if (socket) {
    socket.off('notification');
  }
};