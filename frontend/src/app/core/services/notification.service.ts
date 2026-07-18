import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Notification, NotificationResponse } from '../../shared/models/notification.model';
import { WebsocketService } from './websocket.service';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';

export type FilterType = 'all' | 'read' | 'unread' | 'high' | 'critical' | 'today' | 'week';
export type SortType = 'latest' | 'oldest' | 'priority' | 'category';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private ws = inject(WebsocketService);
  private toast = inject(ToastService);
  private apiUrl = `${environment.apiUrl}/notifications`;

  // === Signals ===
  readonly notifications = signal<Notification[]>([]);
  readonly isLoading = signal(false);
  readonly isDrawerOpen = signal(false);
  readonly activeFilter = signal<FilterType>('all');
  readonly activeSort = signal<SortType>('latest');
  readonly searchQuery = signal('');
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly totalCount = signal(0);

  // === Computed Signals ===
  readonly unreadCount = computed(() =>
    this.notifications().filter((n) => !n.read).length
  );

  readonly criticalCount = computed(() =>
    this.notifications().filter((n) => n.priority === 'critical' && !n.read).length
  );

  readonly filteredNotifications = computed(() => {
    let list = [...this.notifications()];
    const filter = this.activeFilter();
    const query = this.searchQuery().toLowerCase().trim();

    // Filter
    switch (filter) {
      case 'read':
        list = list.filter((n) => n.read);
        break;
      case 'unread':
        list = list.filter((n) => !n.read);
        break;
      case 'high':
        list = list.filter((n) => n.priority === 'high' || n.priority === 'critical');
        break;
      case 'critical':
        list = list.filter((n) => n.priority === 'critical');
        break;
      case 'today': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        list = list.filter((n) => new Date(n.timestamp) >= today);
        break;
      }
      case 'week': {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        list = list.filter((n) => new Date(n.timestamp) >= weekAgo);
        break;
      }
    }

    // Search
    if (query) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.category.toLowerCase().includes(query) ||
          n.sender.toLowerCase().includes(query) ||
          n.description.toLowerCase().includes(query)
      );
    }

    // Sort
    const sort = this.activeSort();
    switch (sort) {
      case 'latest':
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
      case 'oldest':
        list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        break;
      case 'priority': {
        const order = { critical: 4, high: 3, medium: 2, low: 1 };
        list.sort((a, b) => order[b.priority] - order[a.priority]);
        break;
      }
      case 'category':
        list.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }

    return list;
  });

  readonly stats = computed(() => {
    const all = this.notifications();
    return {
      total: all.length,
      unread: all.filter((n) => !n.read).length,
      critical: all.filter((n) => n.priority === 'critical').length,
      high: all.filter((n) => n.priority === 'high').length,
      byCategory: {
        order: all.filter((n) => n.category === 'order').length,
        payment: all.filter((n) => n.category === 'payment').length,
        system: all.filter((n) => n.category === 'system').length,
        chat: all.filter((n) => n.category === 'chat').length,
        security: all.filter((n) => n.category === 'security').length,
        user: all.filter((n) => n.category === 'user').length,
        inventory: all.filter((n) => n.category === 'inventory').length,
        marketing: all.filter((n) => n.category === 'marketing').length,
      },
    };
  });

  private searchSubject = new BehaviorSubject<string>('');

  constructor() {
    // Effect: show toast & sound for critical notifications
    effect(() => {
      // Intentional: runs whenever notifications change (captured via filteredNotifications)
      void this.criticalCount();
    });

    // Subscribe to WebSocket events
    this.ws.onNotificationNew().subscribe((notification) => {
      this.notifications.update((list) => [notification, ...list]);
      this.totalCount.update((c) => c + 1);

      // Show toast
      const type = notification.priority === 'critical' ? 'error'
        : notification.priority === 'high' ? 'warning'
        : 'info';
      this.toast.show({ title: notification.title, message: notification.description, type });
    });

    this.ws.onNotificationRead().subscribe((notification) => {
      this.notifications.update((list) =>
        list.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    });

    this.ws.onNotificationReadAll().subscribe(() => {
      this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
    });

    this.ws.onNotificationDelete().subscribe((payload) => {
      if (payload.all) {
        this.notifications.set([]);
      } else if (payload.id) {
        this.notifications.update((list) => list.filter((n) => n.id !== payload.id));
      }
    });

    // Debounced search via RxJS
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => this.searchQuery.set(query));
  }

  loadNotifications(page = 1): void {
    this.isLoading.set(true);
    let params = new HttpParams().set('page', page).set('limit', 20);
    this.http.get<NotificationResponse>(this.apiUrl, { params }).subscribe({
      next: (res) => {
        if (page === 1) {
          this.notifications.set(res.notifications);
        } else {
          this.notifications.update((list) => [...list, ...res.notifications]);
        }
        this.currentPage.set(res.page);
        this.totalPages.set(res.totalPages);
        this.totalCount.set(res.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.show({ message: 'Failed to load notifications', type: 'error' });
      },
    });
  }

  loadMore(): void {
    if (this.currentPage() < this.totalPages()) {
      this.loadNotifications(this.currentPage() + 1);
    }
  }

  markAsRead(id: string): void {
    this.http.put<Notification>(`${this.apiUrl}/${id}/read`, {}).subscribe({
      next: (notification) => {
        this.notifications.update((list) =>
          list.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      },
      error: () => this.toast.show({ message: 'Failed to mark as read', type: 'error' }),
    });
  }

  markAllAsRead(): void {
    this.http.put(`${this.apiUrl}/read-all`, {}).subscribe({
      next: () => {
        this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
        this.toast.show({ message: 'All notifications marked as read', type: 'success' });
      },
      error: () => this.toast.show({ message: 'Failed to mark all as read', type: 'error' }),
    });
  }

  deleteNotification(id: string): void {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.notifications.update((list) => list.filter((n) => n.id !== id));
        this.selectedIds.update((ids) => {
          const next = new Set(ids);
          next.delete(id);
          return next;
        });
        this.toast.show({ message: 'Notification deleted', type: 'success' });
      },
      error: () => this.toast.show({ message: 'Failed to delete notification', type: 'error' }),
    });
  }

  deleteAll(): void {
    this.http.delete(this.apiUrl).subscribe({
      next: () => {
        this.notifications.set([]);
        this.selectedIds.set(new Set());
        this.toast.show({ message: 'All notifications deleted', type: 'success' });
      },
      error: () => this.toast.show({ message: 'Failed to delete notifications', type: 'error' }),
    });
  }

  deleteSelected(): void {
    const ids = [...this.selectedIds()];
    ids.forEach((id) => this.deleteNotification(id));
  }

  setFilter(filter: FilterType): void {
    this.activeFilter.set(filter);
  }

  setSort(sort: SortType): void {
    this.activeSort.set(sort);
  }

  setSearch(query: string): void {
    this.searchSubject.next(query);
  }

  toggleDrawer(): void {
    this.isDrawerOpen.update((v) => !v);
  }

  openDrawer(): void {
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  toggleSelected(id: string): void {
    this.selectedIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  selectAll(): void {
    this.selectedIds.set(new Set(this.filteredNotifications().map((n) => n.id)));
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }
}
