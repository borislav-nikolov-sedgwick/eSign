import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WizardHeaderComponent } from '../../shared/components/wizard-header/wizard-header.component';
import { StepIndicatorComponent, WizardStep } from '../../shared/components/step-indicator/step-indicator.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule, WizardHeaderComponent, StepIndicatorComponent, LoadingSpinnerComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-wizard-header title="Preview & Submit" />
      
      <main class="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        <app-step-indicator [steps]="steps" currentStep="sign" />

        <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8 mt-6">
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Preview Signed Document
          </h1>
          
          <p class="text-gray-600 mb-6">
            Review your signed document below. If everything looks correct, click Submit to complete.
          </p>

          @if (loading()) {
            <app-loading-spinner [overlay]="true" message="Submitting document..." />
          }

          <!-- Signed Document Preview -->
          <div class="border-2 border-gray-200 rounded-lg overflow-hidden mb-6">
            <div class="bg-gray-100 p-8 min-h-[400px]">
              <div class="bg-white shadow-lg max-w-2xl mx-auto p-8">
                <h2 class="text-2xl font-bold mb-4">Insurance Claim Document</h2>
                <div class="space-y-4 text-gray-700">
                  <p><strong>Claim Reference:</strong> {{ session()?.claimReference }}</p>
                  <p><strong>Policy Holder:</strong> {{ session()?.policyHolder }}</p>
                  <hr class="my-4">
                  <p>This document confirms your insurance claim.</p>
                  <div class="mt-8 pt-8 border-t">
                    <p class="text-sm text-gray-500 mb-2">Signed by:</p>
                    @if (signature()) {
                      <div class="bg-gray-50 rounded-lg p-4 inline-block">
                        <img [src]="signature()?.imageDataBase64" alt="Signature" class="max-h-16" />
                      </div>
                    } @else {
                      <p class="text-2xl" style="font-family: 'Dancing Script', cursive;">
                        {{ session()?.policyHolder || 'Your Signature' }}
                      </p>
                    }
                    <p class="text-xs text-gray-400 mt-2">
                      Signed on {{ today | date:'medium' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Legal Notice -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p class="text-sm text-blue-800">
              <strong>Important:</strong> By clicking Submit, you confirm that:
            </p>
            <ul class="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
              <li>The information provided is accurate and complete</li>
              <li>You agree to the terms and conditions of this claim</li>
              <li>Your electronic signature is legally binding</li>
            </ul>
          </div>

          <div class="flex flex-col sm:flex-row gap-4">
            <button 
              type="button"
              (click)="onGoBack()"
              [disabled]="loading()"
              class="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50">
              Go back
            </button>
            <button 
              (click)="onSubmit()"
              [disabled]="loading()"
              class="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              @if (loading()) {
                <span class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Submitting...
                </span>
              } @else {
                Submit
              }
            </button>
          </div>
        </div>
      </main>
    </div>
  `
})
export class PreviewComponent {
  private router = inject(Router);
  private sessionService = inject(SessionService);

  loading = this.sessionService.loading;
  session = this.sessionService.session;
  signature = this.sessionService.currentSignature;
  today = new Date();

  steps: WizardStep[] = [
    { id: 'postcode', title: 'Postcode', description: 'Verify postcode' },
    { id: '2fa', title: '2FA', description: 'Verify phone' },
    { id: 'document', title: 'Document', description: 'View document' },
    { id: 'sign', title: 'Sign', description: 'Sign document' }
  ];

  async onSubmit() {
    const success = await this.sessionService.submitDocument();
    if (success) {
      this.router.navigate(['/complete']);
    }
  }

  onGoBack() {
    this.router.navigate(['/document']);
  }
}

