import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../services/navigation.service';
import { ScrollAnimateDirective } from '../shared/scroll-animate.directive';

@Component({
  selector: 'app-about',
  imports: [Header, Footer, CommonModule, ScrollAnimateDirective],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  constructor(private navigationService: NavigationService) { }

  navigateToAuthOrDashboard(): void {
    this.navigationService.navigateToAuthOrDashboard();
  }
}
