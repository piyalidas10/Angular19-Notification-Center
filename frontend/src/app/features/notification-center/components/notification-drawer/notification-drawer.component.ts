import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationService } from '../../../../core/services/notification.service';
import { NotificationSearchComponent } from '../notification-search/notification-search.component';
import { NotificationFilterComponent } from '../notification-filter/notification-filter.component';
import { NotificationListComponent } from '../notification-list/notification-list.component';

@Component({
  selector: 'app-notification-drawer',
  standalone: true,
  imports: [
    CommonModule,
    NotificationSearchComponent,
    NotificationFilterComponent,
    NotificationListComponent,
  ],
  templateUrl: './notification-drawer.component.html',
  styleUrls: ['./notification-drawer.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)' })),
      ]),
    ]),
    trigger('fade', [
      transition(':enter', [style({ opacity: 0 }), animate('300ms', style({ opacity: 1 }))]),
      transition(':leave', [animate('300ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class NotificationDrawerComponent {
  service = inject(NotificationService);

  onClose(): void {
    this.service.closeDrawer();
  }

  onMarkAllRead(): void {
    this.service.markAllAsRead();
  }

  onDeleteAll(): void {
    if (confirm('Are you sure you want to delete all notifications?')) {
      this.service.deleteAll();
    }
  }

  onDeleteSelected(): void {
    const count = this.service.selectedIds().size;
    if (count === 0) return;
    if (confirm(`Delete ${count} selected notification(s)?`)) {
      this.service.deleteSelected();
    }
  }

  onSelectAll(): void {
    this.service.selectAll();
  }

  onClearSelection(): void {
    this.service.clearSelection();
  }
}
