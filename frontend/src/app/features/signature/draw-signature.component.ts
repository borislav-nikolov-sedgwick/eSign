import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignatureData } from '../../core/services/session.service';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-draw-signature',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <p class="text-sm text-gray-600">
        Use your mouse, finger, or stylus to draw your signature below.
      </p>

      <!-- Canvas Container -->
      <div class="relative">
        <canvas 
          #signatureCanvas
          class="w-full border-2 border-dashed border-gray-300 rounded-lg bg-white touch-none"
          [style.height.px]="canvasHeight"
          (mousedown)="onDrawStart()"
          (touchstart)="onDrawStart()">
        </canvas>
        
        @if (!hasDrawn()) {
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span class="text-gray-400">Draw your signature here</span>
          </div>
        }
      </div>

      <!-- Color Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Ink color
        </label>
        <div class="flex gap-3">
          @for (color of colors; track color.name) {
            <button 
              (click)="setColor(color.value)"
              class="w-10 h-10 rounded-full border-4 transition-transform hover:scale-110"
              [style.background-color]="color.value"
              [class]="selectedColor() === color.value ? 'border-gray-800 scale-110' : 'border-transparent'"
              [attr.aria-label]="color.name">
            </button>
          }
        </div>
      </div>

      <!-- Instructions -->
      <p class="text-xs text-gray-500">
        Tip: For best results on mobile, rotate your device to landscape mode.
      </p>
    </div>
  `,
  styles: [`
    canvas {
      touch-action: none;
    }
  `]
})
export class DrawSignatureComponent implements AfterViewInit, OnDestroy {
  @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  signatureChange = output<SignatureData | null>();

  canvasHeight = 200;
  hasDrawn = signal(false);
  selectedColor = signal('#000000');

  colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Blue', value: '#0000FF' },
    { name: 'Red', value: '#FF0000' }
  ];

  private signaturePad: SignaturePad | null = null;
  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit() {
    this.initSignaturePad();
    this.setupResizeObserver();
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.signaturePad) {
      this.signaturePad.off();
    }
  }

  private initSignaturePad() {
    const canvas = this.canvasRef.nativeElement;
    
    // Set canvas dimensions
    this.resizeCanvas();

    this.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: this.selectedColor()
    });

    this.signaturePad.addEventListener('endStroke', () => {
      this.hasDrawn.set(!this.signaturePad!.isEmpty());
      this.emitSignature();
    });
  }

  private setupResizeObserver() {
    const canvas = this.canvasRef.nativeElement;
    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
    });
    this.resizeObserver.observe(canvas.parentElement!);
  }

  private resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;
    if (!container) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = container.clientWidth;
    const height = this.canvasHeight;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
    }

    // Re-initialize signature pad if it exists
    if (this.signaturePad) {
      const data = this.signaturePad.toData();
      this.signaturePad.clear();
      if (data.length > 0) {
        this.signaturePad.fromData(data);
      }
    }
  }

  onDrawStart() {
    this.hasDrawn.set(true);
  }

  setColor(color: string) {
    this.selectedColor.set(color);
    if (this.signaturePad) {
      this.signaturePad.penColor = color;
    }
  }

  clear() {
    if (this.signaturePad) {
      this.signaturePad.clear();
      this.hasDrawn.set(false);
      this.signatureChange.emit(null);
    }
  }

  private emitSignature() {
    if (!this.signaturePad || this.signaturePad.isEmpty()) {
      this.signatureChange.emit(null);
      return;
    }

    const imageData = this.signaturePad.toDataURL('image/png');

    this.signatureChange.emit({
      method: 'Draw',
      imageDataBase64: imageData,
      color: this.selectedColor()
    });
  }
}

