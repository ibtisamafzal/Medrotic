import { Directive, ElementRef, HostListener, Input } from '@angular/core';

/** Pakistani CNIC: #####-#######-# */
export function formatPakistaniCnicDisplay(value: string): string {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export type PkInputFormatType = 'cnic' | 'phone' | 'text';

@Directive({
  selector: '[pkInputFormat]',
  standalone: true
})
export class PakInputFormatDirective {
  /** `cnic` = #####-#######-# ; `phone` = +92-XXX-XXXXXXX ; `text` = no formatting (e.g. email or name search). */
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
      formatted = formatPakistaniCnicDisplay(raw);
    } else if (this.pkInputFormat === 'phone') {
      formatted = this.formatPhone(raw);
    } else {
      formatted = raw;
    }

    if (formatted !== raw) {
      input.value = formatted;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  private formatPhone(value: string): string {
    let digits = value.replace(/\D/g, '');

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
