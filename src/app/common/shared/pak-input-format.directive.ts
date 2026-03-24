import { Directive, ElementRef, HostListener, Input } from '@angular/core';

type PkInputFormatType = 'cnic' | 'phone' | 'license';

@Directive({
  selector: '[pkInputFormat]',
  standalone: true
})
export class PakInputFormatDirective {
  @Input() pkInputFormat: PkInputFormatType = 'phone';

  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('input')
  onInput(): void {
    this.applyFormatting();
  }

  @HostListener('blur')
  onBlur(): void {
    this.applyFormatting();
  }

  private applyFormatting(): void {
    const input = this.el.nativeElement;
    const raw = input.value ?? '';
    let formatted = raw;

    if (this.pkInputFormat === 'cnic') {
      formatted = this.formatCnic(raw);
    } else if (this.pkInputFormat === 'license') {
      formatted = this.formatLicense(raw);
    } else {
      formatted = this.formatPhone(raw);
    }

    if (formatted !== raw) {
      input.value = formatted;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  private formatCnic(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 13);

    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  }

  private formatLicense(value: string): string {
    // Standardize to uppercase and remove special characters except dashes
    const raw = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const match = raw.match(/^(\d+)([A-Z]+)$/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    const matchReverse = raw.match(/^([A-Z]+)(\d+)$/);
    if (matchReverse) {
      return `${matchReverse[1]}-${matchReverse[2]}`;
    }
    return raw;
  }

  private formatPhone(value: string): string {
    let digits = value.replace(/\D/g, '');

    // Strip out local prefixes if user types them or existing data has them
    if (digits.startsWith('92')) {
      digits = digits.slice(2);
    } else if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    return this.formatPlus92(digits);
  }

  private formatPlus92(localDigits: string): string {
    const trimmed = localDigits.slice(0, 10);
    if (!trimmed) return '+92-';
    if (trimmed.length <= 3) return `+92-${trimmed}`;
    return `+92-${trimmed.slice(0, 3)}-${trimmed.slice(3)}`;
  }
}
