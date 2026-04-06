import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-card',
  standalone: true,
  template: `
    <div [class]="'bg-white rounded-3xl shadow-sm ring-1 ring-black/5 overflow-hidden transition-all duration-300 ' + customClass">
      <div [class]="paddingClass">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class UiCardComponent {
  // Permite inyectar clases extra si lo necesitas (ej. un hover effect)
  @Input() customClass = '';
  // Mantiene el Spacing System por defecto (p-6 en móvil, p-8 en desktop)
  @Input() paddingClass = 'p-6 md:p-8'; 
}