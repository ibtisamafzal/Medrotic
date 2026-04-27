import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { ContactService, ContactFormData, ContactResponse } from '../../services/contact.service';
import { NavigationService } from '../../services/navigation.service';
import { ScrollAnimateDirective } from '../shared/scroll-animate.directive';
import { PakInputFormatDirective } from '../shared/pak-input-format.directive';

@Component({
  selector: 'app-contact',
  imports: [CommonModule, ReactiveFormsModule, Header, Footer, ScrollAnimateDirective, PakInputFormatDirective],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact implements OnInit {
  contactForm!: FormGroup;
  isLoading = false;
  showSuccess = false;
  showError = false;
  errorMessage = '';
  successMessage = 'Thank you for contacting us! We will get back to you soon.';

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private navigationService: NavigationService
  ) { }

  navigateToAuthOrDashboard(): void {
    this.navigationService.navigateToAuthOrDashboard();
  }

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^(?:\+92[-\s]?)?3\d{2}[-\s]?\d{7}$|^03\d{2}[-\s]?\d{7}$/)]],
      email: ['', [Validators.required, Validators.email]],
      queryType: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  get f() {
    return this.contactForm.controls;
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.showSuccess = false;
    this.showError = false;

    const formData: ContactFormData = {
      fullName: this.contactForm.value.fullName,
      phoneNumber: this.contactForm.value.phoneNumber,
      email: this.contactForm.value.email,
      queryType: this.contactForm.value.queryType,
      message: this.contactForm.value.message,
    };

    this.contactService.submitContactForm(formData).subscribe({
      next: (response: ContactResponse) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Message sent. We will contact you soon.';
        this.showSuccess = true;
        this.contactForm.reset();
        this.resetFormState();

        setTimeout(() => {
          this.showSuccess = false;
        }, 5000);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = this.getSubmitErrorMessage(error);

        setTimeout(() => {
          this.showError = false;
        }, 5000);
      },
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach((key) => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
  }

  private resetFormState(): void {
    Object.keys(this.contactForm.controls).forEach((key) => {
      const control = this.contactForm.get(key);
      control?.markAsUntouched();
      control?.markAsPristine();
    });
  }

  private getSubmitErrorMessage(error: HttpErrorResponse): string {
    const apiMessage = this.extractApiErrorMessage(error);
    if (apiMessage) {
      return apiMessage;
    }

    if (error.status === 0) {
      return 'Connection issue. Please try again.';
    }

    if (error.status >= 500) {
      return 'Could not send your message. Please try again.';
    }

    if (error.status === 400) {
      return 'Please check your details and try again.';
    }

    return 'Could not send your message. Please try again.';
  }

  private extractApiErrorMessage(error: HttpErrorResponse): string | null {
    const errorBody = error.error;

    if (error.status >= 500) {
      return null;
    }

    if (typeof errorBody === 'string' && errorBody.trim()) {
      return errorBody.trim();
    }

    if (errorBody && typeof errorBody === 'object' && typeof errorBody.message === 'string') {
      const message = errorBody.message.trim();
      return message || null;
    }

    return null;
  }

  getFieldError(fieldName: string): string {
    const control = this.contactForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    if (control?.hasError('pattern')) {
      return 'Please enter a valid phone number';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      fullName: 'Full Name',
      phoneNumber: 'Phone Number',
      email: 'Email',
      queryType: 'Query Type',
      message: 'Message',
    };

    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.contactForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
