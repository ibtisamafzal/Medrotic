import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-vercel-speed-insights',
  standalone: true,
  template: ''
})
export class VercelSpeedInsightsComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const runWhenIdle = (cb: () => void) => {
        const w = window as unknown as {
          requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => void;
        };
        if (w.requestIdleCallback) return w.requestIdleCallback(cb, { timeout: 2500 });
        return window.setTimeout(cb, 1500);
      };

      runWhenIdle(async () => {
        try {
          const { injectSpeedInsights } = await import('@vercel/speed-insights');
          injectSpeedInsights();
        } catch (error) {
          console.error('Failed to initialize Vercel Speed Insights:', error);
        }
      });
    }
  }
}
