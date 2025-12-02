import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WizardHeaderComponent } from '../wizard-header/wizard-header.component';

@Component({
  selector: 'app-session-expired',
  standalone: true,
  imports: [CommonModule, WizardHeaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-wizard-header title="Session Expired" />
      
      <main class="max-w-2xl mx-auto px-4 py-16 sm:px-6">
        <div class="bg-white rounded-xl shadow-lg p-8 text-center">
          <!-- Clock Icon -->
          <div class="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>

          <h1 class="text-2xl font-bold text-gray-900 mb-3">
            Session Expired
          </h1>
          
          <p class="text-gray-600 mb-8 max-w-md mx-auto">
            Your signing session has expired for security reasons. Please use the original link from your email to start a new session.
          </p>

          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <p class="text-sm text-gray-600">
              <strong>Why did this happen?</strong><br>
              Sessions automatically expire after 30 minutes of inactivity to protect your information.
            </p>
          </div>

          <p class="text-sm text-gray-500">
            Need help? Contact us at 
            <a href="mailto:support@example.com" class="text-blue-600 hover:underline">support&#64;example.com</a>
          </p>
        </div>
      </main>
    </div>
  `
})
export class SessionExpiredComponent {}

