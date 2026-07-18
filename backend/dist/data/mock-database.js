"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllNotifications = getAllNotifications;
exports.getNotificationById = getNotificationById;
exports.createNotification = createNotification;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.deleteNotification = deleteNotification;
exports.deleteAllNotifications = deleteAllNotifications;
exports.generateRandomNotification = generateRandomNotification;
const uuid_1 = require("uuid");
const categoryIcons = {
    order: '🛒',
    payment: '💳',
    system: '⚙️',
    chat: '💬',
    security: '🔒',
    user: '👤',
    inventory: '📦',
    marketing: '📢',
};
function randomItem(arr) {
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
const templates = [
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
let mockDatabase = [];
// Seed initial notifications
function seedDatabase() {
    const now = Date.now();
    for (let i = 0; i < 25; i++) {
        const template = randomItem(templates);
        const notification = {
            id: (0, uuid_1.v4)(),
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
function getAllNotifications(page = 1, limit = 20) {
    const total = mockDatabase.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const notifications = mockDatabase.slice(start, start + limit);
    return { notifications, total, page, totalPages };
}
function getNotificationById(id) {
    return mockDatabase.find((n) => n.id === id);
}
function createNotification(data) {
    const category = data.category || 'system';
    const notification = {
        id: (0, uuid_1.v4)(),
        title: data.title || 'Notification',
        description: data.description || '',
        category,
        priority: data.priority || 'medium',
        timestamp: new Date().toISOString(),
        read: false,
        sender: data.sender || 'System',
        icon: categoryIcons[category],
        metadata: data.metadata,
    };
    mockDatabase.unshift(notification);
    return notification;
}
function markAsRead(id) {
    const notification = mockDatabase.find((n) => n.id === id);
    if (notification) {
        notification.read = true;
    }
    return notification;
}
function markAllAsRead() {
    mockDatabase.forEach((n) => (n.read = true));
}
function deleteNotification(id) {
    const index = mockDatabase.findIndex((n) => n.id === id);
    if (index !== -1) {
        mockDatabase.splice(index, 1);
        return true;
    }
    return false;
}
function deleteAllNotifications() {
    mockDatabase = [];
}
function generateRandomNotification() {
    const template = randomItem(templates);
    const category = template.category;
    return createNotification({
        title: template.title,
        description: template.description,
        category,
        priority: template.priority,
        sender: template.sender,
    });
}
