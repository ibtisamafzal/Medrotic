import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../services/navigation.service';
import { ScrollAnimateDirective } from '../shared/scroll-animate.directive';

interface FaqItem {
  number: string;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  imports: [Header, Footer, CommonModule, ScrollAnimateDirective],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
})
export class Faq {
  activeFaqIndex: number | null = 0; // Open first item by default

  faqs: FaqItem[] = [
    {
      number: '/01',
      question: 'What Services Do You Currently Offer Patients?',
      answer: 'We offer a range of services tailored to your needs, including personalized treatment plans, wellness consultations, and ongoing support to ensure your health journey is as comfortable and effective as possible.'
    },
    {
      number: '/02',
      question: 'Can I Reschedule My Appointment After Booking?',
      answer: 'Yes, you can reschedule your appointment. Please contact us at least 24 hours before your scheduled appointment time to make changes.'
    },
    {
      number: '/03',
      question: 'What Payment Methods Do You Currently Accept?',
      answer: 'We accept various payment methods including cash, credit cards, debit cards, and digital payment options for your convenience.'
    },
    {
      number: '/04',
      question: 'Do You Offer Emergency Medical Services Too?',
      answer: 'Yes, we provide emergency medical services. Our emergency department is available 24/7 to handle urgent medical situations.'
    },
    {
      number: '/05',
      question: 'Do You Accept All Major Health Insurances?',
      answer: 'We accept most major health insurance plans. Please contact our billing department to verify if your specific insurance plan is accepted.'
    },
    {
      number: '/06',
      question: 'How Long Does a Consultation Usually Take?',
      answer: 'A typical consultation usually takes between 30 to 60 minutes, depending on the complexity of your condition and the type of consultation required.'
    }
  ];

  constructor(private navigationService: NavigationService) { }

  toggleFaq(index: number): void {
    if (this.activeFaqIndex === index) {
      this.activeFaqIndex = null; // Close if already open
    } else {
      this.activeFaqIndex = index; // Open clicked one
    }
  }

  navigateToAuthOrDashboard(): void {
    this.navigationService.navigateToAuthOrDashboard();
  }
}
