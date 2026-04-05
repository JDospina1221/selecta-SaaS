import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout-modal.component.html'
})
export class CheckoutModalComponent {
  @Input() isOpen = false;
  @Input() total = 0;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() confirmEvent = new EventEmitter<string>();

  paymentMethod = signal('Efectivo');

  setPaymentMethod(method: string) { 
    this.paymentMethod.set(method); 
  }
  
  onConfirm() { 
    this.confirmEvent.emit(this.paymentMethod()); 
  }
}