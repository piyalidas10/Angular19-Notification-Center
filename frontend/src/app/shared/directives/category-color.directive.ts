import { Directive, ElementRef, Input, OnChanges } from '@angular/core';
import { NotificationCategory } from '../models/notification.model';
import { CATEGORY_CONFIG } from '../enums/notification-category.enum';

@Directive({
  selector: '[appCategoryColor]',
  standalone: true,
})
export class CategoryColorDirective implements OnChanges {
  @Input('appCategoryColor') category: NotificationCategory = 'system';

  constructor(private el: ElementRef) {}

  ngOnChanges(): void {
    const color = CATEGORY_CONFIG[this.category]?.color ?? '#999';
    this.el.nativeElement.style.setProperty('--category-color', color);
  }
}
