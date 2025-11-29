import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { routes } from './auth-routing-module';

// Import standalone components
import { LoginComponent } from './login/login';
import { Register } from './register/register';
import { ForgotPassword } from './forgot-password/forgot-password';
import { VerifyOTP } from './verify-otp/verify-otp';
import { ResetPassword } from './reset-password/reset-password';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    // Standalone components are imported here
    LoginComponent,
    Register,
    ForgotPassword,
    VerifyOTP,
    ResetPassword
  ]
})
export class AuthModule { }
