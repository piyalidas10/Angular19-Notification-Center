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

export interface NotificationEvent {
  type: 'new' | 'update' | 'delete' | 'read' | 'read-all';
  notification?: Notification;
  id?: string;
}
