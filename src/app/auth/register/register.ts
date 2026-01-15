import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, RegisterPatientRequest } from '../auth.service';
import { Header } from '../../common/header/header';
import { Footer } from '../../common/footer/footer';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Header, Footer],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  name: string = '';
  email: string = '';
  phone: string = '';
  cnic: string = '';
  password: string = '';
  confirmPassword: string = '';
  dateOfBirth: string = '';
  gender: string = '';
  city: string = ''; // Added
  province: string = ''; // Added
  
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  loading: boolean = false;
  error: string = '';
  success: boolean = false;

  eyeOpenIcon = '/assets/images/icons/eye-open-outline.svg';
  eyeOffIcon = '/assets/images/icons/eye-off-outline.svg';

  constructor(
    private authService: AuthService,
    public router: Router
  ) {}

  getMaxDate(): string {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return maxDate.toISOString().split('T')[0];
  }

  onCNICInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.authService.formatCNIC(input.value);
    this.cnic = formatted;
    input.value = formatted;
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    
    if (value.startsWith('92')) {
      value = '+92' + value.substring(2);
    } else if (value.startsWith('0')) {
      value = '+92' + value.substring(1);
    } else if (!value.startsWith('+92')) {
      value = '+92' + value;
    }
    
    if (value.length > 4) {
      value = value.slice(0, 4) + ' ' + value.slice(4);
    }
    if (value.length > 8) {
      value = value.slice(0, 8) + ' ' + value.slice(8);
    }
    
    this.phone = value;
    input.value = value;
  }

  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  validateForm(): boolean {
    this.error = '';

    if (!this.name.trim()) {
      this.error = 'Full name is required';
      return false;
    }

    if (!this.cnic.trim()) {
      this.error = 'CNIC is required for patient registration';
      return false;
    }

    if (!this.authService.validateCNIC(this.cnic)) {
      this.error = 'Please enter a valid CNIC (format: 12345-1234567-1)';
      return false;
    }

    // API requires email
    if (!this.email.trim()) {
      this.error = 'Email is required';
      return false;
    }

    if (!this.authService.validateEmail(this.email)) {
      this.error = 'Please enter a valid email address';
      return false;
    }

    // API requires phoneNumber
    if (!this.phone.trim()) {
      this.error = 'Phone number is required';
      return false;
    }

    if (!this.authService.validatePhone(this.phone)) {
      this.error = 'Please enter a valid phone number';
      return false;
    }

    if (!this.city.trim()) {
      this.error = 'City is required';
      return false;
    }

    if (!this.province.trim()) {
      this.error = 'Province is required';
      return false;
    }

    if (!this.password) {
      this.error = 'Password is required';
      return false;
    }

    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters long';
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(this.password)) {
      this.error = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      return false;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return false;
    }

    if (!this.dateOfBirth) {
      this.error = 'Date of birth is required';
      return false;
    }

    const birthDate = new Date(this.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      this.error = 'You must be at least 18 years old to register';
      return false;
    }

    if (!this.gender) {
      this.error = 'Gender is required';
      return false;
    }

    // Validate gender value
    if (!['Male', 'Female', 'Other'].includes(this.gender)) {
      this.error = 'Gender must be Male, Female, or Other';
      return false;
    }

    return true;
  }

  onRegister(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = false;

    // Format phone number (remove spaces and ensure proper format)
    const phoneNumber = this.phone.replace(/\s/g, '');

    // Format CNIC to 13 digits (remove dashes)
    const cnicDigits = this.cnic.replace(/\D/g, '');
    if (cnicDigits.length !== 13) {
      this.error = 'CNIC must be exactly 13 digits';
      this.loading = false;
      return;
    }

    // Format date of birth to ISO string
    const dateOfBirthISO = new Date(this.dateOfBirth).toISOString();

    const registerRequest: RegisterPatientRequest = {
      fullName: this.name.trim(),
      email: this.email.trim(),
      password: this.password,
      confirmPassword: this.confirmPassword,
      cnic: cnicDigits,
      phoneNumber: phoneNumber,
      dateOfBirth: dateOfBirthISO,
      gender: this.gender as 'Male' | 'Female' | 'Other',
      city: this.city.trim(),
      province: this.province.trim()
    };

    this.authService.register(registerRequest).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        
        // API returns success message, navigate to login
        setTimeout(() => {
          this.router.navigate(['/auth/login'], {
            queryParams: { registered: 'true' }
          });
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || err.error?.Message || 'Registration failed. Please try again.';
        console.error('Registration error:', err);
      }
    });
  }
}