import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SessionService } from '../../core/services/session.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-introduction',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 page-transition">
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20 animate-scaleIn">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-celebrate">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white mb-2 animate-fadeIn">Document Signing</h1>
          <p class="text-blue-200 animate-fadeIn" style="animation-delay: 0.1s;">Securely sign your insurance documents</p>
        </div>

        @if (loading()) {
          <div class="flex justify-center py-8">
            <div class="relative">
              <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-white"></div>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        } @else if (error()) {
          <div class="text-center py-8 animate-slideInUp">
            <p class="text-red-400 mb-4">{{ error() }}</p>
            <button (click)="loadSession()" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all transform hover:scale-105 btn-ripple">
              Try Again
            </button>
          </div>
        } @else {
          <div class="space-y-4 text-blue-100 mb-8">
            <div class="flex items-start space-x-3 animate-slideInUp" style="animation-delay: 0.2s;">
              <span class="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 glow">1</span>
              <span class="transition-all hover:translate-x-1">Verify your identity with your postcode</span>
            </div>
            <div class="flex items-start space-x-3 animate-slideInUp" style="animation-delay: 0.3s;">
              <span class="w-6 h-6 rounded-full bg-blue-500/50 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">2</span>
              <span class="transition-all hover:translate-x-1">Confirm with a verification code</span>
            </div>
            <div class="flex items-start space-x-3 animate-slideInUp" style="animation-delay: 0.4s;">
              <span class="w-6 h-6 rounded-full bg-blue-500/50 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">3</span>
              <span class="transition-all hover:translate-x-1">Review and sign your document</span>
            </div>
          </div>

          <button
            (click)="startProcess()"
            class="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg transform hover:scale-105 hover:shadow-2xl btn-ripple animate-slideInUp"
            style="animation-delay: 0.5s;">
            <span class="flex items-center justify-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
              Begin Verification
            </span>
          </button>
        }
      </div>
    </div>
  `
})
export class IntroductionComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private sessionService = inject(SessionService);
  private notification = inject(NotificationService);

  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadSession();
  }

  loadSession() {
    this.loading.set(true);
    this.error.set(null);

    const token = this.route.snapshot.queryParamMap.get('token');

    // If no token provided, redirect to expired/unauthorized page
    if (!token) {
      this.router.navigate(['/expired']);
      return;
    }

    this.apiService.getSession(token).subscribe({
      next: (session) => {
        this.sessionService.setSession(session);
        this.loading.set(false);

        // Check session status and redirect to appropriate step
        this.redirectBasedOnStatus(session.status, session);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 410) {
          this.router.navigate(['/expired']);
        } else {
          this.error.set('Failed to load session. Please try again.');
        }
      }
    });
  }

  private redirectBasedOnStatus(status: string, session: any) {
    // Map backend status to frontend route
    // Only redirect if user has already started the process (not on Pending with no progress)
    switch (status) {
      case 'Completed':
        this.router.navigate(['/complete']);
        break;
      case 'Preview':
        this.notification.info('You have a pending signature. Please review and submit.');
        this.router.navigate(['/preview']);
        break;
      case 'Signing':
      case 'DocumentViewing':
        this.notification.info('Welcome back! Continue reviewing your document.');
        this.router.navigate(['/document']);
        break;
      case 'TwoFactorVerification':
        this.notification.info('Please complete the verification process.');
        this.router.navigate(['/two-factor']);
        break;
      case 'PostcodeVerification':
        if (session.postcodeVerified) {
          this.router.navigate(['/two-factor']);
        } else {
          // Stay on intro page - user hasn't started yet
        }
        break;
      case 'Pending':
      default:
        // Check if user has already completed some steps - redirect to continue
        if (session.twoFactorVerified) {
          this.notification.info('Welcome back! Continue reviewing your document.');
          this.router.navigate(['/document']);
        } else if (session.postcodeVerified) {
          this.notification.info('Welcome back! Please complete verification.');
          this.router.navigate(['/two-factor']);
        }
        // Otherwise stay on intro page - user hasn't started yet
        break;
    }
  }

  startProcess() {
    this.router.navigate(['/postcode']);
  }
}
