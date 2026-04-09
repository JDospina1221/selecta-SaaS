import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  applyTheme(themeConfig: { primaryColor: string, secondaryColor: string }) {
    const root = document.documentElement;
    // Inyectamos los colores de la base de datos en las variables CSS
    root.style.setProperty('--primary-color', themeConfig.primaryColor);
    root.style.setProperty('--secondary-color', themeConfig.secondaryColor);
    
    // Generamos un color de hover (20 puntos más oscuro) automáticamente
    root.style.setProperty('--primary-hover', this.adjustColor(themeConfig.primaryColor, -20));
  }

  private adjustColor(col: string, amt: number) {
    let usePound = false;
    if (col[0] == "#") { col = col.slice(1); usePound = true; }
    let num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    let b = ((num >> 8) & 0x00FF) + amt;
    let g = (num & 0x0000FF) + amt;
    const clamp = (n: number) => Math.max(0, Math.min(255, n));
    return (usePound ? "#" : "") + (clamp(g) | (clamp(b) << 8) | (clamp(r) << 16)).toString(16).padStart(6, '0');
  }
}

