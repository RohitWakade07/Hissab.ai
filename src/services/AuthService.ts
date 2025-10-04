import { componentStyles } from '../styles/theme';

export interface LoginFormData {
  username: string;
  password: string;
}

export interface SignupFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  company_name?: string;
  phone?: string;
  department?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  company: {
    id: string;
    name: string;
    currency: string;
  };
  is_active: boolean;
}

export class AuthService {
  private static instance: AuthService;
  private baseUrl = 'http://localhost:8000/api';
  private token: string | null = null;
  private user: AuthUser | null = null;

  private constructor() {
    this.token = localStorage.getItem('auth_token');
    this.user = this.getStoredUser();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private getStoredUser(): AuthUser | null {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  private storeAuth(token: string, user: AuthUser): void {
    this.token = token;
    this.user = user;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  private clearAuth(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  public async login(credentials: LoginFormData): Promise<{ success: boolean; message: string; user?: AuthUser }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        this.storeAuth(data.token, data.user);
        return { success: true, message: 'Login successful', user: data.user };
      } else {
        return { success: false, message: data.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  public async signup(userData: SignupFormData): Promise<{ success: boolean; message: string; user?: AuthUser }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        this.storeAuth(data.token, data.user);
        return { success: true, message: 'Registration successful', user: data.user };
      } else {
        return { success: false, message: data.error || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  public async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(`${this.baseUrl}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${this.token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  public isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  public getCurrentUser(): AuthUser | null {
    return this.user;
  }

  public getToken(): string | null {
    return this.token;
  }

  public async refreshUser(): Promise<void> {
    if (!this.token) return;

    try {
      const response = await fetch(`${this.baseUrl}/profile/`, {
        headers: {
          'Authorization': `Token ${this.token}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        this.user = user;
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }
}
