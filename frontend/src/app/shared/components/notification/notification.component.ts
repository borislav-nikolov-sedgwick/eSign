import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    @keyframes notificationBounce {
      0% {
        transform: translateY(-100px) scale(0.8);
        opacity: 0;
      }
      60% {
        transform: translateY(10px) scale(1.05);
        opacity: 1;
      }
      80% {
        transform: translateY(-5px) scale(0.98);
      }
      100% {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }

    .notification-enter {
      animation: notificationBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    .success-glow {
      animation: successGlow 2s ease-in-out infinite;
    }

    @keyframes successGlow {
      0%, 100% {
        box-shadow: 0 10px 40px rgba(16, 185, 129, 0.6),
                    0 0 80px rgba(16, 185, 129, 0.4);
      }
      50% {
        box-shadow: 0 15px 60px rgba(16, 185, 129, 0.8),
                    0 0 120px rgba(16, 185, 129, 0.6);
      }
    }
  `],
  template: `
    <div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] space-y-2 pointer-events-none">
      @for (notification of notifications(); track notification.id) {
        <div
          [class]="'px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 border-2 pointer-events-auto transition-all duration-300 hover:scale-105 cursor-pointer notification-enter text-white ' + getClasses(notification.type) + (notification.type === 'success' ? ' success-glow' : '')"
          (click)="dismiss(notification.id)">
          <div class="flex-shrink-0 relative text-white">
            @switch (notification.type) {
              @case ('success') {
                <div class="relative">
                  <svg class="w-6 h-6 text-white animate-celebrate" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div class="absolute -inset-1 rounded-full bg-white opacity-20 animate-ping"></div>
                </div>
              }
              @case ('error') {
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
              @case ('warning') {
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              }
              @case ('info') {
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
            }
          </div>
          <div class="flex-1 text-white">
            <div class="font-semibold text-sm text-white">{{ notification.message }}</div>
          </div>
          <button class="flex-shrink-0 text-white opacity-70 hover:opacity-100 transition-all transform hover:rotate-90 hover:scale-110 duration-200">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
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

  getClasses(type: Notification['type']): string {
    const classes = {
      success: 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 border-green-300 shadow-green-500/50 ring-4 ring-green-300/30',
      error: 'bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 border-red-300 shadow-red-500/50',
      warning: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 border-yellow-300 shadow-yellow-500/50',
      info: 'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 border-blue-300 shadow-blue-500/50'
    };
    return classes[type];
  }


  dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }
}

