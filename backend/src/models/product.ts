export interface Product {
  id?: string;
  tenantId: string; // Para separar La Selecta de futuros clientes
  name: string;
  price: number;
  category: string; // para los productos del menu
  available: boolean;
}