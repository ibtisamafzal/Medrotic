import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, User } from '../../services/admin.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-user-verification',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-verification.html',
  styleUrl: './user-verification.scss',
})
export class UserVerification implements OnInit {
  users: User[] = [];
  pendingUsers: User[] = [];
  searchTerm = '';
  roleFilter: 'all' | 'admin' | 'doctor' | 'patient' = 'all';

  constructor(
    private adminService: AdminService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.pendingUsers = users.filter(u => u.status === 'pending');
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error loading users:', err);
      }
    });
  }

  applyFilters() {
    this.pendingUsers = this.users.filter(user => {
      const matchesSearch = !this.searchTerm || 
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesRole = this.roleFilter === 'all' || user.role === this.roleFilter;
      const isPending = user.status === 'pending';
      
      return matchesSearch && matchesRole && isPending;
    });
  }

  onSearchChange() {
    this.applyFilters();
  }

  onRoleFilterChange() {
    this.applyFilters();
  }

  approveUser(user: User) {
    this.adminService.approveUser(user.id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error approving user:', err);
        this.alertService.error('Error approving user. Please try again.');
      }
    });
  }

  rejectUser(user: User) {
    if (confirm(`Are you sure you want to reject ${user.name}?`)) {
      this.adminService.rejectUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => {
          console.error('Error rejecting user:', err);
          this.alertService.error('Error rejecting user. Please try again.');
        }
      });
    }
  }

  updateUserRole(user: User, role: string) {
    this.adminService.updateUserRole(user.id, role).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error updating user role:', err);
        this.alertService.error('Error updating user role. Please try again.');
      }
    });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin':
        return 'badge bg-danger';
      case 'doctor':
        return 'badge bg-primary';
      case 'patient':
        return 'badge bg-success';
      default:
        return 'badge bg-secondary';
    }
  }
}
