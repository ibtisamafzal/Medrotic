import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Use destructive styling (e.g. delete). */
  danger?: boolean;
}

type ActiveConfirm = ConfirmDialogOptions & {
  confirmText: string;
  cancelText: string;
  danger: boolean;
  resolve: (value: boolean) => void;
};

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly _active = signal<ActiveConfirm | null>(null);
  readonly active = this._active.asReadonly();

  /**
   * Shows the global confirm modal. Resolves `true` if the user confirms, `false` if cancelled or dismissed.
   */
  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this._active.set({
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? 'Confirm',
        cancelText: options.cancelText ?? 'Cancel',
        danger: !!options.danger,
        resolve,
      });
    });
  }

  respond(result: boolean): void {
    const cur = this._active();
    if (cur) {
      cur.resolve(result);
      this._active.set(null);
    }
  }
}
