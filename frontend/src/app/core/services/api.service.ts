import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getSession(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/session/${token}`);
  }

  verifyPostcode(token: string, postcode: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/session/${token}/verify-postcode`, { postcode });
  }

  sendCode(token: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/session/${token}/send-code`, {});
  }

  verifyCode(token: string, code: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/session/${token}/verify-code`, { code });
  }

  getDocument(token: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/session/${token}/document`, { responseType: 'blob' });
  }

  getSignedPreview(token: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/session/${token}/signed-preview`, { responseType: 'blob' });
  }

  signDocument(token: string, signature: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/session/${token}/sign`, signature);
  }

  submitDocument(token: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/session/${token}/submit`, {});
  }

  downloadDocument(token: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/session/${token}/download`, { responseType: 'blob' });
  }
}
