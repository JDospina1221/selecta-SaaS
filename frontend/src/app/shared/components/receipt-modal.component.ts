import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-receipt-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt-modal.component.html'
})
export class ReceiptModalComponent {
  @Input() isOpen = false;
  @Input() isLoading = false;
  @Input() ticket: any = null;
  @Output() closeEvent = new EventEmitter<void>();

  printTicket() { 
    window.print(); 
  }
}