import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'ui-button',
  standalone: true,
  template: `
    <button 
      (click)="onClick.emit($event)"
      [class]="getButtonClasses()"
      [disabled]="disabled">
      <ng-content></ng-content>
    </button>
  `
})
export class UiButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'tertiary' = 'primary';
  @Input() customClass = '';
  @Input() disabled = false;
  @Output() onClick = new EventEmitter<MouseEvent>();

  getButtonClasses() {
    // Clases base para todos los botones
    const base = "px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ";
    
    // Variantes de diseño
    const variants = {
      primary: "bg-gradient-to-r from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:opacity-90",
      secondary: "bg-surface-container-low text-on-surface hover:bg-slate-200",
      tertiary: "bg-transparent text-primary hover:bg-primary/5"
    };

    return base + variants[this.variant] + " " + this.customClass;
  }
}