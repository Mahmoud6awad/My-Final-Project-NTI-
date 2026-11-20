import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

const API = 'http://localhost:4000/api';
interface LoginResponse { token: string; manager: { id: string; email: string } }

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly token = signal(localStorage.getItem('nova-manager-token') || '');
  constructor(private http: HttpClient) {}
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API}/auth/login`, { email, password }).pipe(tap(response => {
      localStorage.setItem('nova-manager-token', response.token);
      this.token.set(response.token);
    }));
  }
  logout(): void { localStorage.removeItem('nova-manager-token'); this.token.set(''); }
}
