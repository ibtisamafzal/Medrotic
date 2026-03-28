import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  private readonly dialog = inject(ConfirmDialogService);

  readonly state = this.dialog.active;

  cancel(): void {
    this.dialog.respond(false);
  }

  confirm(): void {
    this.dialog.respond(true);
  }

  onBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('confirm-dialog-backdrop')) {
      this.dialog.respond(false);
    }
  }
}
