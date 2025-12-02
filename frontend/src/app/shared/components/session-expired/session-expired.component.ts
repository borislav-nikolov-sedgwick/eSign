import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-session-expired',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20 text-center">
        <div class="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>

        <h1 class="text-2xl font-bold text-white mb-4">Session Expired</h1>
        <p class="text-red-200 mb-6">
          Your signing session has expired or is no longer valid. Please request a new signing link from your insurance provider.
        </p>

        <div class="text-sm text-red-300/70">
          If you believe this is an error, please contact support.
        </div>
      </div>
    </div>
  `
})
export class SessionExpiredComponent {}
