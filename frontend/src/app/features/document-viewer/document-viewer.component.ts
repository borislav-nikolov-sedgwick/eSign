import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { trigger, transition, style, animate } from '@angular/animations';
import { ApiService } from '../../core/services/api.service';
import { SessionService } from '../../core/services/session.service';
import { NotificationService } from '../../core/services/notification.service';

interface DrawingStroke {
  points: { x: number; y: number }[];
  color: string;
}

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('dialogAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('dialogContentAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }),
        animate('400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', style({
          opacity: 1,
          transform: 'scale(1) translateY(0)'
        }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({
          opacity: 0,
          transform: 'scale(0.95) translateY(10px)'
        }))
      ])
    ])
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 page-transition">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-white">Review Document</h1>
            <p class="text-blue-200 mt-1">Please review the document below and sign when ready</p>
          </div>

          @if (loading()) {
            <div class="flex justify-center py-20">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          } @else if (pdfUrl()) {
            <div class="bg-white rounded-lg overflow-hidden mb-6" style="height: 600px;">
              <object [data]="pdfUrl()" type="application/pdf" class="w-full h-full">
                <embed [src]="pdfUrl()" type="application/pdf" class="w-full h-full" />
                <p class="p-4 text-center">
                  Your browser doesn't support PDF preview.
                  <a [href]="pdfUrl()" target="_blank" class="text-blue-500 underline">Download PDF</a>
                </p>
              </object>
            </div>

            <!-- Sign Document Button - Now below PDF -->
            <button
              (click)="openSignatureDialog()"
              class="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg">
              <span class="flex items-center justify-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
                Sign Document
              </span>
            </button>
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
      <div @dialogAnimation class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div @dialogContentAnimation class="bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto border-2 border-slate-600">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-white flex items-center">
              <svg class="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
              </svg>
              Create Your Signature
            </h2>
            <button (click)="closeSignatureDialog()" class="text-gray-400 hover:text-white transition-all transform hover:scale-110 hover:rotate-90 duration-200">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Tab Selection -->
          <div class="flex space-x-2 mb-6">
            @for (tab of tabs; track tab.id) {
              <button
                (click)="switchTab(tab.id)"
                class="flex-1 py-2 px-4 rounded-lg text-white text-sm font-medium transition-all duration-300 transform hover:scale-105"
                [class]="activeTab() === tab.id
                  ? 'flex-1 py-2 px-4 rounded-lg text-white text-sm font-medium transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg'
                  : 'flex-1 py-2 px-4 rounded-lg text-white text-sm font-medium transition-all duration-300 transform hover:scale-105 bg-slate-700 hover:bg-slate-600'">
                {{ tab.label }}
              </button>
            }
          </div>

          <!-- TYPE TAB -->
          @if (activeTab() === 'type') {
            <div class="space-y-4">
              <!-- Name Input -->
              <div class="flex space-x-2">
                <input
                  type="text"
                  [(ngModel)]="typedName"
                  placeholder="Type your name"
                  class="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <button
                  (click)="clearTypedName()"
                  class="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                  title="Clear">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- Font Selection -->
              <div>
                <label class="text-sm text-slate-400 mb-2 block">Font Style</label>
                <div class="flex space-x-2">
                  @for (font of fonts; track font.name) {
                    <button
                      (click)="selectedFont.set(font.name)"
                      [class.ring-2]="selectedFont() === font.name"
                      [class.ring-blue-500]="selectedFont() === font.name"
                      class="flex-1 py-3 bg-white rounded text-center text-lg text-slate-900 transition-all hover:scale-105"
                      [style.font-family]="font.family">
                      Aa
                    </button>
                  }
                </div>
              </div>

              <!-- Color Selection -->
              <div>
                <label class="text-sm text-slate-400 mb-2 block">Signature Color</label>
                <div class="flex space-x-3">
                  @for (color of colors; track color.value) {
                    <button
                      (click)="selectedColor.set(color.value)"
                      [class.ring-2]="selectedColor() === color.value"
                      [class.ring-offset-2]="selectedColor() === color.value"
                      [class.ring-offset-slate-800]="selectedColor() === color.value"
                      class="w-10 h-10 rounded-full border-2 border-slate-600 transition-transform hover:scale-110"
                      [style.background-color]="color.value"
                      [title]="color.name">
                    </button>
                  }
                </div>
              </div>

              <!-- Preview -->
              <div class="bg-white rounded-lg p-6 text-center min-h-24 transition-all">
                <span
                  [style.font-family]="getCurrentFontFamily()"
                  [style.color]="selectedColor()"
                  class="text-3xl transition-colors duration-300">
                  {{ typedName || 'Your Signature' }}
                </span>
              </div>
            </div>
          }

          <!-- DRAW TAB -->
          @if (activeTab() === 'draw') {
            <div class="space-y-4">
              <!-- Color Selection -->
              <div>
                <label class="text-sm text-slate-400 mb-2 block">Pen Color (changes existing drawing)</label>
                <div class="flex space-x-3">
                  @for (color of colors; track color.value) {
                    <button
                      (click)="setDrawColor(color.value)"
                      [class.ring-2]="drawColor() === color.value"
                      [class.ring-offset-2]="drawColor() === color.value"
                      [class.ring-offset-slate-800]="drawColor() === color.value"
                      class="w-10 h-10 rounded-full border-2 border-slate-600 transition-transform hover:scale-110"
                      [style.background-color]="color.value"
                      [title]="color.name">
                    </button>
                  }
                </div>
              </div>

              <!-- Canvas -->
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

              <button (click)="clearCanvas()" class="text-blue-400 text-sm hover:text-blue-300">
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  Clear Drawing
                </span>
              </button>
            </div>
          }

          <!-- UPLOAD TAB -->
          @if (activeTab() === 'upload') {
            <div class="space-y-4">
              <div
                class="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                (click)="fileInput.click()">
                @if (processedImage()) {
                  <div class="bg-gray-100 rounded p-2 inline-block">
                    <img [src]="processedImage()" class="max-h-32 mx-auto">
                  </div>
                  <p class="text-green-400 text-sm mt-2">✓ Background removed</p>
                } @else if (uploadedImage()) {
                  <img [src]="uploadedImage()" class="max-h-32 mx-auto">
                  <p class="text-yellow-400 text-sm mt-2">Processing...</p>
                } @else {
                  <svg class="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <p class="text-blue-200">Click to upload signature image</p>
                  <p class="text-sm text-slate-400 mt-2">PNG, JPG up to 2MB (white background will be removed)</p>
                }
              </div>
              <input
                #fileInput
                type="file"
                accept="image/*"
                class="hidden"
                (change)="onFileSelected($event)">

              @if (uploadedImage() || processedImage()) {
                <button (click)="clearUploadedImage()" class="text-blue-400 text-sm hover:text-blue-300">
                  <span class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Remove Image
                  </span>
                </button>
              }
            </div>
          }

          <!-- Apply Button -->
          <button
            (click)="applySignature()"
            [disabled]="!canApplySignature() || signingInProgress()"
            class="w-full mt-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-2xl btn-ripple">
            @if (signingInProgress()) {
              <span class="flex items-center justify-center">
                <span class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                Applying Signature...
              </span>
            } @else {
              <span class="flex items-center justify-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Apply Signature
              </span>
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
  selectedColor = signal('#000000');
  drawColor = signal('#000000');
  uploadedImage = signal<string | null>(null);
  processedImage = signal<string | null>(null);
  signingInProgress = signal(false);

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

  colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Blue', value: '#0000FF' },
    { name: 'Red', value: '#FF0000' }
  ];

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isDrawing = false;

  // Store drawing strokes for color change and persistence
  private drawingStrokes: DrawingStroke[] = [];
  private currentStroke: DrawingStroke | null = null;

  ngOnInit() {
    this.loadDocument();
  }

  loadDocument() {
    this.loading.set(true);
    const token = this.sessionService.getToken();
    if (!token) {
      this.router.navigate(['/expired']);
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

  switchTab(tabId: string) {
    this.activeTab.set(tabId);
    if (tabId === 'draw') {
      // Restore drawing when switching back to draw tab
      setTimeout(() => {
        this.initCanvas();
        this.redrawAllStrokes();
      }, 100);
    }
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
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
      }
    }
  }

  setDrawColor(color: string) {
    const oldColor = this.drawColor();
    this.drawColor.set(color);

    // Update all existing strokes to new color
    this.drawingStrokes.forEach(stroke => {
      stroke.color = color;
    });

    // Redraw canvas with new color
    this.redrawAllStrokes();
  }

  private redrawAllStrokes() {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Redraw all strokes
    for (const stroke of this.drawingStrokes) {
      if (stroke.points.length < 2) continue;

      this.ctx.strokeStyle = stroke.color;
      this.ctx.beginPath();
      this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      this.ctx.stroke();
    }
  }

  getCurrentFontFamily(): string {
    return this.fonts.find(f => f.name === this.selectedFont())?.family || 'cursive';
  }

  clearTypedName() {
    this.typedName = '';
  }

  clearUploadedImage() {
    this.uploadedImage.set(null);
    this.processedImage.set(null);
  }

  startDrawing(event: MouseEvent) {
    this.isDrawing = true;
    this.initCanvas();
    if (this.ctx && this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      // Start a new stroke
      this.currentStroke = {
        points: [{ x, y }],
        color: this.drawColor()
      };

      this.ctx.strokeStyle = this.drawColor();
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
    }
  }

  draw(event: MouseEvent) {
    if (!this.isDrawing || !this.ctx || !this.canvas || !this.currentStroke) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Add point to current stroke
    this.currentStroke.points.push({ x, y });

    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  stopDrawing() {
    if (this.currentStroke && this.currentStroke.points.length > 1) {
      this.drawingStrokes.push(this.currentStroke);
    }
    this.currentStroke = null;
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
    this.drawingStrokes = [];
    this.currentStroke = null;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        this.uploadedImage.set(dataUrl);
        // Process image to remove white background
        this.removeWhiteBackground(dataUrl);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  private removeWhiteBackground(dataUrl: string) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Process each pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check if pixel is white or near-white (light background)
        // Using a threshold to catch off-white colors too
        const brightness = (r + g + b) / 3;
        const isWhiteish = brightness > 240 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20;

        // Also check for very light pixels
        const isVeryLight = r > 230 && g > 230 && b > 230;

        if (isWhiteish || isVeryLight) {
          // Make transparent
          data[i + 3] = 0;
        }
      }

      // Put processed image data back
      ctx.putImageData(imageData, 0, 0);

      // Convert to data URL
      this.processedImage.set(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  }

  canApplySignature(): boolean {
    if (this.activeTab() === 'type') return this.typedName.trim().length > 0;
    if (this.activeTab() === 'upload') return this.processedImage() !== null || this.uploadedImage() !== null;
    if (this.activeTab() === 'draw') return this.drawingStrokes.length > 0;
    return true;
  }

  getSignatureData(): string {
    if (this.activeTab() === 'type') {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 400;
      tempCanvas.height = 100;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.font = `48px ${this.getCurrentFontFamily()}`;
      ctx.fillStyle = this.selectedColor();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.typedName, 200, 50);
      return tempCanvas.toDataURL('image/png');
    }
    if (this.activeTab() === 'draw' && this.canvas) {
      return this.canvas.toDataURL('image/png');
    }
    if (this.activeTab() === 'upload') {
      // Use processed image (with background removed) if available
      return this.processedImage() || this.uploadedImage() || '';
    }
    return '';
  }

  applySignature() {
    this.signingInProgress.set(true);
    const token = this.sessionService.getToken();
    if (!token) {
      this.router.navigate(['/expired']);
      return;
    }

    const imageData = this.getSignatureData();

    const signatureRequest = {
      method: this.activeTab() === 'type' ? 'Type' : this.activeTab() === 'draw' ? 'Draw' : 'Image',
      imageDataBase64: imageData.split(',')[1] || imageData,
      typedText: this.activeTab() === 'type' ? this.typedName : null,
      fontFamily: this.activeTab() === 'type' ? this.selectedFont() : null,
      color: this.activeTab() === 'draw' ? this.drawColor() : this.selectedColor()
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
