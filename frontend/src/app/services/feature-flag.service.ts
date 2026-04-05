import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private authService = inject(AuthService);

  // Verifica si el restaurante actual tiene una función activa
  hasFeature(featureName: string): boolean {
    const config = this.authService.tenantConfig();
    return config?.features?.[featureName] === true;
  }
}