import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification } from '../../../../shared/models/notification.model';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';
import { PriorityBorderDirective } from '../../../../shared/directives/priority-border.directive';
import { CATEGORY_CONFIG } from '../../../../shared/enums/notification-category.enum';
import { PRIORITY_CONFIG } from '../../../../shared/enums/priority.enum';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe, PriorityBorderDirective],
  templateUrl: './notification-item.component.html',
  styleUrls: ['./notification-item.component.scss'],
})
export class NotificationItemComponent {
  @Input({ required: true }) notification!: Notification;
  @Input() selected = false;
  @Output() markRead = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() toggleSelect = new EventEmitter<string>();

  getCategoryConfig() {
    return CATEGORY_CONFIG[this.notification.category];
  }

  getPriorityConfig() {
    return PRIORITY_CONFIG[this.notification.priority];
  }

  onMarkRead(): void {
    if (!this.notification.read) {
      this.markRead.emit(this.notification.id);
    }
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.notification.id);
  }

  onToggleSelect(event: Event): void {
    event.stopPropagation();
    this.toggleSelect.emit(this.notification.id);
  }
}
