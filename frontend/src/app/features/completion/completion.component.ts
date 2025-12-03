import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { SessionService } from '../../core/services/session.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-completion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-4">
      <div class="max-w-4xl mx-auto">
        <!-- Success Header -->
        <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 text-center mb-6">
          <div class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
            </svg>
          </div>

          <h1 class="text-3xl font-bold text-white mb-4">Document Signed & Submitted!</h1>
          <p class="text-green-200 mb-2">
            Your document has been successfully signed and submitted.
          </p>
          <p class="text-green-300/70 text-sm">
            Reference: {{ claimReference() }}
          </p>
        </div>

        <!-- Signed Document Preview -->
        <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 mb-6">
          <h2 class="text-xl font-bold text-white mb-4">Your Signed Document</h2>
          
          <div class="bg-white rounded-lg overflow-hidden mb-4" style="height: 450px;">
            @if (loading()) {
              <div class="flex items-center justify-center h-full">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              </div>
            } @else if (pdfUrl()) {
              <object [data]="pdfUrl()" type="application/pdf" class="w-full h-full">
                <embed [src]="pdfUrl()" type="application/pdf" class="w-full h-full" />
                <p class="p-4 text-center text-gray-500">
                  Your browser doesn't support PDF preview. Use the download button below.
                </p>
              </object>
            }
          </div>

          <button
            (click)="downloadDocument()"
            [disabled]="downloading()"
            class="w-full py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-all shadow-lg disabled:opacity-50">
            @if (downloading()) {
              <span class="flex items-center justify-center">
                <span class="animate-spin rounded-full h-5 w-5 border-b-2 border-green-700 mr-2"></span>
                Downloading...
              </span>
            } @else {
              <span class="flex items-center justify-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download Signed Document
              </span>
            }
          </button>
        </div>

        <!-- Info Footer -->
        <div class="bg-white/5 rounded-xl p-4 text-center">
          <p class="text-green-200/70 text-sm">
            A copy of this signed document has been sent to your email address.
            Please keep the downloaded copy for your records.
          </p>
        </div>
      </div>
    </div>
  `
})
export class CompletionComponent implements OnInit {
  private apiService = inject(ApiService);
  private sessionService = inject(SessionService);
  private notification = inject(NotificationService);
  private sanitizer = inject(DomSanitizer);

  loading = signal(true);
  downloading = signal(false);
  pdfUrl = signal<SafeResourceUrl | null>(null);
  claimReference = signal(this.sessionService.session()?.claimReference || 'N/A');

  ngOnInit() {
    this.loadSignedDocument();
  }

  loadSignedDocument() {
    this.loading.set(true);
    const token = this.sessionService.getToken();
    if (!token) return;

    this.apiService.downloadDocument(token).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  downloadDocument() {
    this.downloading.set(true);
    const token = this.sessionService.getToken();
    if (!token) {
      this.downloading.set(false);
      this.notification.error('Session not found');
      return;
    }

    this.apiService.downloadDocument(token).subscribe({
      next: (blob) => {
        this.downloading.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `signed-document-${this.claimReference()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.notification.success('Document downloaded!');
      },
      error: () => {
        this.downloading.set(false);
        this.notification.error('Failed to download document');
      }
    });
  }
}
