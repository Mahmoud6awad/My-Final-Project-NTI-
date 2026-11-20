import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { CartItem, Category, Order, Product, StoreSettings } from '../core/models';
import { StoreService } from '../core/store.service';
import { TranslatePipe } from '../core/language';

const API = 'http://localhost:4000/api';
const EMPTY_SETTINGS: StoreSettings = {
  storeName: 'Nova Store', storePhone: '+201000000000', deliveryFee: 0,
  deliveryTime: 'Confirmed by phone', deliveryAreas: 'Contact us to confirm delivery availability'
};

@Component({
  selector: 'app-store-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, RouterLink, TranslatePipe],
  templateUrl: './store-page.html',
  styleUrls: ['./store-page.css', './store-page-tracking.css', './store-page-rtl.css']
})
export class StorePage implements OnInit, OnDestroy {
  page = signal('home');
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  orders = signal<Order[]>([]);
  settings = signal<StoreSettings>(EMPTY_SETTINGS);
  selected = signal<Product | null>(null);
  trackedOrder = signal<Order | null>(null);
  confirmationOrderNumber = signal('');
  loading = signal(false);
  trackingLoading = signal(false);
  arrivalLoading = signal(false);
  error = signal('');
  search = '';
  categoryFilter = '';
  sort = 'newest';
  trackOrderNumber = '';
  trackPhone = '';
  searchTimer?: number;
  private sub?: Subscription;
  private ordersRequest?: Subscription;
  private adminRefreshTimer?: number;

  managerEmail = '';
  managerPassword = '';
  productDraft = { name: '', description: '', price: 0, quantity: 0, image: '', categoryId: '', isFeatured: false };
  orderFilter = '';
  constructor(
    readonly store: StoreService,
    readonly auth: AuthService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.sub = this.router.events.subscribe(() => this.loadPage());
    this.loadPage();
    this.store.categories().subscribe({ next: result => this.categories.set(result.categories), error: () => this.error.set('Unable to load categories. Start the API and try again.') });
    this.store.settings().subscribe({ next: result => this.settings.set(result.settings), error: () => undefined });
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.ordersRequest?.unsubscribe();
    window.clearTimeout(this.searchTimer);
    window.clearInterval(this.adminRefreshTimer);
  }

