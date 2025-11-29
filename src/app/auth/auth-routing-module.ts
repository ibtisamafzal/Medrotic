import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { Register } from './register/register';
import { ForgotPassword } from './forgot-password/forgot-password';
import { VerifyOTP } from './verify-otp/verify-otp';
import { ResetPassword } from './reset-password/reset-password';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: Register
  },
  {
    path: 'forgot-password',
    component: ForgotPassword
  },
  {
    path: 'verify-otp',
    component: VerifyOTP
  },
  {
    path: 'reset-password',
    component: ResetPassword
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
