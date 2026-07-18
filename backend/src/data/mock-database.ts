import { Notification, NotificationCategory, NotificationPriority } from '../models/notification.model';
import { v4 as uuidv4 } from 'uuid';

const categoryIcons: Record<NotificationCategory, string> = {
  order: '🛒',
  payment: '💳',
  system: '⚙️',
  chat: '💬',
  security: '🔒',
  user: '👤',
  inventory: '📦',
  marketing: '📢',
};

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const senders = [
  'System',
  'Order Service',
  'Payment Gateway',
  'Chat Bot',
  'Security Monitor',
  'Inventory System',
  'Marketing Platform',
  'User Service',
];

const templates: Array<{
  title: string;
  description: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  sender: string;
}> = [
  {
    title: 'New Order Received',
    description: `Order #${Math.floor(Math.random() * 90000 + 10000)} has been placed and awaiting processing`,
    category: 'order',
    priority: 'medium',
    sender: 'Order Service',
  },
  {
    title: 'Payment Successful',
    description: `Payment of $${(Math.random() * 500 + 50).toFixed(2)} processed successfully`,
    category: 'payment',
    priority: 'high',
    sender: 'Payment Gateway',
  },
  {
    title: 'System Maintenance',
    description: 'Scheduled maintenance window starts in 30 minutes. Please save your work.',
    category: 'system',
    priority: 'high',
    sender: 'System',
  },
  {
    title: 'New Message',
    description: 'You have a new message from customer support team',
    category: 'chat',
    priority: 'low',
    sender: 'Chat Bot',
  },
  {
    title: 'Security Alert',
    description: 'Unusual login attempt detected from IP 192.168.1.100. Please verify.',
    category: 'security',
    priority: 'critical',
    sender: 'Security Monitor',
  },
  {
    title: 'New User Registration',
    description: 'A new user has registered and requires approval',
    category: 'user',
    priority: 'low',
    sender: 'User Service',
  },
  {
    title: 'Low Stock Alert',
    description: 'Product SKU-789 is running low. Only 5 units remaining in warehouse.',
    category: 'inventory',
    priority: 'high',
    sender: 'Inventory System',
  },
  {
    title: 'Campaign Performance',
    description: 'Summer sale campaign has reached 10,000 impressions!',
    category: 'marketing',
    priority: 'medium',
    sender: 'Marketing Platform',
  },
  {
    title: 'Order Shipped',
    description: `Order #${Math.floor(Math.random() * 90000 + 10000)} has been shipped via FedEx`,
    category: 'order',
    priority: 'medium',
    sender: 'Order Service',
  },
  {
    title: 'Payment Failed',
    description: 'Transaction declined due to insufficient funds. Please update payment method.',
    category: 'payment',
    priority: 'critical',
    sender: 'Payment Gateway',
  },
  {
    title: 'Database Backup Complete',
    description: 'Daily database backup completed successfully. 2.3 GB archived.',
    category: 'system',
    priority: 'low',
    sender: 'System',
  },
  {
    title: 'User Account Locked',
    description: 'User account john.doe@example.com has been locked after 5 failed attempts.',
    category: 'security',
    priority: 'high',
    sender: 'Security Monitor',
  },
];

let mockDatabase: Notification[] = [];

// Seed initial notifications
function seedDatabase(): void {
  const now = Date.now();
  for (let i = 0; i < 25; i++) {
    const template = randomItem(templates);
    const notification: Notification = {
      id: uuidv4(),
      title: template.title,
      description: template.description,
      category: template.category,
      priority: template.priority,
      timestamp: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      read: Math.random() > 0.4,
      sender: template.sender,
      icon: categoryIcons[template.category],
    };
    mockDatabase.push(notification);
  }
  // Sort by timestamp descending
  mockDatabase.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

seedDatabase();

export function getAllNotifications(page = 1, limit = 20): { notifications: Notification[]; total: number; page: number; totalPages: number } {
  const total = mockDatabase.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const notifications = mockDatabase.slice(start, start + limit);
  return { notifications, total, page, totalPages };
}

export function getNotificationById(id: string): Notification | undefined {
  return mockDatabase.find((n) => n.id === id);
}

export function createNotification(data: Partial<Notification>): Notification {
  const category: NotificationCategory = (data.category as NotificationCategory) || 'system';
  const notification: Notification = {
    id: uuidv4(),
    title: data.title || 'Notification',
    description: data.description || '',
    category,
    priority: (data.priority as NotificationPriority) || 'medium',
    timestamp: new Date().toISOString(),
    read: false,
    sender: data.sender || 'System',
    icon: categoryIcons[category],
    metadata: data.metadata,
  };
  mockDatabase.unshift(notification);
  return notification;
}

export function markAsRead(id: string): Notification | undefined {
  const notification = mockDatabase.find((n) => n.id === id);
  if (notification) {
    notification.read = true;
  }
  return notification;
}

export function markAllAsRead(): void {
  mockDatabase.forEach((n) => (n.read = true));
}

export function deleteNotification(id: string): boolean {
  const index = mockDatabase.findIndex((n) => n.id === id);
  if (index !== -1) {
    mockDatabase.splice(index, 1);
    return true;
  }
  return false;
}

export function deleteAllNotifications(): void {
  mockDatabase = [];
}

export function generateRandomNotification(): Notification {
  const template = randomItem(templates);
  const category: NotificationCategory = template.category;
  return createNotification({
    title: template.title,
    description: template.description,
    category,
    priority: template.priority,
    sender: template.sender,
  });
}
