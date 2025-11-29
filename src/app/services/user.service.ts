import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  // Get all users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }

  // Get user by ID
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`/api/users/${id}`);
  }

  // Create new user
  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>('/api/users', user);
  }

  // Update user
  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`/api/users/${id}`, user);
  }

  // Delete user
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${id}`);
  }
}

