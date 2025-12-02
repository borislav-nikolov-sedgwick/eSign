import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SessionService } from '../../core/services/session.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h1 class="text-2xl font-bold text-white">Preview Signed Document</h1>
              <p class="text-blue-200 mt-1">Please review your signed document before submitting</p>
            </div>
          </div>

          <div class="bg-white rounded-lg overflow-hidden mb-6" style="height: 500px;">
            <div class="flex items-center justify-center h-full text-gray-500">
              <div class="text-center">
                <svg class="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-lg font-medium">Document Signed Successfully</p>
                <p class="text-sm text-gray-400 mt-2">Your signature has been applied to the document</p>
              </div>
            </div>
          </div>

          <div class="flex space-x-4">
            <button
              (click)="goBack()"
              class="flex-1 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-all">
              Back to Document
            </button>
            <button
              (click)="submitDocument()"
              [disabled]="submitting()"
              class="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg disabled:opacity-50">
              @if (submitting()) {
                <span class="flex items-center justify-center">
                  <span class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                  Submitting...
                </span>
              } @else {
                Submit Document
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PreviewComponent {
  private router = inject(Router);
  private apiService = inject(ApiService);
  private sessionService = inject(SessionService);
  private notification = inject(NotificationService);

  submitting = signal(false);

  goBack() {
    this.router.navigate(['/document']);
  }

  submitDocument() {
    this.submitting.set(true);
    const token = this.sessionService.getToken();
    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    this.apiService.submitDocument(token).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notification.success('Document submitted successfully!');
        this.router.navigate(['/complete']);
      },
      error: () => {
        this.submitting.set(false);
        this.notification.error('Failed to submit document');
      }
    });
  }
}
