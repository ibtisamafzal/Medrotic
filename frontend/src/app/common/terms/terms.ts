import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms',
  imports: [Header, Footer, CommonModule],
  templateUrl: './terms.html',
  styleUrl: './terms.scss',
})
export class Terms {
}
