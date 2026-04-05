import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CashierService {
  private http = inject(HttpClient);
  private authService = inject(AuthService); // Inyectamos esto para sacar el tenantId automáticamente
  private apiUrl = 'http://localhost:3000/api/admin/cashiers';

  // Signal reactivo: La vista se va a suscribir a esto automáticamente
  cashiers = signal<any[]>([]);

  // 1. OBTENER: Trae la lista y actualiza el Signal
  loadCashiers(): void {
    const user = this.authService.currentUser();
    if (!user || !user.tenantId) return;

    // Le pasamos el tenantId por la URL como lo pide tu backend
    this.http.get<any[]>(`${this.apiUrl}?tenantId=${user.tenantId}`).subscribe({
      next: (data) => this.cashiers.set(data),
      error: (err) => console.error('Error cargando el personal:', err)
    });
  }

  // 2. CREAR: Envía el POST y recarga la lista
  createCashier(cashierData: { name: string, email: string, pin: string }): Observable<any> {
    const user = this.authService.currentUser();
    
    // Le inyectamos el tenantId del Admin aquí mismo para que la vista no tenga que preocuparse por eso
    const payload = { ...cashierData, tenantId: user?.tenantId };

    return this.http.post<any>(this.apiUrl, payload).pipe(
      // El operador 'tap' ejecuta una acción secundaria si la petición fue exitosa. 
      // En este caso, manda a recargar la lista de una.
      tap(() => this.loadCashiers()) 
    );
  }

  // 3. ACTUALIZAR: Envía el PUT y recarga la lista
  updateCashier(id: string, cashierData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, cashierData).pipe(
      tap(() => this.loadCashiers())
    );
  }

  // 4. ELIMINAR: Envía el DELETE y recarga la lista
  deleteCashier(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadCashiers())
    );
  }
}