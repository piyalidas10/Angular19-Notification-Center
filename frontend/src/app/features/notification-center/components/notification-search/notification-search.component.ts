import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService, SortType } from '../../../../core/services/notification.service';

interface SortOption {
  value: SortType;
  label: string;
}

@Component({
  selector: 'app-notification-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-search.component.html',
  styleUrls: ['./notification-search.component.scss'],
})
export class NotificationSearchComponent {
  service = inject(NotificationService);
  searchQuery = '';

  sortOptions: SortOption[] = [
    { value: 'latest', label: 'Latest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'priority', label: 'Priority' },
    { value: 'category', label: 'Category' },
  ];

  onSearchChange(): void {
    this.service.setSearch(this.searchQuery);
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as SortType;
    this.service.setSort(value);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearchChange();
  }
}
