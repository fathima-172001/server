import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

class SocketManager {
  constructor(io) {
    this.io = io;
    this.onlineUsers = new Map();
    this.initialize();
  }

  initialize() {
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.userId);
      
      // Add user to online users
      this.onlineUsers.set(socket.userId, socket.id);
      this.broadcastUserStatus(socket.userId, true);

      // Handle user joining a chat
      socket.on('join chat', (chatId) => {
        socket.join(chatId);
        console.log('User joined chat:', chatId);
      });

      // Handle new message
      socket.on('new message', (data) => {
        const chat = this.io.to(data.chatId);
        if (!chat) return;

        // Emit message to all users in the chat except sender
        socket.to(data.chatId).emit('message received', {
          senderId: socket.userId,
          message: data.message,
          chatId: data.chatId,
          createdAt: new Date()
        });
      });

      // Handle typing status
      socket.on('typing', (data) => {
        const receiverSocket = this.onlineUsers.get(data.receiverId);
        if (receiverSocket) {
          socket.to(receiverSocket).emit('typing', {
            senderId: socket.userId,
            chatId: data.chatId
          });
        }
      });

      socket.on('stop typing', (data) => {
        const receiverSocket = this.onlineUsers.get(data.receiverId);
        if (receiverSocket) {
          socket.to(receiverSocket).emit('stop typing', {
            senderId: socket.userId,
            chatId: data.chatId
          });
        }
      });

      // Handle video/voice call signals
      socket.on('call user', (data) => {
        const receiverSocket = this.onlineUsers.get(data.receiverId);
        if (receiverSocket) {
          socket.to(receiverSocket).emit('incoming call', {
            senderId: socket.userId,
            type: data.type // 'video' or 'voice'
          });
        }
      });

      socket.on('answer call', (data) => {
        const receiverSocket = this.onlineUsers.get(data.receiverId);
        if (receiverSocket) {
          socket.to(receiverSocket).emit('call answered', {
            senderId: socket.userId,
            signal: data.signal
          });
        }
      });

      socket.on('end call', (data) => {
        const receiverSocket = this.onlineUsers.get(data.receiverId);
        if (receiverSocket) {
          socket.to(receiverSocket).emit('call ended', {
            senderId: socket.userId
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userId);
        this.onlineUsers.delete(socket.userId);
        this.broadcastUserStatus(socket.userId, false);
      });
    });
  }

  broadcastUserStatus(userId, isOnline) {
    this.io.emit('user status', {
      userId: userId,
      isOnline: isOnline
    });
  }

  getOnlineUsers() {
    return Array.from(this.onlineUsers.keys());
  }
}

export default function createSocketManager(io) {
  return new SocketManager(io);
} 