import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-cashier-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cashier-modal.component.html'
})
export class CashierModalComponent {
  private authService = inject(AuthService);

  @Input() isOpen = false;
  
  // 🔥 AQUÍ ESTÁ LA SOLUCIÓN: Un Setter para detectar cuando cambia el empleado
  private _cashierToEdit: any = null;
  @Input() 
  set cashierToEdit(value: any) {
    this._cashierToEdit = value;
    if (value) {
      // Llenamos los Signals a la fuerza con los datos del empleado
      this.name.set(value.name || '');
      const prefix = value.email ? value.email.split('@')[0] : '';
      this.username.set(prefix);
      this.pin.set(value.pin || '');
    } else {
      this.resetForm();
    }
  }
  get cashierToEdit() {
    return this._cashierToEdit;
  }
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  name = signal('');
  username = signal(''); 
  pin = signal('');
  adminDomain = signal('');

  constructor() {
    // Extraer el dominio del Admin logueado
    const user = this.authService.currentUser();
    if (user?.email) {
      const domain = user.email.split('@')[1];
      this.adminDomain.set(`@${domain}`);
    }
  }

  onSave() {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    const pinRegex = /^\d{4,6}$/;

    // 1. Validar que no falte nada
    if (!this.name() || !this.username() || !this.pin()) {
      alert('Mano, llene todos los campos por favor.');
      return;
    }

    // 2. Validar que el nombre solo tenga letras
    if (!nameRegex.test(this.name())) {
      alert('Paila. El nombre solo debe contener letras, sin números ni símbolos.');
      return;
    }

    // 3. Validar el username SÓLO si estamos creando uno nuevo
    if (!this.cashierToEdit && !usernameRegex.test(this.username())) {
      alert('El alias de usuario solo puede tener letras y números (sin espacios ni @).');
      return;
    }

    // 4. Validar que el PIN sea un número válido de 4 a 6 cifras
    if (!pinRegex.test(this.pin())) {
      alert('El PIN debe ser estrictamente numérico, entre 4 y 6 dígitos.');
      return;
    }

    // Armamos el correo completo 
    const fullEmail = `${this.username()}${this.adminDomain()}`;

    // Emitimos los datos
    this.save.emit({
      id: this.cashierToEdit?.id,
      name: this.name().trim(),
      email: fullEmail,
      pin: this.pin()
    });
    
    this.resetForm();
  }

  onClose() {
    this.resetForm();
    this.close.emit();
  }

  private resetForm() {
    this.name.set('');
    this.username.set('');
    this.pin.set('');
  }
}