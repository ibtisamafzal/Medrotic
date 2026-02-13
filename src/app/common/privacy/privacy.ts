import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy',
  imports: [Header, Footer, CommonModule],
  templateUrl: './privacy.html',
  styleUrl: './privacy.scss',
})
export class Privacy {
}
