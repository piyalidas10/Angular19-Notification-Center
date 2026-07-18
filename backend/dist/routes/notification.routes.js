"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouter = void 0;
const express_1 = __importDefault(require("express"));
const mock_database_1 = require("../data/mock-database");
exports.notificationRouter = express_1.default.Router();
// GET /notifications - List with pagination
exports.notificationRouter.get('/', (req, res) => {
    const page = parseInt(req.query['page']) || 1;
    const limit = parseInt(req.query['limit']) || 20;
    const result = (0, mock_database_1.getAllNotifications)(page, limit);
    res.json(result);
});
// GET /notifications/:id
exports.notificationRouter.get('/:id', (req, res) => {
    const notification = (0, mock_database_1.getNotificationById)(req.params['id']);
    if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
    }
    res.json(notification);
});
// POST /notifications
exports.notificationRouter.post('/', (req, res) => {
    const notification = (0, mock_database_1.createNotification)(req.body);
    // Emit via socket (attached to app)
    const io = req.app.get('io');
    if (io) {
        io.emit('notification:new', notification);
    }
    res.status(201).json(notification);
});
// PUT /notifications/read-all
exports.notificationRouter.put('/read-all', (req, res) => {
    (0, mock_database_1.markAllAsRead)();
    const io = req.app.get('io');
    if (io) {
        io.emit('notification:read-all');
    }
    res.json({ message: 'All notifications marked as read' });
});
// PUT /notifications/:id/read
exports.notificationRouter.put('/:id/read', (req, res) => {
    const notification = (0, mock_database_1.markAsRead)(req.params['id']);
    if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
    }
    const io = req.app.get('io');
    if (io) {
        io.emit('notification:read', notification);
    }
    res.json(notification);
});
// DELETE /notifications - Delete all
exports.notificationRouter.delete('/', (req, res) => {
    (0, mock_database_1.deleteAllNotifications)();
    const io = req.app.get('io');
    if (io) {
        io.emit('notification:delete', { all: true });
    }
    res.json({ message: 'All notifications deleted' });
});
// DELETE /notifications/:id
exports.notificationRouter.delete('/:id', (req, res) => {
    const deleted = (0, mock_database_1.deleteNotification)(req.params['id']);
    if (!deleted) {
        res.status(404).json({ error: 'Notification not found' });
        return;
    }
    const io = req.app.get('io');
    if (io) {
        io.emit('notification:delete', { id: req.params['id'] });
    }
    res.json({ message: 'Notification deleted' });
});
