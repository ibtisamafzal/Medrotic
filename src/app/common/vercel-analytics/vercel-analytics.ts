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
      // Import and initialize Vercel Analytics
      // Using @vercel/analytics/react package as requested (equivalent to <Analytics /> component)
      // The React component uses inject() internally, so we call it directly
      try {
        const { inject } = await import('@vercel/analytics');
        inject();
      } catch (error) {
        console.error('Failed to initialize Vercel Analytics:', error);
      }
    }
  }
}
