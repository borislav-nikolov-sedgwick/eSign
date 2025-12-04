import { Component, signal, output, effect, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignatureData } from '../../core/services/session.service';

interface FontOption {
  name: string;
  family: string;
  displayName: string;
}

interface ColorOption {
  name: string;
  value: string;
  displayName: string;
}

@Component({
  selector: 'app-type-signature',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Name Input -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Enter your name
        </label>
        <input 
          type="text"
          [(ngModel)]="typedName"
          (ngModelChange)="onNameChange($event)"
          placeholder="e.g. John Smith"
          maxlength="100"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg" />
      </div>

      <!-- Font Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Choose a style
        </label>
        <div class="grid grid-cols-3 gap-3">
          @for (font of fonts; track font.name) {
            <button 
              (click)="selectFont(font)"
              class="p-3 border-2 rounded-lg transition-colors text-center"
              [class]="selectedFont().name === font.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'">
              <span [style.font-family]="font.family" class="text-xl">
                {{ typedName() || 'Preview' }}
              </span>
              <span class="block text-xs text-gray-500 mt-1">{{ font.displayName }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Color Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Choose a color
        </label>
        <div class="flex gap-3">
          @for (color of colors; track color.name) {
            <button 
              (click)="selectColor(color)"
              class="w-12 h-12 rounded-full border-4 transition-transform hover:scale-110"
              [style.background-color]="color.value"
              [class]="selectedColor().name === color.name ? 'border-gray-800 scale-110' : 'border-transparent'"
              [attr.aria-label]="color.displayName">
            </button>
          }
        </div>
      </div>

      <!-- Preview -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Preview
        </label>
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-white min-h-[100px] flex items-center justify-center">
          @if (typedName()) {
            <span 
              [style.font-family]="selectedFont().family"
              [style.color]="selectedColor().value"
              class="text-4xl">
              {{ typedName() }}
            </span>
          } @else {
            <span class="text-gray-400">Your signature will appear here</span>
          }
        </div>
      </div>

      <!-- Hidden canvas for export -->
      <canvas #signatureCanvas class="hidden"></canvas>
    </div>
  `
})
export class TypeSignatureComponent implements AfterViewInit {
  @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  signatureChange = output<SignatureData | null>();

  typedName = signal('');
  selectedFont = signal<FontOption>(this.fonts[0]);
  selectedColor = signal<ColorOption>(this.colors[0]);

  fonts: FontOption[] = [
    { name: 'dancing', family: '"Dancing Script", cursive', displayName: 'Elegant' },
    { name: 'great-vibes', family: '"Great Vibes", cursive', displayName: 'Classic' },
    { name: 'pacifico', family: '"Pacifico", cursive', displayName: 'Casual' }
  ];

  colors: ColorOption[] = [
    { name: 'black', value: '#000000', displayName: 'Black' },
    { name: 'blue', value: '#0000FF', displayName: 'Blue' },
    { name: 'red', value: '#FF0000', displayName: 'Red' }
  ];

  constructor() {
    effect(() => {
      const name = this.typedName();
      const font = this.selectedFont();
      const color = this.selectedColor();
      
      if (name && this.canvasRef) {
        this.emitSignature();
      } else {
        this.signatureChange.emit(null);
      }
    });
  }

  ngAfterViewInit() {
    // Initial emit if there's already a name
    if (this.typedName()) {
      this.emitSignature();
    }
  }

  onNameChange(name: string) {
    this.typedName.set(name);
  }

  selectFont(font: FontOption) {
    this.selectedFont.set(font);
  }

  selectColor(color: ColorOption) {
    this.selectedColor.set(color);
  }

  private emitSignature() {
    const name = this.typedName();
    if (!name || !this.canvasRef) {
      this.signatureChange.emit(null);
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 100;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw text
    const font = this.selectedFont();
    const color = this.selectedColor();
    
    ctx.font = `48px ${font.family}`;
    ctx.fillStyle = color.value;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, canvas.width / 2, canvas.height / 2);

    // Export to base64
    const imageData = canvas.toDataURL('image/png');

    this.signatureChange.emit({
      method: 'Type',
      imageDataBase64: imageData,
      typedText: name,
      fontFamily: font.name,
      color: color.value
    });
  }
}

