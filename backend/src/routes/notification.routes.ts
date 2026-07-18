import express, { Request, Response } from 'express';
import {
  getAllNotifications,
  getNotificationById,
  createNotification,
  markAsRead,
  deleteNotification,
  deleteAllNotifications,
  markAllAsRead,
} from '../data/mock-database';

export const notificationRouter = express.Router();

// GET /notifications - List with pagination
notificationRouter.get('/', (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 20;
  const result = getAllNotifications(page, limit);
  res.json(result);
});

// GET /notifications/:id
notificationRouter.get('/:id', (req: Request, res: Response) => {
  const notification = getNotificationById(req.params['id']);
  if (!notification) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  res.json(notification);
});

// POST /notifications
notificationRouter.post('/', (req: Request, res: Response) => {
  const notification = createNotification(req.body);
  // Emit via socket (attached to app)
  const io = req.app.get('io');
  if (io) {
    io.emit('notification:new', notification);
  }
  res.status(201).json(notification);
});

// PUT /notifications/read-all
notificationRouter.put('/read-all', (req: Request, res: Response) => {
  markAllAsRead();
  const io = req.app.get('io');
  if (io) {
    io.emit('notification:read-all');
  }
  res.json({ message: 'All notifications marked as read' });
});

// PUT /notifications/:id/read
notificationRouter.put('/:id/read', (req: Request, res: Response) => {
  const notification = markAsRead(req.params['id']);
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
notificationRouter.delete('/', (req: Request, res: Response) => {
  deleteAllNotifications();
  const io = req.app.get('io');
  if (io) {
    io.emit('notification:delete', { all: true });
  }
  res.json({ message: 'All notifications deleted' });
});

// DELETE /notifications/:id
notificationRouter.delete('/:id', (req: Request, res: Response) => {
  const deleted = deleteNotification(req.params['id']);
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
