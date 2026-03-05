import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-vercel-analytics',
  standalone: true,
  template: ''
})
export class VercelAnalyticsComponent implements OnInit {
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
          const { inject } = await import('@vercel/analytics');
          inject();
        } catch (error) {
          console.error('Failed to initialize Vercel Analytics:', error);
        }
      });
    }
  }
}
