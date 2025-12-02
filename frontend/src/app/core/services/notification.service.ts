import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _notifications = signal<Notification[]>([]);
  notifications = this._notifications.asReadonly();

  show(type: Notification['type'], message: string, duration = 5000): void {
    const id = crypto.randomUUID();
    this._notifications.update(n => [...n, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string): void { this.show('success', message); }
  error(message: string): void { this.show('error', message, 8000); }
  warning(message: string): void { this.show('warning', message); }
  info(message: string): void { this.show('info', message); }

  dismiss(id: string): void {
    this._notifications.update(n => n.filter(x => x.id !== id));
  }
}

