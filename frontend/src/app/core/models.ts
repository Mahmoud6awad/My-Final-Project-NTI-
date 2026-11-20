export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
  categoryId: Category | string;
  isFeatured: boolean;
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface StoreSettings {
  storeName: string;
  storePhone: string;
  deliveryFee: number;
  deliveryTime: string;
  deliveryAreas: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  area: string;
  total: number;
  status: string;
  createdAt: string;
  acceptedEmailSentAt?: string | null;
  customerDeliveryConfirmedAt?: string | null;
  items: Array<{ productName: string; unitPrice: number; quantity: number; lineSubtotal: number }>;
}
