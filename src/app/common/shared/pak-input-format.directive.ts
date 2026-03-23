import { Directive, ElementRef, HostListener, Input } from '@angular/core';

type PkInputFormatType = 'cnic' | 'phone';

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
    const formatted = this.pkInputFormat === 'cnic'
      ? this.formatCnic(raw)
      : this.formatPhone(raw);

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

  private formatPhone(value: string): string {
    let digits = value.replace(/\D/g, '');

    if (digits.startsWith('92')) {
      digits = digits.slice(2);
      return this.formatPlus92(digits);
    }

    if (digits.startsWith('0')) {
      return this.formatLocal(digits);
    }

    if (digits.startsWith('3')) {
      return this.formatLocal(`0${digits}`);
    }

    if (!digits) return '';
    return this.formatLocal(digits);
  }

  private formatLocal(localDigits: string): string {
    const trimmed = localDigits.slice(0, 11);
    if (trimmed.length <= 4) return trimmed;
    return `${trimmed.slice(0, 4)}-${trimmed.slice(4)}`;
  }

  private formatPlus92(localDigits: string): string {
    const trimmed = localDigits.slice(0, 10);
    if (!trimmed) return '+92';
    if (trimmed.length <= 3) return `+92-${trimmed}`;
    return `+92-${trimmed.slice(0, 3)}-${trimmed.slice(3)}`;
  }
}
