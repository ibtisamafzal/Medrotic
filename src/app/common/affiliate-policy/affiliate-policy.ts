import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-affiliate-policy',
  imports: [Header, Footer, CommonModule],
  templateUrl: './affiliate-policy.html',
  styleUrl: './affiliate-policy.scss',
})
export class AffiliatePolicy {
}
