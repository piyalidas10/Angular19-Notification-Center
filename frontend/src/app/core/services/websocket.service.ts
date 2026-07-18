import { Injectable, OnDestroy } from '@angular/core';
import { Observable, fromEvent, Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { Notification } from '../../shared/models/notification.model';
import { environment } from '../../../environments/environment';

/**
 * This service is an Angular WebSocket service that uses Socket.IO to maintain a real-time connection with a backend server. 
 * Instead of opening and closing connections in every component, the application creates one shared connection and exposes it through RxJS Observables.
 */

@Injectable({ providedIn: 'root' }) // The @Injectable decorator marks this class as a service that can be injected into other components or services. The providedIn: 'root' option ensures that the service is a singleton and is available throughout the application.

export class WebsocketService implements OnDestroy {
  private socket: Socket;
  private destroy$ = new Subject<void>();
  readonly connected = false;

  constructor() {
    // The socket is initialized using the Socket.IO client library, connecting to the WebSocket server URL defined in the environment configuration.
    this.socket = io(environment.wsUrl, {
      // Socket.IO first tries WebSocket, If unavailable it falls back to HTTP long-polling. 
      // This ensures compatibility with older browsers and network configurations that may not support WebSocket.
      transports: ['websocket', 'polling'],
      // The 'reconnection' option is set to true, which means the socket will automatically attempt to connect when the service is instantiated.
      // Enable automatic reconnection with a maximum of 5 attempts and a delay of 1 second between attempts.
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

  // The listen method is a private utility function that creates an Observable for a specific WebSocket event. It listens for the event and emits the received data to subscribers. When the Observable is unsubscribed, it removes the event listener to prevent memory leaks and duplicate events.
  private listen<T>(event: string): Observable<T> {
    return new Observable<T>((observer) => {
      // Listen for the specified event and emit the received data to subscribers
      this.socket.on(event, (data: T) => observer.next(data));
      // Removes listener. Without this, multiple listeners would accumulate, causing duplicate events and memory leaks.
      return () => this.socket.off(event); // Clean up the event listener when the observable is unsubscribed
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
