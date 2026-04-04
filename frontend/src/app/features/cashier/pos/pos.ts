import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../services/product.service';
import { OrderService } from '../../../services/order.service';

@Component({ selector: 'app-pos', standalone: true, imports: [CommonModule], templateUrl: './pos.html' })
export class PosComponent {
  private productService = inject(ProductService);
  private orderService = inject(OrderService);

  categories = this.productService.categories;
  selectedCategory = this.productService.selectedCategory;
  filteredProducts = this.productService.filteredProducts;

  onSelectCategory(category: string) { this.productService.setCategory(category); }
  onProductClick(product: any) { this.orderService.addToCart(product); }
}