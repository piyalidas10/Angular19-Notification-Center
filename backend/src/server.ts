import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { notificationRouter } from './routes/notification.routes';
import { generateRandomNotification } from './data/mock-database';

const app = express();
const httpServer = createServer(app);

/**
 * Socket.IO server setup with CORS configuration.
 * The io object manages:
      - All connected clients
      - Sending messages
      - Receiving messages
      - Broadcasting events
      - Rooms
      - Namespaces

  * Socket.IO Server allows connections from the following origins:
       ✓ localhost:4200
       ✓ localhost:4000
       ✗ localhost:5000
       ✗ evil.com

  * These HTTP methods are permitted during the Socket.IO handshake and any HTTP fallback (such as long polling).
      - Allowed: GET, POST, PUT, DELETE
      - Socket.IO primarily uses(GET, POST) when using polling.
      - Once upgraded to WebSocket, HTTP methods are no longer involved.

  * credentials: true allows the browser to send credentials.
        Examples:
        ✓ Cookies
        ✓ Session ID
        ✓ Authorization headers (when applicable)
 */
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:4000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Express application stores the Socket.IO server instance.
// This allows route handlers to access the Socket.IO instance via req.app.get('io').
app.set('io', io);

// Middleware
// CORS configuration to allow requests from the frontend and other origins
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
/**
 * io is your Socket.IO server. Think of it as the manager of all client connections.
                    io
                    │
        ┌───────────┼────────────┐
        ▼           ▼            ▼
    socket1      socket2      socket3
  
  * Each socket represents a single client connection. You can listen for events from each socket and emit events to them.
  * When a client connects, the 'connection' event is fired, and you get a socket object for that client.
  * You can listen for custom events from the client using socket.on('eventName', callback). on() means "Listen for this event."
 */
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });

  // Client can request manual notification
  socket.on('notification:request', () => {
    const notification = generateRandomNotification();
    /**
     * io.emit('notification:new', notification) sends the notification to all connected clients.
     * If you wanted to send it only to the client that requested it, you would use socket.emit('notification:new', notification).
     * If you wanted to send it to all clients except the one that requested it, you would use socket.broadcast.emit('notification:new', notification).
     * socket.emit() Sends only to one client.
      
      | `io`                    | `socket`                               |
      | ----------------------- | -------------------------------------- |
      | Entire Socket.IO server | One connected client                   |
      | Knows all clients       | Knows only its own client              |
      | `io.emit()` → everyone  | `socket.emit()` → only this client     |
      | Used for broadcasting   | Used for communicating with one client |
      | Created once            | Created per connection                 |
     */
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
