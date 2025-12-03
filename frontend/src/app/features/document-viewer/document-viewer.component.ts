import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { SessionService } from '../../core/services/session.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-white">Review Document</h1>
            <button
              (click)="openSignatureDialog()"
              class="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg">
              Sign Document
            </button>
          </div>

          @if (loading()) {
            <div class="flex justify-center py-20">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          } @else if (pdfUrl()) {
            <div class="bg-white rounded-lg overflow-hidden" style="height: 600px;">
              <object [data]="pdfUrl()" type="application/pdf" class="w-full h-full">
                <embed [src]="pdfUrl()" type="application/pdf" class="w-full h-full" />
                <p class="p-4 text-center">
                  Your browser doesn't support PDF preview. 
                  <a [href]="pdfUrl()" target="_blank" class="text-blue-500 underline">Download PDF</a>
                </p>
              </object>
            </div>
          } @else {
            <div class="text-center py-20 text-blue-200">
              <p>Unable to load document. Please try again.</p>
              <button (click)="loadDocument()" class="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg">
                Retry
              </button>
            </div>
          }
        </div>
      </div>
    </div>

    @if (showSignatureDialog()) {
      <div class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div class="bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-white">Create Your Signature</h2>
            <button (click)="closeSignatureDialog()" class="text-gray-400 hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="flex space-x-2 mb-6">
            @for (tab of tabs; track tab.id) {
              <button
                (click)="activeTab.set(tab.id)"
                [class.bg-blue-500]="activeTab() === tab.id"
                [class.bg-slate-700]="activeTab() !== tab.id"
                class="flex-1 py-2 px-4 rounded-lg text-white text-sm font-medium transition-colors">
                {{ tab.label }}
              </button>
            }
          </div>

          @if (activeTab() === 'type') {
            <div class="space-y-4">
              <input
                type="text"
                [(ngModel)]="typedName"
                placeholder="Type your name"
                class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">

              <div class="flex space-x-2">
                @for (font of fonts; track font.name) {
                  <button
                    (click)="selectedFont.set(font.name)"
                    [class.ring-2]="selectedFont() === font.name"
                    [class.ring-blue-500]="selectedFont() === font.name"
                    class="flex-1 py-2 bg-white rounded text-center"
                    [style.font-family]="font.family">
                    Aa
                  </button>
                }
              </div>

              <div class="bg-white rounded-lg p-6 text-center min-h-20">
                <span [style.font-family]="getCurrentFontFamily()" class="text-3xl text-black">
                  {{ typedName || 'Your Signature' }}
                </span>
              </div>
            </div>
          }

          @if (activeTab() === 'draw') {
            <div class="space-y-4">
              <div class="bg-white rounded-lg p-2">
                <canvas
                  #signatureCanvas
                  width="400"
                  height="150"
                  class="w-full border border-gray-300 rounded cursor-crosshair touch-none"
                  (mousedown)="startDrawing($event)"
                  (mousemove)="draw($event)"
                  (mouseup)="stopDrawing()"
                  (mouseleave)="stopDrawing()"
                  (touchstart)="startDrawingTouch($event)"
                  (touchmove)="drawTouch($event)"
                  (touchend)="stopDrawing()">
                </canvas>
              </div>
              <button (click)="clearCanvas()" class="text-blue-400 text-sm">Clear</button>
            </div>
          }

          @if (activeTab() === 'upload') {
            <div class="space-y-4">
              <div
                class="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                (click)="fileInput.click()">
                @if (uploadedImage()) {
                  <img [src]="uploadedImage()" class="max-h-32 mx-auto">
                } @else {
                  <p class="text-blue-200">Click to upload signature image</p>
                  <p class="text-sm text-slate-400 mt-2">PNG, JPG up to 2MB</p>
                }
              </div>
              <input
                #fileInput
                type="file"
                accept="image/*"
                class="hidden"
                (change)="onFileSelected($event)">
            </div>
          }

          <button
            (click)="applySignature()"
            [disabled]="!canApplySignature() || signingInProgress()"
            class="w-full mt-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg disabled:opacity-50">
            @if (signingInProgress()) {
              Applying Signature...
            } @else {
              Apply Signature
            }
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class DocumentViewerComponent implements OnInit {
  private router = inject(Router);
  private apiService = inject(ApiService);
  private sessionService = inject(SessionService);
  private notification = inject(NotificationService);
  private sanitizer = inject(DomSanitizer);

  loading = signal(true);
  pdfUrl = signal<SafeResourceUrl | null>(null);
  showSignatureDialog = signal(false);
  activeTab = signal('type');
  typedName = '';
  selectedFont = signal('Dancing Script');
  uploadedImage = signal<string | null>(null);
  signingInProgress = signal(false);

  // Store signature data to pass to preview
  private signatureImageData = '';

  tabs = [
    { id: 'type', label: 'Type' },
    { id: 'draw', label: 'Draw' },
    { id: 'upload', label: 'Upload' }
  ];

  fonts = [
    { name: 'Dancing Script', family: '"Dancing Script", cursive' },
    { name: 'Great Vibes', family: '"Great Vibes", cursive' },
    { name: 'Pacifico', family: '"Pacifico", cursive' }
  ];

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isDrawing = false;

  ngOnInit() {
    this.loadDocument();
  }

  loadDocument() {
    this.loading.set(true);
    const token = this.sessionService.getToken();
    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    this.apiService.getDocument(token).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to load document');
      }
    });
  }

  openSignatureDialog() {
    this.showSignatureDialog.set(true);
    setTimeout(() => this.initCanvas(), 100);
  }

  closeSignatureDialog() {
    this.showSignatureDialog.set(false);
  }

  initCanvas() {
    this.canvas = document.querySelector('#signatureCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      const canvases = document.querySelectorAll('canvas');
      this.canvas = canvases[0] as HTMLCanvasElement;
    }
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      if (this.ctx) {
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
      }
    }
  }

  getCurrentFontFamily(): string {
    return this.fonts.find(f => f.name === this.selectedFont())?.family || 'cursive';
  }

  startDrawing(event: MouseEvent) {
    this.isDrawing = true;
    this.initCanvas();
    if (this.ctx && this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.ctx.beginPath();
      this.ctx.moveTo((event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY);
    }
  }

  draw(event: MouseEvent) {
    if (!this.isDrawing || !this.ctx || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.ctx.lineTo((event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY);
    this.ctx.stroke();
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  startDrawingTouch(event: TouchEvent) {
    event.preventDefault();
    const touch = event.touches[0];
    this.startDrawing({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
  }

  drawTouch(event: TouchEvent) {
    event.preventDefault();
    const touch = event.touches[0];
    this.draw({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
  }

  clearCanvas() {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadedImage.set(e.target?.result as string);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  canApplySignature(): boolean {
    if (this.activeTab() === 'type') return this.typedName.trim().length > 0;
    if (this.activeTab() === 'upload') return this.uploadedImage() !== null;
    return true;
  }

  getSignatureData(): string {
    if (this.activeTab() === 'type') {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 400;
      tempCanvas.height = 100;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.font = `48px ${this.getCurrentFontFamily()}`;
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.typedName, 200, 50);
      return tempCanvas.toDataURL('image/png');
    }
    if (this.activeTab() === 'draw' && this.canvas) {
      return this.canvas.toDataURL('image/png');
    }
    if (this.activeTab() === 'upload') {
      return this.uploadedImage() || '';
    }
    return '';
  }

  applySignature() {
    this.signingInProgress.set(true);
    const token = this.sessionService.getToken();
    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    const imageData = this.getSignatureData();
    this.signatureImageData = imageData;
    
    const signatureRequest = {
      method: this.activeTab() === 'type' ? 'Type' : this.activeTab() === 'draw' ? 'Draw' : 'Image',
      imageDataBase64: imageData.split(',')[1] || imageData,
      typedText: this.activeTab() === 'type' ? this.typedName : null,
      fontFamily: this.activeTab() === 'type' ? this.selectedFont() : null,
      color: '#000000'
    };

    this.apiService.signDocument(token, signatureRequest).subscribe({
      next: () => {
        this.signingInProgress.set(false);
        this.notification.success('Signature applied successfully!');
        this.closeSignatureDialog();
        this.router.navigate(['/preview']);
      },
      error: () => {
        this.signingInProgress.set(false);
        this.notification.error('Failed to apply signature');
      }
    });
  }
}
