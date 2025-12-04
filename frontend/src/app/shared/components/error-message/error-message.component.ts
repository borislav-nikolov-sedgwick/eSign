import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <!-- Error Icon -->
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          @switch (type()) {
            @case ('expired') {
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            }
            @case ('locked') {
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            }
            @case ('not-found') {
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            }
            @default {
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            }
          }
        </div>

        <h1 class="text-xl font-bold text-gray-900 mb-2">{{ title() }}</h1>
        <p class="text-gray-600 mb-6">{{ message() }}</p>

        @if (showRetry()) {
          <button 
            (click)="retry.emit()"
            class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Try Again
          </button>
        }

        @if (showContact()) {
          <p class="mt-6 text-sm text-gray-500">
            Need help? Contact us at 
            <a href="mailto:support@example.com" class="text-blue-600 hover:underline">support&#64;example.com</a>
          </p>
        }
      </div>
    </div>
  `
})
export class ErrorMessageComponent {
  type = input<'expired' | 'locked' | 'not-found' | 'error'>('error');
  title = input('Something went wrong');
  message = input('An unexpected error occurred. Please try again.');
  showRetry = input(true);
  showContact = input(true);

  retry = output<void>();
}

