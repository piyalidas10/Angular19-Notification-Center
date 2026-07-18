import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationBellComponent } from '../notification-center/components/notification-bell/notification-bell.component';
import { NotificationDrawerComponent } from '../notification-center/components/notification-drawer/notification-drawer.component';
import { ToastComponent } from '../notification-center/components/toast/toast.component';
import { CATEGORY_CONFIG } from '../../shared/enums/notification-category.enum';
import { PRIORITY_CONFIG } from '../../shared/enums/priority.enum';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NotificationBellComponent,
    NotificationDrawerComponent,
    ToastComponent,
    TimeAgoPipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  service = inject(NotificationService);
  categoryConfig = CATEGORY_CONFIG;
  priorityConfig = PRIORITY_CONFIG;

  readonly categoryStats = computed(() => {
    const stats = this.service.stats();
    return Object.entries(stats.byCategory).map(([key, count]) => ({
      key,
      count,
      config: CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG],
    }));
  });

  readonly recentActivity = computed(() => {
    return this.service.notifications().slice(0, 5);
  });

  openDrawer(): void {
    this.service.openDrawer();
  }

  getCategoryColor(category: string): string {
    return CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.color ?? '#999';
  }

  getPriorityColor(priority: string): string {
    return PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG]?.color ?? '#999';
  }
}
