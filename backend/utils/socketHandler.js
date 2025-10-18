import jwt from 'jsonwebtoken';

const userSockets = new Map(); // Map userId to socketId

export const initializeSocketHandlers = (io) => {
  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Store user socket mapping
    userSockets.set(socket.userId, socket.id);
    
    // Join user to their personal room
    socket.join(socket.userId);

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      userSockets.delete(socket.userId);
    });

    // Handle typing indicator for messages
    socket.on('typing', (data) => {
      socket.to(data.roomId).emit('user_typing', {
        userId: socket.userId,
        isTyping: data.isTyping
      });
    });

    // Mark notification as read in real-time
    socket.on('notification_read', (notificationId) => {
      socket.emit('notification_read_confirmed', notificationId);
    });
  });

  return io;
};

// Helper function to emit to specific user
export const emitToUser = (io, userId, event, data) => {
  io.to(userId.toString()).emit(event, data);
};

// Helper function to emit to multiple users
export const emitToUsers = (io, userIds, event, data) => {
  userIds.forEach(userId => {
    io.to(userId.toString()).emit(event, data);
  });
};