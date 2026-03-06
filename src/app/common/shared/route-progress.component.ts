import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    inject,
    PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-route-progress',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="route-progress-bar" [class.visible]="visible" [class.complete]="complete">
      <div class="route-progress-fill" [style.width.%]="progress"></div>
    </div>
  `,
    styles: [`
    .route-progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .route-progress-bar.visible {
      opacity: 1;
    }

    .route-progress-bar.complete {
      opacity: 0;
      transition: opacity 0.4s ease 0.15s;
    }

    .route-progress-fill {
      height: 100%;
      background: var(--progress-bg, linear-gradient(90deg, #3461ff 0%, #6b8eff 60%, #a5bdff 100%));
      border-radius: 0 3px 3px 0;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--progress-shadow, 0 0 8px rgba(52, 97, 255, 0.6));
    }
  `],
})
export class RouteProgressComponent implements OnInit, OnDestroy {
    progress = 0;
    visible = false;
    complete = false;

    private sub?: Subscription;
    private timer?: ReturnType<typeof setInterval>;
    private cdr = inject(ChangeDetectorRef);
    private router = inject(Router);
    private platformId = inject(PLATFORM_ID);

    ngOnInit() {
        if (!isPlatformBrowser(this.platformId)) return;

        this.sub = this.router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
                this.start();
            } else if (
                event instanceof NavigationEnd ||
                event instanceof NavigationCancel ||
                event instanceof NavigationError
            ) {
                this.finish();
            }
        });
    }

    private start() {
        this.complete = false;
        this.visible = true;
        this.progress = 10;
        this.cdr.markForCheck();

        // Simulate incremental progress
        this.timer = setInterval(() => {
            if (this.progress < 85) {
                this.progress += Math.random() * 8;
                this.cdr.markForCheck();
            }
        }, 180);
    }

    private finish() {
        clearInterval(this.timer);
        this.progress = 100;
        this.cdr.markForCheck();

        setTimeout(() => {
            this.complete = true;
            this.cdr.markForCheck();

            setTimeout(() => {
                this.visible = false;
                this.progress = 0;
                this.complete = false;
                this.cdr.markForCheck();
            }, 600);
        }, 150);
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
        clearInterval(this.timer);
    }
}
