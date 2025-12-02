import { Injectable, signal } from '@angular/core';

export interface SessionData {
  token: string;
  status: string;
  maskedPhoneNumber: string;
  claimReference: string;
  policyHolder?: string;
  postcodeVerified: boolean;
  twoFactorVerified: boolean;
  remainingPostcodeAttempts: number;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private _session = signal<SessionData | null>(null);
  session = this._session.asReadonly();

  setSession(data: SessionData): void {
    this._session.set(data);
  }

  hasSession(): boolean {
    return this._session() !== null;
  }

  getToken(): string | null {
    return this._session()?.token ?? null;
  }

  updateStatus(status: string): void {
    const current = this._session();
    if (current) {
      this._session.set({ ...current, status });
    }
  }

  clear(): void {
    this._session.set(null);
  }
}

