import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gdpr-compliance',
  imports: [Header, Footer, CommonModule],
  templateUrl: './gdpr-compliance.html',
  styleUrl: './gdpr-compliance.scss',
})
export class GdprCompliance {
}
