import { Injectable, OnDestroy } from '@angular/core';
import { Observable, fromEvent, Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { Notification } from '../../shared/models/notification.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebsocketService implements OnDestroy {
  private socket: Socket;
  private destroy$ = new Subject<void>();
  readonly connected = false;

  constructor() {
    this.socket = io(environment.wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[WS] Connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('[WS] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err: Error) => {
      console.warn('[WS] Connection error:', err.message);
    });
  }

  private listen<T>(event: string): Observable<T> {
    return new Observable<T>((observer) => {
      this.socket.on(event, (data: T) => observer.next(data));
      return () => this.socket.off(event);
    }).pipe(takeUntil(this.destroy$));
  }

  onNotificationNew(): Observable<Notification> {
    return this.listen<Notification>('notification:new');
  }

  onNotificationUpdate(): Observable<Notification> {
    return this.listen<Notification>('notification:update');
  }

  onNotificationDelete(): Observable<{ id?: string; all?: boolean }> {
    return this.listen<{ id?: string; all?: boolean }>('notification:delete');
  }

  onNotificationRead(): Observable<Notification> {
    return this.listen<Notification>('notification:read');
  }

  onNotificationReadAll(): Observable<void> {
    return this.listen<void>('notification:read-all');
  }

  emit(event: string, data?: unknown): void {
    this.socket.emit(event, data);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socket.disconnect();
  }
}
