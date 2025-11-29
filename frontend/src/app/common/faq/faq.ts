import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faq',
  imports: [Header, Footer, CommonModule],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
})
export class Faq {

}
