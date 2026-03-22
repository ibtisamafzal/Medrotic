import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

// New-Dashboards design tokens
const DASH_GRID_COLOR = '#e5e7eb';
const DASH_TICK_COLOR = '#6b7280';
const DASH_TOOLTIP_BG = '#ffffff';
const DASH_TOOLTIP_BORDER = '#e5e7eb';

function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith('rgba')) return hex;
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return `rgba(52, 97, 255, ${alpha})`;
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`;
}

/** Create vertical gradient for area charts (New-Dashboards: 5% opacity 0.3 → 95% opacity 0) */
function createAreaGradient(
  ctx: CanvasRenderingContext2D,
  chart: Chart,
  hex: string
): CanvasGradient | string {
  const chartArea = chart.chartArea;
  if (!chartArea) return hexToRgba(hex, 0.15);
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0.05, hexToRgba(hex, 0.3));
  gradient.addColorStop(0.95, hexToRgba(hex, 0));
  return gradient;
}

@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="dashboard-chart-wrap"><canvas #canvas></canvas></div>`,
  styles: [
    `
      .dashboard-chart-wrap {
        position: relative;
        width: 100%;
        min-height: 200px;
        max-height: 280px;
      }
      .dashboard-chart-wrap canvas {
        max-width: 100%;
        height: auto !important;
      }
    `,
  ],
})
export class DashboardChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() type: 'line' | 'bar' | 'doughnut' | 'area' | 'radar' = 'line';
  @Input() labels: string[] = [];
  @Input() data: number[] = [];
  @Input() datasets: { label: string; data: number[]; borderColor?: string; backgroundColor?: string | string[] }[] = [];
  @Input() accentColor = '#3461ff';
  @Input() accentColorSecondary = '#10b981';

  private chart: Chart | null = null;

  /** Whether chart type uses filled line (area-style) with gradient */
  private get isAreaStyle(): boolean {
    return this.type === 'area' || (this.type === 'line' && !this.datasets?.length);
  }

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.chart) return;
    if (changes['type']) this.initChart();
    else if (changes['labels'] || changes['data'] || changes['datasets']) this.updateChart();
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private getConfig(): ChartConfiguration {
    const hasDatasets = this.datasets?.length > 0;
    const labels = this.labels?.length ? this.labels : (this.datasets?.[0]?.data ?? []).map((_, i) => `${i + 1}`);
    const isDoughnut = this.type === 'doughnut';
    const chartType = this.type === 'area' ? 'line' : this.type;
    const isRadar = this.type === 'radar';
    const useAreaGradient = chartType === 'line' || isRadar;

    const defaultColors = [
      this.accentColor,
      this.accentColorSecondary,
      '#f59e0b',
      '#8b5cf6',
      '#06b6d4',
      '#ec4899',
    ];

    const buildDataset = (i: number, label: string, data: number[], borderColor: string, backgroundColor?: string | string[]) => {
      const hex = borderColor.startsWith('#') ? borderColor : this.accentColor;
      const fill = chartType === 'line';
      const bg = useAreaGradient
        ? (ctx: unknown) => {
          const c = (ctx as { chart?: Chart }).chart;
          return c ? createAreaGradient(c.ctx, c, hex) : hexToRgba(hex, 0.15);
        }
        : (isDoughnut
          ? (Array.isArray(backgroundColor) && backgroundColor.length
            ? backgroundColor
            : (data.map((_, segIndex) => defaultColors[segIndex % defaultColors.length]) as string[]))
          : (typeof backgroundColor === 'string' ? backgroundColor : hexToRgba(hex, 0.15)));
      return {
        label,
        data,
        borderColor: isDoughnut ? 'transparent' : borderColor,
        backgroundColor: bg,
        fill,
        tension: 0.35,
        borderWidth: useAreaGradient ? 3 : 2,
        ...(chartType === 'bar' && {
          borderRadius: { topLeft: 8, topRight: 8 },
        }),
      };
    };

    const config: ChartConfiguration = {
      type: chartType,
      data: {
        labels,
        datasets: hasDatasets
          ? this.datasets.map((ds, i) =>
            buildDataset(
              i,
              ds.label,
              ds.data,
              ds.borderColor ?? defaultColors[i % defaultColors.length],
              ds.backgroundColor
            )
          )
          : [
            buildDataset(
              0,
              'Value',
              this.data,
              this.accentColor,
              hexToRgba(this.accentColor, 0.15)
            ),
          ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        animation: { duration: 800 },
        plugins: {
          legend: {
            display: hasDatasets && this.datasets.length > 1,
            position: 'bottom',
            labels: { color: DASH_TICK_COLOR, font: { size: 12 } },
          },
          tooltip: {
            backgroundColor: DASH_TOOLTIP_BG,
            borderColor: DASH_TOOLTIP_BORDER,
            borderWidth: 1,
            cornerRadius: 12,
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            padding: 12,
            boxPadding: 6,
            callbacks: {},
          },
        },
        scales: isDoughnut
          ? {}
          : isRadar
            ? {
              r: {
                ticks: { display: false },
                grid: { color: DASH_GRID_COLOR },
                angleLines: { color: DASH_GRID_COLOR },
                pointLabels: { color: DASH_TICK_COLOR, font: { size: 11 } }
              }
            }
            : {
              x: {
                grid: { color: DASH_GRID_COLOR, borderDash: [3, 3] } as { color: string; borderDash?: number[] },
                ticks: {
                  maxRotation: 45,
                  font: { size: 12 },
                  color: DASH_TICK_COLOR,
                },
              },
              y: {
                beginAtZero: true,
                grid: { color: DASH_GRID_COLOR, borderDash: [3, 3] } as { color: string; borderDash?: number[] },
                ticks: { font: { size: 12 }, color: DASH_TICK_COLOR },
              },
            },
        ...(isDoughnut && { cutout: 58 }),
      },
    };
    return config;
  }

  private initChart(): void {
    const el = this.canvasRef?.nativeElement;
    if (!el) return;
    this.destroyChart();
    this.chart = new Chart(el, this.getConfig());
  }

  private updateChart(): void {
    if (!this.chart) return;
    this.chart.config.data.labels = this.labels?.length
      ? this.labels
      : (this.datasets?.[0]?.data ?? this.data).map((_, i) => `${i + 1}`);
    if (this.datasets?.length) {
      this.datasets.forEach((ds, i) => {
        const target = this.chart!.config.data.datasets?.[i];
        if (target) {
          target.data = ds.data;
          target.label = ds.label;
        }
      });
      if (this.chart.config.data.datasets!.length !== this.datasets.length) {
        this.initChart();
        return;
      }
    } else {
      const d = this.chart.config.data.datasets?.[0];
      if (d) d.data = this.data;
    }
    this.chart.update('none');
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}
