import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: [`:host { display: block; min-height: 100vh; background: #f7f8fa; }`],
})
export class AppComponent implements OnInit {
  private notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.notificationService.loadNotifications();
  }
}
