import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService login', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const tokenKey = 'nova-manager-token';
  const url = 'http://localhost:4000/api/auth/login';

  beforeEach(() => {
    localStorage.removeItem(tokenKey);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(tokenKey);
  });

  it('posts credentials and stores the returned token', () => {
    const result = {
      token: 'test-jwt',
      manager: { id: 'manager-1', email: 'manager@example.com' }
    };

    service.login('manager@example.com', 'secret').subscribe(response => {
      expect(response).toEqual(result);
    });

    const request = http.expectOne(url);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'manager@example.com',
      password: 'secret'
    });
    request.flush(result);

    expect(localStorage.getItem(tokenKey)).toBe('test-jwt');
    expect(service.token()).toBe('test-jwt');
  });

  it('does not store a token when the API rejects login', () => {
    let receivedStatus = 0;

    service.login('manager@example.com', 'wrong').subscribe({
      error: error => receivedStatus = error.status
    });

    http.expectOne(url).flush(
      { message: 'Invalid email or password.' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(receivedStatus).toBe(401);
    expect(localStorage.getItem(tokenKey)).toBeNull();
    expect(service.token()).toBe('');
  });
});
