import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { notificationRouter } from './routes/notification.routes';
import { generateRandomNotification } from './data/mock-database';

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:4000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Store io on app for use in routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:4000'],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/notifications', notificationRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });

  // Client can request manual notification
  socket.on('notification:request', () => {
    const notification = generateRandomNotification();
    io.emit('notification:new', notification);
  });
});

// Automatic random notification generator (every 8-15 seconds)
function scheduleRandomNotification(): void {
  const delay = Math.floor(Math.random() * 7000) + 8000; // 8-15 seconds
  setTimeout(() => {
    const notification = generateRandomNotification();
    console.log(`[WS] Broadcasting notification: ${notification.title}`);
    io.emit('notification:new', notification);
    scheduleRandomNotification();
  }, delay);
}

scheduleRandomNotification();

const PORT = process.env['PORT'] || 3000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Notification Center Backend running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`📋 API Endpoints:`);
  console.log(`   GET    /notifications`);
  console.log(`   GET    /notifications/:id`);
  console.log(`   POST   /notifications`);
  console.log(`   PUT    /notifications/:id/read`);
  console.log(`   PUT    /notifications/read-all`);
  console.log(`   DELETE /notifications/:id`);
  console.log(`   DELETE /notifications\n`);
});
