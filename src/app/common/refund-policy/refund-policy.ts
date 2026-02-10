import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-refund-policy',
  imports: [Header, Footer, CommonModule],
  templateUrl: './refund-policy.html',
  styleUrl: './refund-policy.scss',
})
export class RefundPolicy {
}
