import { Routes } from '@angular/router';
import { StorePage } from './features/store-page';

const page = { path: '', component: StorePage };

export const routes: Routes = [
  page,
  { path: 'products', component: StorePage },
  { path: 'product/:id', component: StorePage },
  { path: 'favorites', component: StorePage },
  { path: 'cart', component: StorePage },
  { path: 'checkout', component: StorePage },
  { path: 'order-confirmation', component: StorePage },
  { path: 'track-order', component: StorePage },
  { path: 'delivery', component: StorePage },
  { path: 'login', component: StorePage },
  { path: 'admin', component: StorePage },
  { path: '**', component: StorePage }
];
