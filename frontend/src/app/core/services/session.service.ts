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

const SESSION_STORAGE_KEY = 'esign_session';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private _session = signal<SessionData | null>(null);
  session = this._session.asReadonly();

  constructor() {
    // Restore session from storage on initialization
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as SessionData;
        this._session.set(data);
      }
    } catch {
      // Ignore parse errors
    }
  }

  setSession(data: SessionData): void {
    this._session.set(data);
    // Persist to session storage
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
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
      const updated = { ...current, status };
      this._session.set(updated);
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
    }
  }

  updateSession(partial: Partial<SessionData>): void {
    const current = this._session();
    if (current) {
      const updated = { ...current, ...partial };
      this._session.set(updated);
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
    }
  }

  clear(): void {
    this._session.set(null);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }
}
