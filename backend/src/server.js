const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const connectDB = require('./config/db');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const initSocket = require('./socket');

// Route imports
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const roomRoutes = require('./routes/rooms');

// Legacy route handlers (matching original Go API)
const {
  getMessagesLegacy,
  postMessageLegacy,
} = require('./controllers/messageController');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: config.clientUrl === '*' ? true : config.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to controllers
app.set('io', io);

// Connect to MongoDB
connectDB();

// ─── Security & Parsing Middleware ───────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: config.clientUrl === '*' ? true : config.clientUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// ─── Static Files (uploaded files) ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Legacy Routes (matching original Go API) ───────────────────────────────
// These preserve the exact same API behavior as the Go backend
app.get('/messages', getMessagesLegacy);
app.post('/send', postMessageLegacy);

// ─── New MERN API Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── Error Handler ──────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Initialize Socket.io ───────────────────────────────────────────────────
initSocket(io);

// ─── Start Server ───────────────────────────────────────────────────────────
server.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║  DisasterNet Backend Server                      ║
  ║  Mode:  ${config.nodeEnv.padEnd(40)}║
  ║  Port:  ${String(config.port).padEnd(40)}║
  ║  Mongo: ${config.mongoUri.substring(0, 40).padEnd(40)}║
  ╚══════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server };
