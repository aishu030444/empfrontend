import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  employeeProfile: any = null;
  isLoading = false;
  error: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const empno = localStorage.getItem('employeeId');
    if (empno) {
      this.fetchEmployeeProfile(empno);
    } else {
      this.error = 'Employee ID not found. Please log in again.';
    }
  }

  fetchEmployeeProfile(pernr: string): void {
    this.isLoading = true;
    this.error = '';
    
    this.http.post<any>('http://localhost:3030/profile', { PERNR: pernr }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'S' && response.profile) {
          this.employeeProfile = response.profile;
        } else {
          this.error = response.message || 'Failed to load profile.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'An error occurred while fetching profile.';
        console.error('Profile load error:', err);
      }
    });
  }

  getGenderAvatar(gender: string): string {
    if (gender === 'M') {
      return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format';
    } else if (gender === 'F') {
      return 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face&auto=format';
    } else {
      return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face&auto=format';
    }
  }

  formatGender(gender: string): string {
    switch (gender) {
      case 'M': return 'Male';
      case 'F': return 'Female';
      default: return 'Other';
    }
  }

  formatDate(rawDate: string): string {
    if (!rawDate || rawDate.length !== 8) return rawDate || 'N/A';
    const yyyy = rawDate.substring(0, 4);
    const mm = rawDate.substring(4, 6);
    const dd = rawDate.substring(6, 8);
    return `${dd}-${mm}-${yyyy}`;
  }

  getStatusClass(status: string): string {
    return status === '1' ? 'active' : 'inactive';
  }

  getStatusBadgeClass(status: string): string {
    return status === '1' ? 'active' : 'inactive';
  }

  calculateTenure(startDate: string): string {
    if (!startDate || startDate.length !== 8) return 'N/A';
    
    const yyyy = parseInt(startDate.substring(0, 4));
    const mm = parseInt(startDate.substring(4, 6)) - 1; // Month is 0-indexed
    const dd = parseInt(startDate.substring(6, 8));
    
    const start = new Date(yyyy, mm, dd);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
    
    return diffYears.toString();
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}