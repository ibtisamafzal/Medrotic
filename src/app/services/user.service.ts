import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiEnvelope<T> {
  message?: string;
  data: T;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private adminBaseUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  // Aggregate users from available admin endpoints.
  getUsers(): Observable<User[]> {
    return this.http.get<ApiEnvelope<User[]>>(`${this.adminBaseUrl}/patients`).pipe(
      map((response) => response?.data || [])
    );
  }

  // Current backend has no generic user-by-id endpoint.
  getUserById(id: string): Observable<User> {
    return this.getUsers().pipe(
      map((users) => users.find((user) => user.id === id) as User)
    );
  }

  // Create user through auth add-user endpoint contract.
  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>('/api/auth/add-user', user);
  }

  // Update is role-specific in backend; this uses patient update route.
  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.adminBaseUrl}/patients/${id}`, user);
  }

  // Delete is role-specific; this uses patient delete route.
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminBaseUrl}/patients/${id}`);
  }
}

