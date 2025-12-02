import { Component, ElementRef, ViewChild, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignatureData } from '../../core/services/session.service';

@Component({
  selector: 'app-image-signature',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <p class="text-sm text-gray-600">
        Upload an image of your signature. We'll automatically remove the background.
      </p>

      <!-- Upload Area -->
      <div 
        class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        (click)="fileInput.click()"
        (dragover)="onDragOver($event)"
        (drop)="onDrop($event)">
        
        @if (!previewUrl()) {
          <div class="space-y-2">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <p class="text-gray-600">
              <span class="text-blue-600 font-medium">Click to upload</span> or drag and drop
            </p>
            <p class="text-xs text-gray-500">PNG, JPG, GIF or WebP (max 5MB)</p>
          </div>
        } @else {
          <div class="space-y-4">
            <p class="text-sm font-medium text-gray-700">Original Image</p>
            <img [src]="previewUrl()" alt="Original signature" class="max-h-32 mx-auto" />
          </div>
        }
      </div>

      <input 
        #fileInput
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        class="hidden"
        (change)="onFileSelected($event)" />

      <!-- Processed Preview -->
      @if (processedUrl()) {
        <div class="space-y-2">
          <p class="text-sm font-medium text-gray-700">Processed Signature (Background Removed)</p>
          <div class="border-2 border-gray-200 rounded-lg p-4 bg-white">
            <img [src]="processedUrl()" alt="Processed signature" class="max-h-24 mx-auto" />
          </div>
        </div>
      }

      <!-- Error Message -->
      @if (error()) {
        <div class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {{ error() }}
        </div>
      }

      <!-- Processing Indicator -->
      @if (processing()) {
        <div class="flex items-center justify-center space-x-2 text-gray-600">
          <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <span>Processing image...</span>
        </div>
      }

      <!-- Hidden canvas for processing -->
      <canvas #processCanvas class="hidden"></canvas>
    </div>
  `
})
export class ImageSignatureComponent {
  @ViewChild('processCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  signatureChange = output<SignatureData | null>();

  previewUrl = signal<string | null>(null);
  processedUrl = signal<string | null>(null);
  processing = signal(false);
  error = signal<string | null>(null);

  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  private async processFile(file: File) {
    this.error.set(null);
    this.processedUrl.set(null);
    this.signatureChange.emit(null);

    // Validate file type
    if (!this.acceptedTypes.includes(file.type)) {
      this.error.set('Invalid file type. Please upload a PNG, JPG, GIF, or WebP image.');
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.error.set('File too large. Maximum size is 5MB.');
      return;
    }

    this.processing.set(true);

    try {
      // Load image
      const imageUrl = await this.readFileAsDataUrl(file);
      this.previewUrl.set(imageUrl);

      // Process image (remove background)
      const processedUrl = await this.removeBackground(imageUrl);
      this.processedUrl.set(processedUrl);

      // Emit signature data
      this.signatureChange.emit({
        method: 'Image',
        imageDataBase64: processedUrl,
        color: '#000000'
      });
    } catch (err) {
      this.error.set('Failed to process image. Please try another file.');
      console.error('Image processing error:', err);
    } finally {
      this.processing.set(false);
    }
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async removeBackground(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = this.canvasRef.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple threshold-based background removal
        // This works best with signatures on white/light backgrounds
        const threshold = 240; // Pixels lighter than this become transparent

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Calculate brightness
          const brightness = (r + g + b) / 3;
          
          // Make light pixels transparent
          if (brightness > threshold) {
            data[i + 3] = 0; // Alpha channel
          }
        }

        // Put processed data back
        ctx.putImageData(imageData, 0, 0);

        // Export as PNG
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  clear() {
    this.previewUrl.set(null);
    this.processedUrl.set(null);
    this.error.set(null);
    this.signatureChange.emit(null);
  }
}

