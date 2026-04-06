import { Directive, Input, HostBinding } from '@angular/core';

@Directive({
  selector: '[uiText]',
  standalone: true
})
export class UiTypographyDirective {
  // Las 4 jerarquías permitidas en tu diseño
  @Input() uiText: 'h1' | 'h2' | 'p' | 'label' = 'p';
  @Input() customClass = '';

  @HostBinding('class') get classes() {
    // Mapeamos a las clases globales del styles.scss
    const styles = {
      h1: "text-h1",
      h2: "text-h2",
      p: "text-p",
      label: "text-label"
    };
    
    return `${styles[this.uiText]} ${this.customClass}`.trim();
  }
}