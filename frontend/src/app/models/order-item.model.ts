import { Product } from './product.models';

export interface OrderItem {
  product: Product;
  quantity: number;
}