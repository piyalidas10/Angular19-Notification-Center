import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '../../shared/models/notification.model';

let toastIdCounter = 0;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(options: { message: string; type: ToastType; title?: string; duration?: number }): void {
    const id = `toast-${++toastIdCounter}`;
    const toast: Toast = {
      id,
      message: options.message,
      type: options.type,
      title: options.title,
      duration: options.duration ?? 4000,
    };

    this.toasts.update((list) => [...list, toast]);

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => this.dismiss(id), toast.duration);
    }
  }

  dismiss(id: string): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
