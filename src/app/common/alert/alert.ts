import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.html',
  styleUrl: './alert.scss'
})
export class Alert implements OnChanges, OnDestroy {
  @Input() type: AlertType = 'info';
  @Input() message: string = '';
  @Input() show: boolean = false;
  @Input() autoClose: boolean = false;
  @Input() autoCloseDelay: number = 5000;
  @Output() closed = new EventEmitter<void>();

  private autoCloseTimeout: any;

  ngOnChanges() {
    if (this.show && this.autoClose) {
      this.setAutoClose();
    } else {
      this.clearAutoClose();
    }
  }

  ngOnDestroy() {
    this.clearAutoClose();
  }

  close() {
    this.show = false;
    this.clearAutoClose();
    this.closed.emit();
  }

  private setAutoClose() {
    this.clearAutoClose();
    this.autoCloseTimeout = setTimeout(() => {
      this.close();
    }, this.autoCloseDelay);
  }

  private clearAutoClose() {
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
      this.autoCloseTimeout = null;
    }
  }
}

