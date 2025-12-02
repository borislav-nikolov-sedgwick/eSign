import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TypeSignatureComponent } from './type-signature.component';
import { DrawSignatureComponent } from './draw-signature.component';
import { ImageSignatureComponent } from './image-signature.component';
import { SessionService, SignatureData } from '../../core/services/session.service';

type SignatureTab = 'type' | 'draw' | 'image';

@Component({
  selector: 'app-signature-dialog',
  standalone: true,
  imports: [CommonModule, TypeSignatureComponent, DrawSignatureComponent, ImageSignatureComponent],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-900">Create Your Signature</h2>
          <p class="text-sm text-gray-500 mt-1">Choose how you'd like to create your signature</p>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-gray-200">
          <button 
            (click)="activeTab.set('type')"
            class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
            [class]="activeTab() === 'type' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'">
            Type
          </button>
          <button 
            (click)="activeTab.set('draw')"
            class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
            [class]="activeTab() === 'draw' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'">
            Draw
          </button>
          <button 
            (click)="activeTab.set('image')"
            class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
            [class]="activeTab() === 'image' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'">
            Upload
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-auto p-6">
          @switch (activeTab()) {
            @case ('type') {
              <app-type-signature 
                (signatureChange)="onSignatureChange($event)" />
            }
            @case ('draw') {
              <app-draw-signature 
                (signatureChange)="onSignatureChange($event)" />
            }
            @case ('image') {
              <app-image-signature 
                (signatureChange)="onSignatureChange($event)" />
            }
          }
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
          <button 
            (click)="onCancel()"
            class="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button 
            (click)="onClear()"
            class="px-6 py-2.5 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors">
            Clear
          </button>
          <button 
            (click)="onApply()"
            [disabled]="!currentSignature()"
            class="flex-1 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Apply Signature
          </button>
        </div>
      </div>
    </div>
  `
})
export class SignatureDialogComponent {
  private sessionService = inject(SessionService);

  activeTab = signal<SignatureTab>('type');
  currentSignature = signal<SignatureData | null>(null);

  cancel = output<void>();
  apply = output<SignatureData>();

  onSignatureChange(signature: SignatureData | null) {
    this.currentSignature.set(signature);
  }

  onCancel() {
    this.cancel.emit();
  }

  onClear() {
    this.currentSignature.set(null);
    // Components will handle their own clear via the signal
  }

  onApply() {
    const signature = this.currentSignature();
    if (signature) {
      this.sessionService.setSignature(signature);
      this.apply.emit(signature);
    }
  }
}

