import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Emits when admin account verification changes (User Verification, Manage Doctors, etc.)
 * so dashboards and lists can refresh counts without a full reload.
 */
@Injectable({ providedIn: 'root' })
export class VerificationSyncService {
  private readonly changed = new Subject<void>();
  readonly changed$ = this.changed.asObservable();

  notify(): void {
    this.changed.next();
  }
}
