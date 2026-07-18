import { NotificationPriority } from '../models/notification.model';

export const PRIORITY_CONFIG: Record<
  NotificationPriority,
  { label: string; color: string; badgeClass: string; order: number }
> = {
  low: {
    label: 'Low',
    color: '#6b7280',
    badgeClass: 'priority-low',
    order: 1,
  },
  medium: {
    label: 'Medium',
    color: '#f59e0b',
    badgeClass: 'priority-medium',
    order: 2,
  },
  high: {
    label: 'High',
    color: '#f97316',
    badgeClass: 'priority-high',
    order: 3,
  },
  critical: {
    label: 'Critical',
    color: '#ef4444',
    badgeClass: 'priority-critical',
    order: 4,
  },
};
