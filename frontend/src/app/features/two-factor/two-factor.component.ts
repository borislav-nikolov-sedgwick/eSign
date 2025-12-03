import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SessionService } from '../../core/services/session.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-two-factor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-white mb-2">Verification Code</h1>
          <p class="text-blue-200">Enter the 6-digit code sent to {{ maskedPhone() }}</p>
        </div>

        <form (ngSubmit)="verifyCode()" class="space-y-6">
          <div>
            <label class="block text-blue-200 text-sm mb-2">Verification Code</label>
            <input
              type="text"
              [(ngModel)]="code"
              name="code"
              maxlength="6"
              placeholder="000000"
              inputmode="numeric"
              pattern="[0-9]*"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-center text-2xl tracking-widest placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              [disabled]="loading()"
              autocomplete="one-time-code">
          </div>

          @if (errorMessage()) {
            <div class="text-red-400 text-sm bg-red-500/20 p-3 rounded-lg">
              {{ errorMessage() }}
            </div>
          }

          <button
            type="submit"
            [disabled]="loading() || code.length !== 6"
            class="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50">
            @if (loading()) {
              <span class="flex items-center justify-center">
                <span class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                Verifying...
              </span>
            } @else {
              Verify Code
            }
          </button>
        </form>

        <div class="mt-6 text-center">
          <button
            (click)="resendCode()"
            [disabled]="cooldown() > 0 || sendingCode()"
            class="text-blue-300 hover:text-white text-sm disabled:opacity-50">
            @if (cooldown() > 0) {
              Resend code in {{ cooldown() }}s
            } @else if (sendingCode()) {
              Sending...
            } @else {
              Resend verification code
            }
          </button>
        </div>

        <div class="mt-4 text-center text-blue-300/70 text-xs">
          Check backend console for code
        </div>
      </div>
    </div>
  `
})
export class TwoFactorComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private sessionService = inject(SessionService);
  private notification = inject(NotificationService);

  code = '';
  loading = signal(false);
  sendingCode = signal(false);
  errorMessage = signal<string | null>(null);
  cooldown = signal(0);
  maskedPhone = signal('***-***-****');

  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    // If no session, try to reload
    if (!this.sessionService.hasSession()) {
      const token = this.route.snapshot.queryParamMap.get('token');
      if (token) {
        this.router.navigate(['/'], { queryParams: { token } });
      } else {
        this.router.navigate(['/']);
      }
      return;
    }

    const session = this.sessionService.session();
    if (session?.maskedPhoneNumber) {
      this.maskedPhone.set(session.maskedPhoneNumber);
    }
    this.sendCode();
  }

  ngOnDestroy() {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  sendCode() {
    const token = this.sessionService.getToken();
    if (!token) return;

    this.sendingCode.set(true);
    this.apiService.sendCode(token).subscribe({
      next: (response) => {
        this.sendingCode.set(false);
        if (response.success) {
          this.notification.info('Verification code sent! Check backend console.');
          this.startCooldown(response.cooldownSeconds || 30);
        }
      },
      error: () => {
        this.sendingCode.set(false);
      }
    });
  }

  resendCode() {
    if (this.cooldown() > 0) return;
    this.sendCode();
  }

  startCooldown(seconds: number) {
    this.cooldown.set(seconds);
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      const current = this.cooldown();
      if (current <= 1) {
        this.cooldown.set(0);
        if (this.cooldownInterval) clearInterval(this.cooldownInterval);
      } else {
        this.cooldown.set(current - 1);
      }
    }, 1000);
  }

  verifyCode() {
    if (this.code.length !== 6) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const token = this.sessionService.getToken();
    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    this.apiService.verifyCode(token, this.code).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          this.sessionService.updateSession({ twoFactorVerified: true });
          this.notification.success('Identity verified! You can now view your document.');
          this.router.navigate(['/document']);
        } else {
          this.errorMessage.set(response.message || 'Invalid code');
        }
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Verification failed. Please try again.');
      }
    });
  }
}
