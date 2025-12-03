import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Session {
  token: string;
  claimReference: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  postcodeVerified: boolean;
  twoFactorVerified: boolean;
  signedAt: string | null;
  submittedAt: string | null;
  signingUrl: string;
}

interface UploadResponse {
  success: boolean;
  token: string;
  signingUrl: string;
  claimReference: string;
  documentId: string;
  postcode: string;
  expiresAt: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 page-transition">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 mb-6">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold text-white">🔒 Admin Panel</h1>
              <p class="text-purple-200">Document Signing Administration</p>
            </div>
            @if (isLoggedIn()) {
              <button 
                (click)="logout()" 
                class="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors">
                Logout
              </button>
            }
          </div>
        </div>

        @if (!isLoggedIn()) {
          <!-- Login Form -->
          <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md mx-auto">
            <h2 class="text-xl font-bold text-white mb-6 text-center">Admin Login</h2>
            
            <div class="space-y-4">
              <div>
                <label class="text-sm text-purple-200 mb-2 block">Password</label>
                <input
                  type="password"
                  [(ngModel)]="password"
                  (keyup.enter)="login()"
                  placeholder="Enter admin password"
                  class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
              </div>
              
              @if (loginError()) {
                <p class="text-red-400 text-sm">{{ loginError() }}</p>
              }
              
              <button
                (click)="login()"
                [disabled]="!password"
                class="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50">
                Login
              </button>
            </div>
          </div>
        } @else {
          <!-- Admin Dashboard -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Upload Document -->
            <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
              <h2 class="text-xl font-bold text-white mb-4">📄 Upload Document</h2>
              
              <div class="space-y-4">
                <div>
                  <label class="text-sm text-purple-200 mb-2 block">PDF Document *</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    (change)="onFileSelected($event)"
                    class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-purple-500 file:text-white file:cursor-pointer">
                </div>
                
                <div>
                  <label class="text-sm text-purple-200 mb-2 block">Policy Holder Name</label>
                  <input
                    type="text"
                    [(ngModel)]="policyHolder"
                    placeholder="John Smith"
                    class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                  <label class="text-sm text-purple-200 mb-2 block">Postcode (for verification)</label>
                  <input
                    type="text"
                    [(ngModel)]="postcode"
                    placeholder="SW1A 1AA"
                    class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                  <label class="text-sm text-purple-200 mb-2 block">Phone Number (for 2FA)</label>
                  <input
                    type="text"
                    [(ngModel)]="phoneNumber"
                    placeholder="+447123456789"
                    class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                </div>
                
                <button
                  (click)="uploadDocument()"
                  [disabled]="!selectedFile || uploading()"
                  class="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50">
                  @if (uploading()) {
                    <span class="flex items-center justify-center">
                      <span class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                      Uploading...
                    </span>
                  } @else {
                    Upload & Generate Token
                  }
                </button>
              </div>
              
              @if (lastUpload()) {
                <div class="mt-4 p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                  <h3 class="font-semibold text-green-300 mb-2">✅ Document Uploaded!</h3>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-purple-200">Token:</span>
                      <span class="text-white font-mono text-xs">{{ lastUpload()!.token }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-purple-200">Postcode:</span>
                      <span class="text-white">{{ lastUpload()!.postcode }}</span>
                    </div>
                    <div class="mt-3">
                      <label class="text-purple-200 text-xs">Signing URL:</label>
                      <div class="flex gap-2 mt-1">
                        <input 
                          type="text" 
                          [value]="lastUpload()!.signingUrl" 
                          readonly 
                          class="flex-1 px-2 py-1 bg-slate-800 rounded text-xs text-white font-mono">
                        <button 
                          (click)="copyToClipboard(lastUpload()!.signingUrl)" 
                          class="px-3 py-1 bg-purple-500 rounded text-xs text-white hover:bg-purple-600">
                          Copy
                        </button>
                        <a 
                          [href]="lastUpload()!.signingUrl" 
                          target="_blank" 
                          class="px-3 py-1 bg-blue-500 rounded text-xs text-white hover:bg-blue-600">
                          Open
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
            
            <!-- Sessions List -->
            <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-white">📋 Signing Sessions</h2>
                <button 
                  (click)="loadSessions()" 
                  class="px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-600 text-sm">
                  Refresh
                </button>
              </div>
              
              @if (loadingSessions()) {
                <div class="flex justify-center py-8">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              } @else if (sessions().length === 0) {
                <p class="text-purple-200 text-center py-8">No sessions found</p>
              } @else {
                <div class="space-y-3 max-h-96 overflow-y-auto">
                  @for (session of sessions(); track session.token) {
                    <div class="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div class="flex justify-between items-start mb-2">
                        <span class="font-mono text-xs text-purple-300">{{ session.token.substring(0, 20) }}...</span>
                        <span [class]="getStatusClass(session.status)" class="text-xs px-2 py-1 rounded">
                          {{ session.status }}
                        </span>
                      </div>
                      <div class="text-xs text-slate-400 space-y-1">
                        <div>Claim: {{ session.claimReference }}</div>
                        <div>Created: {{ session.createdAt | date:'short' }}</div>
                        @if (session.signedAt) {
                          <div class="text-green-400">Signed: {{ session.signedAt | date:'short' }}</div>
                        }
                      </div>
                      <div class="flex gap-2 mt-2">
                        <button 
                          (click)="copyToClipboard(session.signingUrl)" 
                          class="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs hover:bg-purple-500/30">
                          Copy URL
                        </button>
                        <a 
                          [href]="session.signingUrl" 
                          target="_blank" 
                          class="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs hover:bg-blue-500/30">
                          Open
                        </a>
                        <button 
                          (click)="deleteSession(session.token)" 
                          class="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs hover:bg-red-500/30">
                          Delete
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class AdminComponent {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  isLoggedIn = signal(false);
  loginError = signal<string | null>(null);
  password = '';
  
  selectedFile: File | null = null;
  policyHolder = '';
  postcode = '';
  phoneNumber = '';
  uploading = signal(false);
  lastUpload = signal<UploadResponse | null>(null);
  
  sessions = signal<Session[]>([]);
  loadingSessions = signal(false);

  login() {
    this.loginError.set(null);
    this.http.post<any>(`${this.baseUrl}/admin/login`, { password: this.password }).subscribe({
      next: () => {
        this.isLoggedIn.set(true);
        this.loadSessions();
      },
      error: () => {
        this.loginError.set('Invalid password');
      }
    });
  }

  logout() {
    this.isLoggedIn.set(false);
    this.password = '';
    this.sessions.set([]);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  uploadDocument() {
    if (!this.selectedFile) return;
    
    this.uploading.set(true);
    const formData = new FormData();
    formData.append('password', this.password);
    formData.append('document', this.selectedFile);
    if (this.policyHolder) formData.append('policyHolder', this.policyHolder);
    if (this.postcode) formData.append('postcode', this.postcode);
    if (this.phoneNumber) formData.append('phoneNumber', this.phoneNumber);

    this.http.post<UploadResponse>(`${this.baseUrl}/admin/upload-document`, formData).subscribe({
      next: (response) => {
        this.uploading.set(false);
        this.lastUpload.set(response);
        this.loadSessions();
        // Reset form
        this.selectedFile = null;
        this.policyHolder = '';
        this.postcode = '';
        this.phoneNumber = '';
      },
      error: (err) => {
        this.uploading.set(false);
        alert('Upload failed: ' + (err.error?.error || 'Unknown error'));
      }
    });
  }

  loadSessions() {
    this.loadingSessions.set(true);
    this.http.get<Session[]>(`${this.baseUrl}/admin/sessions?password=${this.password}`).subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.loadingSessions.set(false);
      },
      error: () => {
        this.loadingSessions.set(false);
      }
    });
  }

  deleteSession(token: string) {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    this.http.delete(`${this.baseUrl}/admin/sessions/${token}?password=${this.password}`).subscribe({
      next: () => {
        this.loadSessions();
      }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // Could show a toast notification here
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Completed': return 'bg-green-500/20 text-green-300';
      case 'Preview': return 'bg-blue-500/20 text-blue-300';
      case 'Pending': return 'bg-yellow-500/20 text-yellow-300';
      case 'Expired': return 'bg-red-500/20 text-red-300';
      default: return 'bg-slate-500/20 text-slate-300';
    }
  }
}

