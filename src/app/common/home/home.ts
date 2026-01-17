import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-home',
  imports: [Header, Footer, CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  constructor(private navigationService: NavigationService) {}

  navigateToAuthOrDashboard(): void {
    this.navigationService.navigateToAuthOrDashboard();
  }

  heroAssets = {
    leftShape: '/images/hero/hero-left-shape.png',
    rightShape: '/images/hero/hero-right-shape.png',
    heroDoctor: '/images/hero/hero-doctor.png',
    virtualMain: '/images/hero/virtual-consultation-main.svg',
    virtualOverlay: '/images/hero/virtual-consultation-overlay.svg',
  };

  sponsorLogos = [
    { src: '/images/sponsors/client-logo-1.svg', alt: 'Client 1' },
    { src: '/images/sponsors/client-logo-2.svg', alt: 'Client 2' },
    { src: '/images/sponsors/client-logo-3.svg', alt: 'Client 3' },
    { src: '/images/sponsors/client-logo-4.svg', alt: 'Client 4' },
    { src: '/images/sponsors/client-logo-5.svg', alt: 'Client 5' },
  ];

  collaboration = {
    image: '/images/collaboration/collaboration-image.png',
    title: 'Our system makes it easy for healthcare professionals to share and collaborate on patient care.',
    copy: 'Care teams stay synced inside a single workspace with real-time updates, transparent notes, and context-rich threads.',
    cta: 'Try It Now',
  };

  differenceStats = [
    { value: '200+', label: 'Patient Served Every Day' },
    { value: '1000+', label: 'Medical Team Around the World' },
  ];

  commitments = [
    {
      title: '25+ Years Experience',
      copy: 'Our system makes it easy for healthcare professionals to share and collaborate on patient care.',
      icon: '/images/icons/icon-experience.svg',
    },
    {
      title: 'Fast Process, Best Result',
      copy: 'Automated routing and structured workflows reduce manual work so teams can focus on outcomes.',
      icon: '/images/icons/icon-fast-process.svg',
    },
    {
      title: 'Professional Medical Team',
      copy: 'Coordinated specialists work together with shared insights to deliver consistent, high-touch care.',
      icon: '/images/icons/icon-medical-team.svg',
    },
  ];

  workflowImage = '/images/workflow/workflow-visual.png';

  workflowSteps = [
    {
      title: 'Discovery',
      copy: 'We meet with you to learn about your business, your goals, and your target audience.',
      icon: '/images/icons/icon-discovery.svg',
    },
    {
      title: 'Strategy',
      copy: 'We develop a customized strategy that is based on your unique needs and goals.',
      icon: '/images/icons/icon-strategy.svg',
    },
    {
      title: 'Execution',
      copy: 'We execute our strategy using the latest digital tools and techniques.',
      icon: '/images/icons/icon-execution.svg',
    },
    {
      title: 'Measurement',
      copy: 'We track the results of our campaigns so that we can make adjustments as needed.',
      icon: '/images/icons/icon-measurement.svg',
    },
  ];

  testimonials = [
    {
      quote: '"From the moment I walked in I felt welcomed and well cared for. The doctors and nurses were incredibly attentive, and I\'m so grateful for their expertise."',
      author: 'Adnan Tariq',
      role: 'Product Designer',
      avatar: '/images/testimonials/testimonial-avatar.svg',
      sideImage: '/images/testimonials/testimonial-side-1.png',
    },
    {
      quote: '"Medrotic has transformed how I manage my health. The platform is intuitive, and the medical team is always available when I need them. Highly recommended!"',
      author: 'Sarah Johnson',
      role: 'Marketing Manager',
      avatar: '/images/testimonials/testimonial-avatar.svg',
      sideImage: '/images/testimonials/testimonial-side-2.png',
    },
    {
      quote: '"As someone with a busy schedule, Medrotic\'s flexible appointment system and virtual consultations have been a lifesaver. The care quality never compromises."',
      author: 'Michael Chen',
      role: 'Software Engineer',
      avatar: '/images/testimonials/testimonial-avatar.svg',
      sideImage: '/images/testimonials/testimonial-side-3.png',
    },
    {
      quote: '"I\'ve been using Medrotic for over a year now, and the experience has been outstanding. The doctors are knowledgeable, caring, and always take time to listen."',
      author: 'Emily Rodriguez',
      role: 'Business Analyst',
      avatar: '/images/testimonials/testimonial-avatar.svg',
      sideImage: '/images/testimonials/testimonial-side-4.png',
    },
  ];

  currentTestimonialIndex = 0;

  testimonialAssets = {
    quoteIcon: '/images/testimonials/testimonial-quote-icon.svg',
    prevArrow: '/images/testimonials/testimonial-prev-arrow.svg',
    nextArrow: '/images/testimonials/testimonial-next-arrow.svg',
  };

  get currentTestimonial() {
    return this.testimonials[this.currentTestimonialIndex];
  }

  get paginationNumbers() {
    return this.testimonials.map((_, index) => 
      String(index + 1).padStart(2, '0')
    );
  }

  get activePaginationIndex() {
    return String(this.currentTestimonialIndex + 1).padStart(2, '0');
  }

  previousTestimonial() {
    this.currentTestimonialIndex = 
      this.currentTestimonialIndex === 0 
        ? this.testimonials.length - 1 
        : this.currentTestimonialIndex - 1;
  }

  nextTestimonial() {
    this.currentTestimonialIndex = 
      this.currentTestimonialIndex === this.testimonials.length - 1 
        ? 0 
        : this.currentTestimonialIndex + 1;
  }

  goToTestimonial(index: number) {
    if (index >= 0 && index < this.testimonials.length) {
      this.currentTestimonialIndex = index;
    }
  }
}
