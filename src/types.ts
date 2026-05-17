export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

export interface Table {
  id: string;
  number: string;
  status: 'available' | 'occupied';
  currentOrderId?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  tableId: string;
  customerId?: string;
  customerName?: string;
  items: OrderItem[];
  total: number;
  status: 'open' | 'closed' | 'cancelled';
  paymentMethod?: 'dinheiro' | 'cartao' | 'pix';
  createdAt: any;
  closedAt?: any;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalSpent: number;
}

export interface FinanceRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: any;
  category: string;
}
