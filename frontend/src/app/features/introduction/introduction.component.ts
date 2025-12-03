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
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white mb-2">Document Signing</h1>
          <p class="text-blue-200">Securely sign your insurance documents</p>
        </div>

        @if (loading()) {
          <div class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        } @else if (error()) {
          <div class="text-center py-8">
            <p class="text-red-400 mb-4">{{ error() }}</p>
            <button (click)="loadSession()" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Try Again
            </button>
          </div>
        } @else {
          <div class="space-y-4 text-blue-100 mb-8">
            <div class="flex items-start space-x-3">
              <span class="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">1</span>
              <span>Verify your identity with your postcode</span>
            </div>
            <div class="flex items-start space-x-3">
              <span class="w-6 h-6 rounded-full bg-blue-500/50 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">2</span>
              <span>Confirm with a verification code</span>
            </div>
            <div class="flex items-start space-x-3">
              <span class="w-6 h-6 rounded-full bg-blue-500/50 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">3</span>
              <span>Review and sign your document</span>
            </div>
          </div>

          <button
            (click)="startProcess()"
            class="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg">
            Begin Verification
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

    const token = this.route.snapshot.queryParamMap.get('token') || 'demo-token-123';

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
          this.notification.info('Please verify your postcode to continue.');
          this.router.navigate(['/postcode']);
        }
        break;
      case 'Pending':
      default:
        // Check if user has already completed some steps
        if (session.twoFactorVerified) {
          this.router.navigate(['/document']);
        } else if (session.postcodeVerified) {
          this.router.navigate(['/two-factor']);
        } else {
          // Show introduction page
          this.notification.info('Welcome! Please verify your identity to continue.');
        }
        break;
    }
  }

  startProcess() {
    this.router.navigate(['/postcode']);
  }
}
