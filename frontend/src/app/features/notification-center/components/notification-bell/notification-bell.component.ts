import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { NotificationService } from '../../../../core/services/notification.service';
import { bellRingAnimation, badgePulse } from '../../../../core/animations/notification.animations';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatBadgeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [bellRingAnimation, badgePulse],
  template: `
    <button
      mat-icon-button
      class="bell-btn"
      (click)="onBellClick()"
      aria-label="Notifications"
    >
      <span
        class="bell-icon"
        [@bellRing]="ringState()"
        (@bellRing.done)="onRingDone()"
      >🔔</span>
      @if (notificationService.unreadCount() > 0) {
        <span
          class="badge"
          [@badgePulse]="pulseState()"
          (@badgePulse.done)="onPulseDone()"
        >
          {{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}
        </span>
      }
    </button>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      position: relative;
    }
    .bell-btn {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: background 0.2s;
      &:hover { background: rgba(0,0,0,0.06); }
    }
    .bell-icon {
      font-size: 22px;
      display: inline-block;
      user-select: none;
    }
    .badge {
      position: absolute;
      top: 2px;
      right: 2px;
      min-width: 18px;
      height: 18px;
      background: #ef4444;
      color: #fff;
      border-radius: 9px;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      border: 2px solid #fff;
      pointer-events: none;
    }
  `],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  protected notificationService = inject(NotificationService);
  protected ringState = signal<'idle' | 'ring'>('idle');
  protected pulseState = signal<'idle' | 'pulse'>('idle');
  private prevCount = 0;
  private intervalId: number | null = null;

  ngOnInit(): void {
    this.prevCount = this.notificationService.unreadCount();
    // Watch for new unread notifications
    this.intervalId = window.setInterval(() => {
      const count = this.notificationService.unreadCount();
      if (count > this.prevCount) {
        this.ringState.set('ring');
        this.pulseState.set('pulse');
      }
      this.prevCount = count;
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) window.clearInterval(this.intervalId);
  }

  onBellClick(): void {
    this.notificationService.toggleDrawer();
  }

  onRingDone(): void {
    this.ringState.set('idle');
  }

  onPulseDone(): void {
    this.pulseState.set('idle');
  }
}
