import { Component, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../services/navigation.service';
import { ScrollAnimateDirective } from '../shared/scroll-animate.directive';

@Component({
  selector: 'app-services',
  imports: [Header, Footer, CommonModule, ScrollAnimateDirective],
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class Services implements AfterViewInit, OnDestroy {
  @ViewChild('statisticsSection', { static: false }) statisticsSection!: ElementRef;

  // Target values for counters
  targetStats = {
    branches: 26,
    branches2: 26,
    doctors: 53,
    experience: 10
  };

  // Display values (start from 0)
  displayStats = {
    branches: 0,
    branches2: 0,
    doctors: 0,
    experience: 0
  };

  private observer?: IntersectionObserver;
  private animationFrameId?: number;
  private hasAnimated = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private navigationService: NavigationService
  ) { }

  navigateToAuthOrDashboard(): void {
    this.navigationService.navigateToAuthOrDashboard();
  }

  ngAfterViewInit() {
    // Only run in browser environment (not during SSR)
    if (typeof window === 'undefined') {
      return;
    }
    // Use setTimeout to ensure the view is fully initialized
    setTimeout(() => {
      this.setupIntersectionObserver();
    }, 100);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.animationFrameId && typeof window !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
    }
    // Clean up scroll listener
    if (typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }

  private setupIntersectionObserver() {
    // Guard against SSR - only run in browser
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Check if element exists
    if (!this.statisticsSection?.nativeElement) {
      // Retry after a short delay if element not found yet
      setTimeout(() => {
        if (typeof window !== 'undefined' && !this.hasAnimated && this.statisticsSection?.nativeElement) {
          this.setupIntersectionObserver();
        }
      }, 200);
      return;
    }

    if (!window || !('IntersectionObserver' in window)) {
      // For browsers without IntersectionObserver, check if element is in viewport manually
      this.checkIfInViewport();
      // Also listen to scroll events to check when user scrolls
      const win = window as Window;
      if (win && win.addEventListener) {
        win.addEventListener('scroll', this.scrollHandler, { passive: true });
      }
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.hasAnimated) {
            this.hasAnimated = true;
            this.animateCounters();
            // Disconnect observer after animation starts to prevent re-triggering
            if (this.observer) {
              this.observer.disconnect();
            }
          }
        });
      },
      {
        threshold: 0.2, // Trigger when 20% of the section is visible
        rootMargin: '0px' // No margin, trigger exactly when visible
      }
    );

    this.observer.observe(this.statisticsSection.nativeElement);
  }

  private checkIfInViewport() {
    // Manual check for browsers without IntersectionObserver
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const element = this.statisticsSection?.nativeElement;
    if (!element || this.hasAnimated || !element.getBoundingClientRect) return;

    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    // Check if element is visible in viewport (at least 20% visible)
    const elementHeight = rect.height;
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
    const isVisible = visibleHeight > (elementHeight * 0.2) && rect.bottom > 0 && rect.top < windowHeight;

    if (isVisible) {
      this.hasAnimated = true;
      this.animateCounters();
      // Remove scroll listener once animation starts
      if (window.removeEventListener) {
        window.removeEventListener('scroll', this.scrollHandler);
      }
    }
  }

  private scrollHandler = () => {
    if (!this.hasAnimated) {
      this.checkIfInViewport();
    } else {
      // Remove listener if animation has already started
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('scroll', this.scrollHandler);
      }
    }
  }

  private animateCounters() {
    if (typeof window === 'undefined' || !window.requestAnimationFrame) {
      // SSR fallback: set final values immediately
      this.displayStats.branches = this.targetStats.branches;
      this.displayStats.branches2 = this.targetStats.branches2;
      this.displayStats.doctors = this.targetStats.doctors;
      this.displayStats.experience = this.targetStats.experience;
      this.cdr.detectChanges();
      return;
    }

    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      // Update each counter
      this.displayStats.branches = Math.floor(easeOut * this.targetStats.branches);
      this.displayStats.branches2 = Math.floor(easeOut * this.targetStats.branches2);
      this.displayStats.doctors = Math.floor(easeOut * this.targetStats.doctors);
      this.displayStats.experience = Math.floor(easeOut * this.targetStats.experience);

      // Trigger change detection
      this.cdr.detectChanges();

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        // Ensure final values are set
        this.displayStats.branches = this.targetStats.branches;
        this.displayStats.branches2 = this.targetStats.branches2;
        this.displayStats.doctors = this.targetStats.doctors;
        this.displayStats.experience = this.targetStats.experience;
        this.cdr.detectChanges();
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }
}
