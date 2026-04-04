import { Product } from '../shared/interfaces/product.models';

export interface OrderItem {
  product: Product;
  quantity: number;
}