import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.scss'] 
})
export class App implements OnInit {
  http = inject(HttpClient);
  
  // Magia pura: Usamos 'signal' para que Angular refresque la pantalla obligatoriamente
  products = signal<any[]>([]);

  ngOnInit() {
    this.loadMenu();
  }

  loadMenu() {
    this.http.get('http://localhost:3000/api/products?tenantId=sociedad_selecta_001')
      .subscribe({
        next: (response: any) => {
          // Metemos los datos en el signal
          this.products.set(response.data);
          console.log('Productos listos para pintar:', this.products());
        },
        error: (err) => {
          console.error('Paila, error conectando al backend:', err);
        }
      });
  }
}