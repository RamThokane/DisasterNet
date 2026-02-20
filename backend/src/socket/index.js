const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const Message = require('../models/Message');

/**
 * Initialize Socket.io with authentication and event handlers
 */
const initSocket = (io) => {
  // Socket.io authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.user._id})`);

    // Mark user as online
    await User.findByIdAndUpdate(socket.user._id, { isOnline: true });

    // Join a chat room
    socket.on('join-room', async (roomId) => {
      socket.join(roomId);
      console.log(`${socket.user.username} joined room: ${roomId}`);

      // Notify others in the room
      socket.to(roomId).emit('user-joined', {
        userId: socket.user._id,
        username: socket.user.username,
      });
    });

    // Leave a chat room
    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      console.log(`${socket.user.username} left room: ${roomId}`);

      socket.to(roomId).emit('user-left', {
        userId: socket.user._id,
        username: socket.user.username,
      });
    });

    // Send a message
    socket.on('send-message', async (data) => {
      try {
        const { roomId, message } = data;

        if (!message || message.trim() === '') return;

        const msg = await Message.create({
          message: message.trim(),
          senderNick: socket.user.username,
          senderId: socket.user._id,
          room: roomId,
        });

        const msgData = {
          _id: msg._id,
          message: msg.message,
          messageType: msg.messageType || 'text',
          file: msg.file || null,
          senderNick: msg.senderNick,
          senderId: msg.senderId,
          room: msg.room,
          createdAt: msg.createdAt,
        };

        // Broadcast to all in room including sender
        io.to(roomId).emit('new-message', msgData);
      } catch (error) {
        console.error('Error sending message via socket:', error.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (roomId) => {
      socket.to(roomId).emit('user-typing', {
        userId: socket.user._id,
        username: socket.user.username,
      });
    });

    socket.on('stop-typing', (roomId) => {
      socket.to(roomId).emit('user-stop-typing', {
        userId: socket.user._id,
      });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);
      await User.findByIdAndUpdate(socket.user._id, { isOnline: false });

      // Broadcast to all rooms user was in
      socket.rooms.forEach((roomId) => {
        socket.to(roomId).emit('user-left', {
          userId: socket.user._id,
          username: socket.user.username,
        });
      });
    });
  });
};

module.exports = initSocket;
