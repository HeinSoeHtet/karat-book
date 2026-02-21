export interface Item {
  id: string;
  name: string;
  category: 'rings' | 'necklaces' | 'bracelets' | 'earrings' | 'watches';
  description?: string;
  material: string;
  stock: number;
  image: string;
}

export interface CartItem {
  item: Item;
  quantity: number;
}

export interface Sale {
  id: string;
  date: Date;
  items: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  customerName?: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  discount?: number;
  total: number;
  itemId?: string;
  weight?: number | null;
  returnType?: 'making-charges' | 'percentage' | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: Date;
  createdAt?: Date;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  total: number;
  type: 'sales' | 'pawn' | 'buy';
  status: 'paid' | 'unpaid' | 'partially_paid' | 'cancelled' | 'active' | 'overdue' | 'expired' | 'redeemed' | 'returned';
  dueDate?: Date;
  notes?: string;
}
export interface HourlyRateEntry {
  time: string;
  value: number;
}

export interface DailyMarketRate {
  id: number;
  type: 'gold' | 'exchange_rate';
  hourlyRate: HourlyRateEntry[];
  createdAt: Date;
  updatedAt: Date;
}
