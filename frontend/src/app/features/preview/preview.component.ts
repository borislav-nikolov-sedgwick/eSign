import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { SessionService } from '../../core/services/session.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 page-transition">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h1 class="text-2xl font-bold text-white">Preview Signed Document</h1>
              <p class="text-blue-200 mt-1">Your signature has been embedded in the PDF. Please review before submitting.</p>
            </div>
          </div>

          <!-- Signed PDF Preview -->
          <div class="bg-white rounded-lg overflow-hidden mb-6" style="height: 550px;">
            @if (loading()) {
              <div class="flex items-center justify-center h-full">
                <div class="text-center">
                  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p class="text-gray-500">Loading signed document...</p>
                </div>
              </div>
            } @else if (pdfUrl()) {
              <object [data]="pdfUrl()" type="application/pdf" class="w-full h-full">
                <embed [src]="pdfUrl()" type="application/pdf" class="w-full h-full" />
                <p class="p-4 text-center text-gray-500">
                  Your browser doesn't support PDF preview.
                  The signature has been successfully embedded in the document.
                </p>
              </object>
            } @else if (error()) {
              <div class="flex items-center justify-center h-full">
                <div class="text-center p-8">
                  <svg class="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p class="text-red-600 mb-4">{{ error() }}</p>
                  <button (click)="loadSignedDocument()" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Retry
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Signature confirmation banner -->
          <div class="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6 flex items-center space-x-3">
            <svg class="w-6 h-6 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-green-200">Your signature has been permanently embedded in the PDF document. Review the document above and submit when ready.</span>
          </div>

          <div class="flex space-x-4">
            <button
              (click)="goBack()"
              class="flex-1 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-all transform hover:scale-105 btn-ripple">
              <span class="flex items-center justify-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Back to Document
              </span>
            </button>
            <button
              (click)="submitDocument()"
              [disabled]="submitting() || loading()"
              class="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg disabled:opacity-50 transform hover:scale-105 hover:shadow-2xl btn-ripple">
              @if (submitting()) {
                <span class="flex items-center justify-center">
                  <span class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                  Submitting...
                </span>
              } @else {
                <span class="flex items-center justify-center">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Submit Document
                </span>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PreviewComponent implements OnInit {
  private router = inject(Router);
  private apiService = inject(ApiService);
  private sessionService = inject(SessionService);
  private notification = inject(NotificationService);
  private sanitizer = inject(DomSanitizer);

  loading = signal(true);
  submitting = signal(false);
  pdfUrl = signal<SafeResourceUrl | null>(null);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadSignedDocument();
  }

  loadSignedDocument() {
    this.loading.set(true);
    this.error.set(null);

    const token = this.sessionService.getToken();
    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    this.apiService.getSignedPreview(token).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 400) {
          this.error.set('Document has not been signed yet. Please go back and sign the document.');
        } else {
          this.error.set('Failed to load signed document. Please try again.');
        }
      }
    });
  }

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
