import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      @for (notification of notifications(); track notification.id) {
        <div 
          class="p-4 rounded-lg shadow-lg flex items-start space-x-3"
          [ngClass]="getClasses(notification.type)"
          (click)="dismiss(notification.id)">
          <div class="flex-1 text-sm font-medium">{{ notification.message }}</div>
          <button class="flex-shrink-0 opacity-70 hover:opacity-100">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `
})
export class NotificationComponent {
  private notificationService = inject(NotificationService);
  notifications = this.notificationService.notifications;

  getClasses(type: Notification['type']): Record<string, boolean> {
    return {
      'bg-green-500 text-white': type === 'success',
      'bg-red-500 text-white': type === 'error',
      'bg-yellow-500 text-white': type === 'warning',
      'bg-blue-500 text-white': type === 'info'
    };
  }

  dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }
}

