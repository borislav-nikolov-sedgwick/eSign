import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WizardHeaderComponent } from '../../shared/components/wizard-header/wizard-header.component';
import { StepIndicatorComponent, WizardStep } from '../../shared/components/step-indicator/step-indicator.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { SignatureDialogComponent } from '../signature/signature-dialog.component';
import { SessionService, SignatureData } from '../../core/services/session.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [
    CommonModule, 
    WizardHeaderComponent, 
    StepIndicatorComponent, 
    LoadingSpinnerComponent,
    SignatureDialogComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-wizard-header title="Document Review" />
      
      <main class="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        <app-step-indicator [steps]="steps" currentStep="document" />

        <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8 mt-6">
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Review Document
          </h1>
          
          <p class="text-gray-600 mb-6">
            Please review the document below before signing. Click "Sign Document" when ready.
          </p>

          <!-- PDF Viewer Placeholder -->
          <div class="border-2 border-gray-200 rounded-lg overflow-hidden mb-6">
            @if (loading()) {
              <app-loading-spinner message="Loading document..." />
            } @else {
              <div class="bg-gray-100 p-8 min-h-[500px]">
                <div class="bg-white shadow-lg max-w-2xl mx-auto p-8">
                  <h2 class="text-2xl font-bold mb-4">Insurance Claim Document</h2>
                  <div class="space-y-4 text-gray-700">
                    <p><strong>Claim Reference:</strong> {{ session()?.claimReference }}</p>
                    <p><strong>Policy Holder:</strong> {{ session()?.policyHolder }}</p>
                    <hr class="my-4">
                    <p>This document confirms your insurance claim and requires your electronic signature to proceed with processing.</p>
                    <p>By signing this document, you confirm that all information provided is accurate and complete.</p>
                    <div class="mt-8 pt-8 border-t">
                      <p class="text-sm text-gray-500">Signature Required Below</p>
                      @if (currentSignature()) {
                        <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                          <img [src]="currentSignature()?.imageDataBase64" alt="Your signature" class="max-h-20" />
                          <p class="text-xs text-gray-400 mt-2">Signed digitally</p>
                        </div>
                      } @else {
                        <div class="mt-4 h-20 border-b-2 border-gray-400 border-dashed"></div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="flex flex-col sm:flex-row gap-4">
            <button 
              type="button"
              (click)="onBack()"
              class="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
              Back
            </button>
            @if (currentSignature()) {
              <button 
                (click)="showSignatureDialog.set(true)"
                class="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors">
                Change Signature
              </button>
              <button 
                (click)="onContinue()"
                [disabled]="submitting()"
                class="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                @if (submitting()) {
                  Applying...
                } @else {
                  Continue to Preview
                }
              </button>
            } @else {
              <button 
                (click)="showSignatureDialog.set(true)"
                [disabled]="loading()"
                class="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                Sign Document
              </button>
            }
          </div>
        </div>
      </main>

      <!-- Signature Dialog -->
      @if (showSignatureDialog()) {
        <app-signature-dialog 
          (cancel)="showSignatureDialog.set(false)"
          (apply)="onSignatureApplied($event)" />
      }
    </div>
  `
})
export class DocumentViewerComponent {
  private router = inject(Router);
  private sessionService = inject(SessionService);
  private api = inject(ApiService);

  loading = signal(false);
  submitting = signal(false);
  showSignatureDialog = signal(false);
  
  session = this.sessionService.session;
  currentSignature = this.sessionService.currentSignature;

  steps: WizardStep[] = [
    { id: 'postcode', title: 'Postcode', description: 'Verify postcode' },
    { id: '2fa', title: '2FA', description: 'Verify phone' },
    { id: 'document', title: 'Document', description: 'View document' },
    { id: 'sign', title: 'Sign', description: 'Sign document' }
  ];

  onSignatureApplied(signature: SignatureData) {
    this.showSignatureDialog.set(false);
  }

  async onContinue() {
    this.submitting.set(true);
    try {
      const success = await this.sessionService.applySignature();
      if (success) {
        this.router.navigate(['/preview']);
      }
    } finally {
      this.submitting.set(false);
    }
  }

  onBack() {
    this.router.navigate(['/two-factor']);
  }
}