  loadPage(): void {
    const segments = this.router.url.split('?')[0].split('/').filter(Boolean);
    const view = segments[0] || 'home';
    const valid = ['home', 'products', 'favorites', 'cart', 'checkout', 'login', 'admin', 'delivery', 'product', 'order-confirmation', 'track-order'];
    this.page.set(valid.includes(view) ? view : 'not-found');
    this.error.set('');
    if (view !== 'admin') this.stopAdminPolling();
    if (view === 'track-order') {
      const orderNumber = this.route.snapshot.queryParamMap.get('orderNumber');
      if (orderNumber) this.trackOrderNumber = orderNumber;
    }
    if (view === 'order-confirmation') {
      this.confirmationOrderNumber.set(this.route.snapshot.queryParamMap.get('orderNumber') || '');
    }
    if (view === 'home' || view === 'products' || view === 'favorites') this.loadProducts();
    if (view === 'product' && segments[1]) this.loadProduct(segments[1]);
    if (view === 'admin') this.loadAdmin();
  }
  loadProducts(): void {
    this.loading.set(true);
    this.store.products(this.search, this.categoryFilter, this.sort).subscribe({
      next: result => {
        this.products.set(this.page() === 'favorites'
          ? result.items.filter(product => this.store.isFavorite(product._id)) : result.items);
        this.loading.set(false);
      },
      error: () => { this.error.set('Could not load products. Make sure the API is running.'); this.loading.set(false); }
    });
  }
  loadProduct(id: string): void {
    this.loading.set(true);
    this.store.product(id).subscribe({
      next: result => { this.selected.set(result.product); this.loading.set(false); },
      error: () => { this.selected.set(null); this.error.set('This product could not be found.'); this.loading.set(false); }
    });
  }
  onSearch(): void {
    window.clearTimeout(this.searchTimer);
    this.searchTimer = window.setTimeout(() => this.loadProducts(), 300);
  }
  chooseCategory(id: string): void { this.categoryFilter = id; this.loadProducts(); }
  addToCart(product: Product): void { this.store.add(product); }
  toggleFavorite(product: Product): void { this.store.toggleFavorite(product._id); this.loadProducts(); }
  favorite(product: Product): boolean { return this.store.isFavorite(product._id); }
  setQuantity(item: CartItem, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.store.setQuantity(item.product._id, value);
  }
  subtotal(): number { return this.store.cartTotal(); }
  finalTotal(): number { return this.subtotal() + Number(this.settings().deliveryFee || 0); }
  placeOrder(form: HTMLFormElement): void {
    if (!form.reportValidity() || !this.store.cart().length) return;
    const data = new FormData(form);
    const body = {
      customerName: data.get('customerName'), phone: data.get('phone'), alternatePhone: data.get('alternatePhone'),
      city: data.get('city'), area: data.get('area'), address: data.get('address'),
      deliveryInstructions: data.get('deliveryInstructions'),
      items: this.store.cart().map(item => ({ productId: item.product._id, quantity: item.quantity }))
    };
    this.loading.set(true);
    this.store.createOrder(body).subscribe({
      next: response => {
        this.store.setConfirmation(response.order);
        this.store.clearCart();
        this.loading.set(false);
        this.router.navigate(['/order-confirmation'], { queryParams: { orderNumber: response.order.orderNumber } });
      },
      error: response => { this.error.set(response.error?.message || 'We could not submit your order. Please try again.'); this.loading.set(false); }
    });
  }
  lookupOrder(form: HTMLFormElement): void {
    if (!form.reportValidity()) return;
    this.error.set('');
    this.trackingLoading.set(true);
    this.trackedOrder.set(null);
    this.store.trackOrder(this.trackOrderNumber, this.trackPhone).subscribe({
      next: response => { this.trackedOrder.set(response.order); this.trackingLoading.set(false); },
      error: response => {
        this.error.set(response.error?.message || 'Unable to find that order.');
        this.trackingLoading.set(false);
      }
    });
  }
  confirmOrderArrival(): void {
    const order = this.trackedOrder();
    if (!order || this.arrivalLoading()) return;
    this.error.set('');
    this.arrivalLoading.set(true);
    this.store.confirmOrderArrival(order._id, this.trackPhone).subscribe({
      next: response => {
        this.trackedOrder.set(response.order);
        this.arrivalLoading.set(false);
      },
      error: response => {
        this.error.set(response.error?.message || 'Unable to confirm order receipt.');
        this.arrivalLoading.set(false);
      }
    });
  }
  login(): void {
    this.error.set('');
    this.auth.login(this.managerEmail, this.managerPassword).subscribe({
      next: () => { this.managerPassword = ''; this.router.navigateByUrl('/admin'); },
      error: response => this.error.set(response.error?.message || 'Unable to sign in.')
    });
  }
  logout(): void { this.auth.logout(); this.router.navigateByUrl('/login'); }
  loadAdmin(): void {
    if (!this.auth.token()) { this.router.navigateByUrl('/login'); return; }
    this.refreshOrders(true);
    if (this.adminRefreshTimer === undefined) {
      this.adminRefreshTimer = window.setInterval(() => this.refreshOrders(false), 15000);
    }
    this.store.products().subscribe({ next: result => this.products.set(result.items), error: () => undefined });
    this.store.categories().subscribe({ next: result => this.categories.set(result.categories), error: () => undefined });
  }
  private refreshOrders(showLoading: boolean): void {
    if (this.ordersRequest && !this.ordersRequest.closed) return;
    if (showLoading) this.loading.set(true);
    this.ordersRequest = this.http.get<{ items: Order[] }>(`${API}/orders`).subscribe({
      next: result => {
        this.orders.set(result.items);
        if (showLoading) this.loading.set(false);
      },
      error: response => {
        if (showLoading) this.loading.set(false);
        if (response.status === 401) this.logout();
        else this.error.set('Could not load manager data.');
      }
    });
  }
  private stopAdminPolling(): void {
    window.clearInterval(this.adminRefreshTimer);
    this.adminRefreshTimer = undefined;
    this.ordersRequest?.unsubscribe();
    this.ordersRequest = undefined;
  }
  saveProduct(): void {
    const request = this.http.post(`${API}/products`, this.productDraft);
    request.subscribe({
      next: () => { this.productDraft = { name: '', description: '', price: 0, quantity: 0, image: '', categoryId: '', isFeatured: false }; this.loadAdmin(); this.store.show('Product created.'); },
      error: response => this.error.set(response.error?.message || 'Unable to create product.')
    });
  }
  deleteProduct(product: Product): void {
    if (!window.confirm(`Delete "${product.name}" from the catalog?`)) return;
    this.http.delete(`${API}/products/${product._id}`).subscribe({
      next: () => { this.loadAdmin(); this.store.show('Product removed.'); },
      error: response => this.error.set(response.error?.message || 'Unable to remove product.')
    });
  }
  updateStatus(order: Order, event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    this.http.patch<{ order: Order; notificationError?: string }>(`${API}/orders/${order._id}/status`, { status }).subscribe({
      next: result => {
        this.orders.update(items => items.map(item => item._id === result.order._id ? result.order : item));
        if (result.notificationError) this.error.set(result.notificationError);
      },
      error: response => { this.error.set(response.error?.message || 'Could not update order status.'); this.loadAdmin(); }
    });
  }
  retryAcceptanceEmail(order: Order): void {
    this.http.post<{ order: Order }>(`${API}/orders/${order._id}/acceptance-email`, {}).subscribe({
      next: result => {
        this.orders.update(items => items.map(item => item._id === result.order._id ? result.order : item));
        this.error.set('Order notification email sent.');
      },
      error: response => this.error.set(response.error?.message || 'Unable to send the order notification email.')
    });
  }
  getCategoryName(product: Product): string {
    return typeof product.categoryId === 'string' ? '' : product.categoryId?.name || '';
  }
  getCategoryId(product: Product): string {
    return typeof product.categoryId === 'string' ? product.categoryId : product.categoryId?._id || '';
  }
  pendingOrdersCount(): number {
    return this.orders().filter(order => order.status === 'Pending Confirmation').length;
  }

  deliveryConfirmations(): Order[] {
    return this.orders().filter(order => Boolean(order.customerDeliveryConfirmedAt));
  }

  filteredOrders(): Order[] {
    return this.orders().filter(order => !this.orderFilter || order.status === this.orderFilter);
  }
}
