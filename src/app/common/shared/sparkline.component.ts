import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Lightweight SVG sparkline for metric cards (New-Dashboards style) */
@Component({
  selector: 'app-sparkline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sparkline-wrap" [attr.aria-hidden]="true">
      <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" preserveAspectRatio="none" class="sparkline-svg">
        <polyline
          [attr.points]="points"
          fill="none"
          [attr.stroke]="color"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  `,
  styles: [
    `
      .sparkline-wrap {
        width: 100%;
        height: 48px;
        margin-top: 0.75rem;
      }
      .sparkline-svg {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class SparklineComponent {
  @Input() data: number[] = [];
  @Input() color = '#3461ff';

  width = 120;
  height = 40;

  get points(): string {
    if (!this.data || this.data.length < 2) return '';
    const min = Math.min(...this.data);
    const max = Math.max(...this.data);
    const range = max - min || 1;
    const step = this.width / (this.data.length - 1);
    return this.data
      .map((v, i) => `${i * step},${this.height - ((v - min) / range) * (this.height - 4) - 2}`)
      .join(' ');
  }
}
