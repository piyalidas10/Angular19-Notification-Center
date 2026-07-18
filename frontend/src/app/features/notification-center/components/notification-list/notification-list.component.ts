import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../core/services/notification.service';
import { NotificationItemComponent } from '../notification-item/notification-item.component';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, NotificationItemComponent],
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss'],
})
export class NotificationListComponent {
  service = inject(NotificationService);

  onMarkRead(id: string): void {
    this.service.markAsRead(id);
  }

  onDelete(id: string): void {
    this.service.deleteNotification(id);
  }

  onToggleSelect(id: string): void {
    this.service.toggleSelected(id);
  }

  isSelected(id: string): boolean {
    return this.service.selectedIds().has(id);
  }

  onLoadMore(): void {
    this.service.loadMore();
  }
}
