import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { AlertType } from '../common/alert/alert';

export interface AlertMessage {
  type: AlertType;
  message: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new Subject<AlertMessage>();
  public alert$: Observable<AlertMessage> = this.alertSubject.asObservable();

  show(type: AlertType, message: string, autoClose: boolean = true, autoCloseDelay: number = 5000) {
    this.alertSubject.next({ type, message, autoClose, autoCloseDelay });
  }

  success(message: string, autoClose: boolean = true) {
    this.show('success', message, autoClose);
  }

  error(message: string, autoClose: boolean = true) {
    this.show('error', message, autoClose);
  }

  warning(message: string, autoClose: boolean = true) {
    this.show('warning', message, autoClose);
  }

  info(message: string, autoClose: boolean = true) {
    this.show('info', message, autoClose);
  }
}

