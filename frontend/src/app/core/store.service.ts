import { computed, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CartItem, Category, Order, Product, StoreSettings } from './models';

const API = 'http://localhost:4000/api';
type OrderConfirmation = Pick<Order, '_id' | 'orderNumber' | 'customerName' | 'area' | 'total' | 'status' | 'createdAt' | 'items'>;

@Injectable({ providedIn: 'root' })
export class StoreService {
  readonly cart = signal<CartItem[]>(this.readCart());
  readonly favoriteIds = signal<string[]>(this.readFavorites());
  readonly confirmation = signal<OrderConfirmation | null>(this.readConfirmation());
  readonly cartCount = computed(() => this.cart().reduce((sum, item) => sum + item.quantity, 0));
  readonly favoriteCount = computed(() => this.favoriteIds().length);
  readonly cartTotal = computed(() => this.cart().reduce((sum, item) => sum + item.product.price * item.quantity, 0));
  readonly notice = signal('');

  constructor(private http: HttpClient) {}

  products(search = '', category = '', sort = 'newest'): Observable<{ items: Product[]; total: number }> {
    let params = new HttpParams().set('sort', sort).set('limit', '48');
    if (search) params = params.set('search', search);
    if (category) params = params.set('category', category);
    return this.http.get<{ items: Product[]; total: number }>(`${API}/products`, { params });
  }
  product(id: string): Observable<{ product: Product }> { return this.http.get<{ product: Product }>(`${API}/products/${id}`); }
  categories(): Observable<{ categories: Category[] }> { return this.http.get<{ categories: Category[] }>(`${API}/categories`); }
  settings(): Observable<{ settings: StoreSettings }> { return this.http.get<{ settings: StoreSettings }>(`${API}/settings/public`); }
  createOrder(data: object): Observable<{ order: Order }> { return this.http.post<{ order: Order }>(`${API}/orders`, data); }
  trackOrder(orderNumber: string, phone: string): Observable<{ order: Order }> {
    return this.http.post<{ order: Order }>(`${API}/orders/track`, { orderNumber, phone });
  }
  confirmOrderArrival(id: string, phone: string): Observable<{ order: Order }> {
    return this.http.post<{ order: Order }>(`${API}/orders/${id}/arrival-confirmation`, { phone });
  }

  setConfirmation(order: Order): void {
    const confirmation: OrderConfirmation = {
      _id: order._id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      area: order.area,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items
    };
    this.confirmation.set(confirmation);
    sessionStorage.setItem('nova-order-confirmation', JSON.stringify(confirmation));
  }

  add(product: Product, quantity = 1): void {
    if (product.quantity < 1) return this.show('This item is currently out of stock.');
    const items = [...this.cart()];
    const found = items.find(item => item.product._id === product._id);
    if (found) {
      if (found.quantity + quantity > product.quantity) return this.show('You have reached the available stock for this item.');
      found.quantity += quantity;
    } else {
      items.push({ product, quantity: Math.min(quantity, product.quantity) });
    }
    this.cart.set(items);
    this.persist('nova-cart', items);
    this.show('Added to your cart.');
  }
  setQuantity(id: string, quantity: number): void {
    const items = this.cart().map(item => item.product._id === id
      ? { ...item, quantity: Math.max(1, Math.min(item.product.quantity, quantity)) } : item);
    this.cart.set(items);
    this.persist('nova-cart', items);
  }
  remove(id: string): void {
    const items = this.cart().filter(item => item.product._id !== id);
    this.cart.set(items);
    this.persist('nova-cart', items);
  }
  clearCart(): void { this.cart.set([]); this.persist('nova-cart', []); }
  toggleFavorite(id: string): void {
    const ids = this.favoriteIds().includes(id) ? this.favoriteIds().filter(item => item !== id) : [...this.favoriteIds(), id];
    this.favoriteIds.set(ids);
    this.persist('nova-favorites', ids);
  }
  isFavorite(id: string): boolean { return this.favoriteIds().includes(id); }
  show(message: string): void {
    this.notice.set(message);
    window.setTimeout(() => { if (this.notice() === message) this.notice.set(''); }, 3000);
  }
  private readCart(): CartItem[] {
    try { return JSON.parse(localStorage.getItem('nova-cart') || '[]') as CartItem[]; }
    catch { return []; }
  }
  private readFavorites(): string[] {
    try { return JSON.parse(localStorage.getItem('nova-favorites') || '[]') as string[]; }
    catch { return []; }
  }
  private readConfirmation(): OrderConfirmation | null {
    try {
      const confirmation = sessionStorage.getItem('nova-order-confirmation');
      return confirmation ? JSON.parse(confirmation) as OrderConfirmation : null;
    } catch {
      return null;
    }
  }
  private persist(key: string, value: unknown): void { localStorage.setItem(key, JSON.stringify(value)); }
}
