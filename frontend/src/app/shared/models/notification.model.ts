export type NotificationCategory =
  | 'order'
  | 'payment'
  | 'system'
  | 'chat'
  | 'security'
  | 'user'
  | 'inventory'
  | 'marketing';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: string;
  title: string;
  description: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  timestamp: string;
  read: boolean;
  sender: string;
  icon: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  page: number;
  totalPages: number;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration?: number;
}
