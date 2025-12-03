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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m5-6a2 2 0 100-4 2 2 0 000 4zm-3-2a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
          </svg>
        </div>

        <h1 class="text-2xl font-bold text-white mb-4">Session Invalid</h1>
        <p class="text-red-200 mb-6">
          Your signing session has expired, is invalid, or you don't have permission to access this page. 
          Please request a new signing link from your insurance provider.
        </p>

        <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p class="text-red-200 text-sm">
            <strong>Common reasons:</strong>
          </p>
          <ul class="text-red-300/80 text-sm mt-2 text-left list-disc list-inside space-y-1">
            <li>The signing link has expired</li>
            <li>The link was accessed without a valid token</li>
            <li>The document has already been signed</li>
            <li>Too many failed verification attempts</li>
          </ul>
        </div>

        <div class="text-sm text-red-300/70">
          If you believe this is an error, please contact support with your claim reference number.
        </div>
      </div>
    </div>
  `
})
export class SessionExpiredComponent {}
