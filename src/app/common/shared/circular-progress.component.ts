import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Circular progress indicator matching New-Dashboards design */
@Component({
  selector: 'app-circular-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="circular-progress-wrap" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.width]="size" [attr.height]="size" class="circular-progress-svg" viewBox="0 0 100 100">
        <circle
          class="circular-progress-bg"
          [attr.cx]="50"
          [attr.cy]="50"
          [attr.r]="radius"
          [attr.stroke-width]="strokeWidth"
          fill="none"
        />
        <circle
          class="circular-progress-fill"
          [attr.cx]="50"
          [attr.cy]="50"
          [attr.r]="radius"
          [attr.stroke-width]="strokeWidth"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="offset"
          [style.stroke]="color"
          fill="none"
        />
      </svg>
      <div class="circular-progress-content">
        <span *ngIf="value" class="circular-progress-value">{{ value }}</span>
        <span *ngIf="label" class="circular-progress-label">{{ label }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .circular-progress-wrap {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .circular-progress-svg {
        transform: rotate(-90deg);
      }
      .circular-progress-bg {
        stroke: #f3f4f6;
      }
      .circular-progress-fill {
        transition: stroke-dashoffset 1s ease-out;
      }
      .circular-progress-content {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      .circular-progress-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: #001047;
        line-height: 1.2;
      }
      .circular-progress-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #6b7280;
        margin-top: 0.125rem;
      }
    `,
  ],
})
export class CircularProgressComponent {
  @Input() percentage = 0;
  @Input() size = 100;
  @Input() strokeWidth = 8;
  @Input() color = '#3461ff';
  @Input() label = '';
  @Input() value = '';

  get radius(): number {
    return 50 - this.strokeWidth / 2;
  }
  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }
  get offset(): number {
    return this.circumference - (this.percentage / 100) * this.circumference;
  }
}
