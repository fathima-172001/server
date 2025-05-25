import express from 'express';
import connectDB from './config/db.js'; 
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import postRouter from './routes/posts.js';
import cors from 'cors';
import profileRouter from './routes/profile.js';
import chatRouter from './src/routes/chat.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import createSocketManager from './src/socket/socketManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = createServer(app);

// Configure CORS for Express
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Configure Socket.IO with detailed settings
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);
app.use('/api/profile', profileRouter);
app.use('/api', chatRouter);

// Initialize Socket.IO with the new manager
createSocketManager(io);

const PORT = process.env.PORT || 8000;

// Add error handling for the server
server.on('error', (error) => {
  console.error('Server error:', error);
});

io.on('connect_error', (error) => {
  console.error('Socket.IO connection error:', error);
});

io.engine.on('connection_error', (error) => {
  console.error('Socket.IO engine error:', error);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server is ready`);
});
