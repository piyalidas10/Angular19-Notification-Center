import { NotificationCategory } from '../models/notification.model';

export const CATEGORY_CONFIG: Record<
  NotificationCategory,
  { icon: string; color: string; label: string; badgeClass: string }
> = {
  order: {
    icon: '🛒',
    color: '#3b82f6',
    label: 'Order',
    badgeClass: 'badge-order',
  },
  payment: {
    icon: '💳',
    color: '#10b981',
    label: 'Payment',
    badgeClass: 'badge-payment',
  },
  system: {
    icon: '⚙️',
    color: '#6b7280',
    label: 'System',
    badgeClass: 'badge-system',
  },
  chat: {
    icon: '💬',
    color: '#8b5cf6',
    label: 'Chat',
    badgeClass: 'badge-chat',
  },
  security: {
    icon: '🔒',
    color: '#ef4444',
    label: 'Security',
    badgeClass: 'badge-security',
  },
  user: {
    icon: '👤',
    color: '#f59e0b',
    label: 'User',
    badgeClass: 'badge-user',
  },
  inventory: {
    icon: '📦',
    color: '#06b6d4',
    label: 'Inventory',
    badgeClass: 'badge-inventory',
  },
  marketing: {
    icon: '📢',
    color: '#ec4899',
    label: 'Marketing',
    badgeClass: 'badge-marketing',
  },
};
