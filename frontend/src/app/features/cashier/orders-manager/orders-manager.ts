import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../services/order.service';
import { AuthService } from '../../../services/auth.service';

@Component({ selector: 'app-orders-manager', standalone: true, imports: [CommonModule], templateUrl: './orders-manager.html' })
export class OrdersManagerComponent {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);

  activeOrders = this.orderService.activeOrders;
  isCancelModalOpen = signal(false); cancelingOrder = signal<any>(null); cancelReason = signal(''); cancelRefundMethod = signal('Efectivo');

  constructor() { const user = this.authService.currentUser(); if (user) this.orderService.loadActiveOrders(user.tenantId || 'sociedad_selecta_001'); }

  markAsDelivered(orderId: string) { this.orderService.updateOrderStatus(orderId, 'Entregado').subscribe(() => { this.orderService.loadActiveOrders(this.authService.currentUser()?.tenantId || 'sociedad_selecta_001'); }); }
  openCancelModal(order: any) { this.cancelingOrder.set(order); this.cancelReason.set(''); this.cancelRefundMethod.set(order.paymentMethod); this.isCancelModalOpen.set(true); }
  closeCancelModal() { this.isCancelModalOpen.set(false); this.cancelingOrder.set(null); }
  updateCancelReason(e: any) { this.cancelReason.set(e.target.value); } updateCancelRefundMethod(e: any) { this.cancelRefundMethod.set(e.target.value); }
  confirmCancelOrder() { if (!this.cancelReason()) return alert('Indicar motivo'); this.orderService.updateOrderStatus(this.cancelingOrder().id, 'Cancelado', this.cancelReason(), this.cancelRefundMethod()).subscribe(() => { this.orderService.loadActiveOrders(this.authService.currentUser()?.tenantId || 'sociedad_selecta_001'); this.closeCancelModal(); }); }
}