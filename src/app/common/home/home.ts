import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [Header, Footer, CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  heroAssets = {
    leftShape: '/images/hero/hero-left-shape.png',
    rightShape: '/images/hero/hero-right-shape.png',
    heroDoctor: '/images/hero/hero-doctor.png',
    virtualMain: '/images/hero/virtual-consultation-main.svg',
    virtualOverlay: '/images/hero/virtual-consultation-overlay.svg',
  };

  sponsorLogos = [
    { src: '/images/sponsors/sponsor-spotify.svg', alt: 'Spotify' },
    { src: '/images/sponsors/sponsor-google.svg', alt: 'Google' },
    { src: '/images/sponsors/sponsor-uber.svg', alt: 'Uber' },
    { src: '/images/sponsors/sponsor-microsoft.svg', alt: 'Microsoft' },
    { src: '/images/sponsors/sponsor-shopify.svg', alt: 'Shopify' },
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

  testimonial = {
    quote: '"From the moment I walked in I felt welcomed and well cared for. The doctors and nurses were incredibly attentive, and I\'m so grateful for their expertise."',
    author: 'Adnan Tariq',
    role: 'Product Designer',
    avatar: '/images/testimonials/testimonial-avatar.svg',
    quoteIcon: '/images/testimonials/testimonial-quote-icon.svg',
    prevArrow: '/images/testimonials/testimonial-prev-arrow.svg',
    nextArrow: '/images/testimonials/testimonial-next-arrow.svg',
    pagination: ['01', '02', '03', '04'],
    activeIndex: '03',
  };
}
