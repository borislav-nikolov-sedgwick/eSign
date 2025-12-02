import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SessionService } from '../../core/services/session.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-postcode-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-white mb-2">Verify Your Identity</h1>
          <p class="text-blue-200">Enter the postcode associated with your claim</p>
        </div>

        <form (ngSubmit)="verify()" class="space-y-6">
          <div>
            <label class="block text-blue-200 text-sm mb-2">Postcode</label>
            <input
              type="text"
              [(ngModel)]="postcode"
              name="postcode"
              placeholder="e.g., SW1A 1AA"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              [disabled]="loading()">
          </div>

          @if (errorMessage()) {
            <div class="text-red-400 text-sm bg-red-500/20 p-3 rounded-lg">
              {{ errorMessage() }}
              @if (remainingAttempts() !== null) {
                <span class="block mt-1">{{ remainingAttempts() }} attempts remaining</span>
              }
            </div>
          }

          <button
            type="submit"
            [disabled]="loading() || !postcode.trim()"
            class="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50">
            @if (loading()) {
              <span class="flex items-center justify-center">
                <span class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                Verifying...
              </span>
            } @else {
              Verify Postcode
            }
          </button>
        </form>
      </div>
    </div>
  `
})
export class PostcodeVerificationComponent {
  private router = inject(Router);
  private apiService = inject(ApiService);
  private sessionService = inject(SessionService);
  private notification = inject(NotificationService);

  postcode = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  remainingAttempts = signal<number | null>(null);

  verify() {
    if (!this.postcode.trim()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const token = this.sessionService.getToken();
    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    this.apiService.verifyPostcode(token, this.postcode).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          this.notification.success('Postcode verified successfully!');
          this.router.navigate(['/two-factor']);
        } else {
          this.errorMessage.set(response.message || 'Incorrect postcode');
          this.remainingAttempts.set(response.remainingAttempts);
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 423) {
          this.notification.error('Too many failed attempts. Session locked.');
          this.router.navigate(['/expired']);
        } else {
          this.errorMessage.set('Verification failed. Please try again.');
        }
      }
    });
  }
}

