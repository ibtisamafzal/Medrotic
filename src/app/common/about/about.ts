import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-about',
  imports: [Header, Footer, CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  constructor(private navigationService: NavigationService) {}

  navigateToAuthOrDashboard(): void {
    this.navigationService.navigateToAuthOrDashboard();
  }
}
