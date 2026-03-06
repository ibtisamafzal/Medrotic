import {
    Directive,
    ElementRef,
    Input,
    OnInit,
    OnDestroy,
    Renderer2,
    PLATFORM_ID,
    inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * ScrollAnimateDirective
 *
 * Usage:
 *   <div appScrollAnimate>                     <!-- default: fade-up -->
 *   <div appScrollAnimate="fade-left">         <!-- slide from left -->
 *   <div appScrollAnimate="fade-right">        <!-- slide from right -->
 *   <div appScrollAnimate="fade-up">           <!-- slide up (default) -->
 *   <div appScrollAnimate="fade-in">           <!-- pure fade-in -->
 *   <div appScrollAnimate="scale-up">          <!-- scale from smaller -->
 *   <div [animDelay]="200">                    <!-- delay in ms -->
 *   <div [animThreshold]="0.15">              <!-- custom threshold 0-1 -->
 */
@Directive({
    selector: '[appScrollAnimate]',
    standalone: true,
})
export class ScrollAnimateDirective implements OnInit, OnDestroy {
    @Input('appScrollAnimate') animationType: string = 'fade-up';
    @Input() animDelay: number = 0;
    @Input() animThreshold: number = 0.12;

    private observer: IntersectionObserver | null = null;
    private el = inject(ElementRef);
    private renderer = inject(Renderer2);
    private platformId = inject(PLATFORM_ID);

    ngOnInit() {
        if (!isPlatformBrowser(this.platformId)) return;

        // Respect reduced motion preferences
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

        if (prefersReducedMotion) {
            // Just show element immediately without animation
            this.renderer.addClass(this.el.nativeElement, 'anim-visible');
            return;
        }

        const animClass = this.animationType || 'fade-up';
        this.renderer.addClass(this.el.nativeElement, 'anim-hidden');
        this.renderer.addClass(this.el.nativeElement, `anim-${animClass}`);

        if (this.animDelay > 0) {
            this.renderer.setStyle(
                this.el.nativeElement,
                'transition-delay',
                `${this.animDelay}ms`
            );
        }

        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        this.renderer.addClass(this.el.nativeElement, 'anim-visible');
                        this.observer?.unobserve(this.el.nativeElement);
                    }
                });
            },
            { threshold: this.animThreshold, rootMargin: '0px 0px -40px 0px' }
        );

        this.observer.observe(this.el.nativeElement);
    }

    ngOnDestroy() {
        this.observer?.disconnect();
    }
}
