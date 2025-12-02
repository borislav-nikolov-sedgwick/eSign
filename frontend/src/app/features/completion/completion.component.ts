import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WizardHeaderComponent } from '../../shared/components/wizard-header/wizard-header.component';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-completion',
  standalone: true,
  imports: [CommonModule, WizardHeaderComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <app-wizard-header title="Complete" />
      
      <main class="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <!-- Success Message -->
          <div class="text-center mb-8">
            <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-once">
              <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Document Signed Successfully!
            </h1>
            
            <p class="text-gray-600 max-w-md mx-auto">
              Thank you for signing the document. Your signed document has been submitted and processed successfully.
            </p>
          </div>

          <!-- Summary Card -->
          <div class="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-gray-500">Claim Reference</dt>
                <dd class="font-medium text-gray-900">{{ session()?.claimReference }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Policy Holder</dt>
                <dd class="font-medium text-gray-900">{{ session()?.policyHolder }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Status</dt>
                <dd class="font-medium text-green-600">✓ Completed</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Signed On</dt>
                <dd class="font-medium text-gray-900">{{ today | date:'medium' }}</dd>
              </div>
            </dl>
          </div>

          <!-- Signed Document Preview -->
          <div class="border-2 border-gray-200 rounded-lg overflow-hidden mb-8">
            <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p class="text-sm font-medium text-gray-700">Signed Document Preview</p>
            </div>
            <div class="bg-white p-6">
              <div class="max-w-lg mx-auto">
                <h3 class="text-lg font-bold mb-2">Insurance Claim Document</h3>
                <p class="text-sm text-gray-600 mb-4">Claim: {{ session()?.claimReference }}</p>
                <div class="border-t pt-4">
                  <p class="text-xs text-gray-500 mb-2">Signature:</p>
                  @if (signature()) {
                    <img [src]="signature()?.imageDataBase64" alt="Your signature" class="max-h-12" />
                  } @else {
                    <p class="text-xl" style="font-family: 'Dancing Script', cursive;">
                      {{ session()?.policyHolder }}
                    </p>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              (click)="onDownload()"
              class="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Download Signed Document
            </button>
          </div>

          <!-- Contact Info -->
          <div class="mt-8 pt-8 border-t text-center">
            <p class="text-sm text-gray-500">
              Need help? Contact our support team at <a href="mailto:support@example.com" class="text-blue-600 hover:underline">support&#64;example.com</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    @keyframes bounce-once {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .animate-bounce-once {
      animation: bounce-once 0.5s ease-in-out;
    }
  `]
})
export class CompletionComponent {
  private sessionService = inject(SessionService);

  session = this.sessionService.session;
  signature = this.sessionService.currentSignature;
  today = new Date();

  onDownload() {
    this.sessionService.downloadSignedDocument();
  }
}

