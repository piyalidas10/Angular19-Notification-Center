import { Pipe, PipeTransform } from '@angular/core';
import { NotificationCategory } from '../models/notification.model';
import { CATEGORY_CONFIG } from '../enums/notification-category.enum';

@Pipe({
  name: 'categoryLabel',
  standalone: true,
})
export class CategoryLabelPipe implements PipeTransform {
  transform(category: NotificationCategory): string {
    return CATEGORY_CONFIG[category]?.label ?? category;
  }
}
