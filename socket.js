import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  // Store online users
  const onlineUsers = new Map();

  io.use((socket, next) => {
    if (socket.handshake.auth.token) {
      jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Authentication error'));
        socket.userId = decoded.id;
        next();
      });
    } else {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);
    
    // Add user to online users
    onlineUsers.set(socket.userId, socket.id);
    io.emit('userOnline', socket.userId);

    // Join chat room
    socket.on('join chat', (chatId) => {
      socket.join(chatId);
      console.log('User joined chat:', chatId);
    });

    // Leave chat room
    socket.on('leave chat', (chatId) => {
      socket.leave(chatId);
      console.log('User left chat:', chatId);
    });

    // Handle new messages
    socket.on('sendMessage', (data) => {
      io.to(data.chatId).emit('newMessage', data);
    });

    // Handle typing status
    socket.on('typing', (data) => {
      socket.to(data.chatId).emit('userTyping', data);
    });

    // Handle connection requests
    socket.on('sendConnectionRequest', (data) => {
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('connectionRequest', data.requestData);
      }
    });

    // Handle connection request acceptance
    socket.on('connectionRequestAccepted', (data) => {
      const senderSocketId = onlineUsers.get(data.chatData.members[0]);
      if (senderSocketId) {
        io.to(senderSocketId).emit('connectionAccepted', data.chatData);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
      onlineUsers.delete(socket.userId);
      io.emit('userOffline', socket.userId);
    });
  });

  return io;
};

export default setupSocket; 