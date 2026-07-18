import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, FilterType } from '../../../../core/services/notification.service';

interface FilterOption {
  value: FilterType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-notification-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-filter.component.html',
  styleUrls: ['./notification-filter.component.scss'],
})
export class NotificationFilterComponent {
  service = inject(NotificationService);

  filters: FilterOption[] = [
    { value: 'all', label: 'All', icon: '📋' },
    { value: 'unread', label: 'Unread', icon: '🔵' },
    { value: 'read', label: 'Read', icon: '✓' },
    { value: 'high', label: 'High Priority', icon: '⚠️' },
    { value: 'critical', label: 'Critical', icon: '🚨' },
    { value: 'today', label: 'Today', icon: '📅' },
    { value: 'week', label: 'This Week', icon: '📆' },
  ];

  onFilterChange(filter: FilterType): void {
    this.service.setFilter(filter);
  }
}
