import express from 'express';
import connectDB from './config/db.js'; 
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import postRouter from './routes/posts.js';
import cors from 'cors';
import profileRouter from './routes/profile.js';
import chatRouter from './routes/chat.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';
import setupSocket from './socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = createServer(app);

// Configure CORS
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Initialize socket
const io = setupSocket(server);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);
app.use('/api/profile', profileRouter);
app.use('/api/chats', chatRouter);

const PORT = process.env.PORT || 8000;

// Connect to MongoDB
connectDB();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
