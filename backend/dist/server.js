"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const notification_routes_1 = require("./routes/notification.routes");
const mock_database_1 = require("./data/mock-database");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: ['http://localhost:4200', 'http://localhost:4000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    },
});
// Store io on app for use in routes
app.set('io', io);
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:4200', 'http://localhost:4000'],
    credentials: true,
}));
app.use(express_1.default.json());
// Routes
app.use('/notifications', notification_routes_1.notificationRouter);
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
        const notification = (0, mock_database_1.generateRandomNotification)();
        io.emit('notification:new', notification);
    });
});
// Automatic random notification generator (every 8-15 seconds)
function scheduleRandomNotification() {
    const delay = Math.floor(Math.random() * 7000) + 8000; // 8-15 seconds
    setTimeout(() => {
        const notification = (0, mock_database_1.generateRandomNotification)();
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
