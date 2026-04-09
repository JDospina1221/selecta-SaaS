import { Injectable, signal, inject } from '@angular/core';
import { Database, ref, onValue, DataSnapshot } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  // ✅ Usamos inject() dentro de la clase, esto asegura que espere al provider del app.config
  private db = inject(Database);
  
  isSynced = signal<boolean>(navigator.onLine);

  constructor() {
    // Agregamos un pequeño delay o validación para asegurar que Firebase ya cargó
    if (this.db) {
      this.monitorFirebaseConnection();
    }
  }

  private monitorFirebaseConnection() {
    try {
      const connectedRef = ref(this.db, '.info/connected');

      onValue(connectedRef, (snap: DataSnapshot) => {
        const isConnected = !!snap.val();
        this.isSynced.set(isConnected);
        
        if (isConnected) {
          console.log('✅ Servex SaaS: Sincronizado con Firebase');
        } else {
          console.warn('⚠️ Servex SaaS: Conexión con la BD perdida');
        }
      });
    } catch (error) {
      console.error('Error al inicializar el monitor de Firebase:', error);
    }
  }
}