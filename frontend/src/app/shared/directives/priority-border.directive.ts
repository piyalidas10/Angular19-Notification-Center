import { Directive, ElementRef, Input, OnChanges, Renderer2 } from '@angular/core';
import { NotificationPriority } from '../models/notification.model';
import { PRIORITY_CONFIG } from '../enums/priority.enum';

@Directive({
  selector: '[appPriorityBorder]',
  standalone: true,
})
export class PriorityBorderDirective implements OnChanges {
  @Input('appPriorityBorder') priority: NotificationPriority = 'low';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(): void {
    const color = PRIORITY_CONFIG[this.priority]?.color ?? '#6b7280';
    this.renderer.setStyle(this.el.nativeElement, 'border-left', `4px solid ${color}`);
  }
}
