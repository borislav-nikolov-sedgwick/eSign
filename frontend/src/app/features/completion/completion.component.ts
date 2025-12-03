import { Component, inject, signal, OnInit, Renderer2 } from '@angular/core';
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
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-4 page-transition">
      <div class="max-w-4xl mx-auto">
        <!-- Success Header -->
        <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 text-center mb-6 animate-scaleIn">
          <div class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-celebrate relative overflow-visible">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
            </svg>
            <!-- Celebration rings -->
            <div class="absolute inset-0 rounded-full border-4 border-green-400 animate-ping"></div>
            <div class="absolute inset-0 rounded-full border-2 border-green-300 animate-pulse"></div>
          </div>

          <h1 class="text-3xl font-bold text-white mb-4 animate-fadeIn">
            <span class="inline-block animate-bounce-slow">🎉</span>
            Document Signed & Submitted!
            <span class="inline-block animate-bounce-slow" style="animation-delay: 0.2s;">🎉</span>
          </h1>
          <p class="text-green-200 mb-2 animate-slideInUp" style="animation-delay: 0.2s;">
            Your document has been successfully signed and submitted.
          </p>
          <p class="text-green-300/70 text-sm animate-slideInUp" style="animation-delay: 0.3s;">
            <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Reference: {{ claimReference() }}
          </p>
        </div>

        <!-- Signed Document Preview -->
        <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 mb-6 animate-slideInUp" style="animation-delay: 0.4s;">
          <h2 class="text-xl font-bold text-white mb-4 flex items-center">
            <svg class="w-6 h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Your Signed Document
          </h2>
          
          <div class="bg-white rounded-lg overflow-hidden mb-4 transform transition-all hover:scale-[1.01]" style="height: 450px;">
            @if (loading()) {
              <div class="flex items-center justify-center h-full">
                <div class="relative">
                  <div class="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-500"></div>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <div class="w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
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
            class="w-full py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-all shadow-lg disabled:opacity-50 transform hover:scale-105 btn-ripple">
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
        <div class="bg-white/5 rounded-xl p-4 text-center animate-fadeIn" style="animation-delay: 0.6s;">
          <p class="text-green-200/70 text-sm flex items-center justify-center">
            <svg class="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
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
  private renderer = inject(Renderer2);

  loading = signal(true);
  downloading = signal(false);
  pdfUrl = signal<SafeResourceUrl | null>(null);
  claimReference = signal(this.sessionService.session()?.claimReference || 'N/A');

  ngOnInit() {
    this.loadSignedDocument();
    this.triggerConfetti();
  }

  private triggerConfetti() {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
      setTimeout(() => {
        const confetti = this.renderer.createElement('div');
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const randomX = Math.random() * window.innerWidth;
        const randomRotation = Math.random() * 360;
        const randomDelay = Math.random() * 0.5;

        this.renderer.setStyle(confetti, 'position', 'fixed');
        this.renderer.setStyle(confetti, 'left', `${randomX}px`);
        this.renderer.setStyle(confetti, 'top', '-20px');
        this.renderer.setStyle(confetti, 'width', '10px');
        this.renderer.setStyle(confetti, 'height', '10px');
        this.renderer.setStyle(confetti, 'background', randomColor);
        this.renderer.setStyle(confetti, 'pointer-events', 'none');
        this.renderer.setStyle(confetti, 'z-index', '9999');
        this.renderer.setStyle(confetti, 'border-radius', Math.random() > 0.5 ? '50%' : '2px');
        this.renderer.setStyle(confetti, 'animation', `confetti-fall ${2 + Math.random() * 2}s linear ${randomDelay}s forwards`);
        this.renderer.setStyle(confetti, 'transform', `rotate(${randomRotation}deg)`);

        this.renderer.appendChild(document.body, confetti);

        setTimeout(() => {
          this.renderer.removeChild(document.body, confetti);
        }, 4000);
      }, i * 30);
    }
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
