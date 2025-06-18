import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
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
      return 'https://cdn-icons-png.flaticon.com/512/236/236831.png';
    } else if (gender === 'F') {
      return 'https://cdn-icons-png.flaticon.com/512/236/236832.png';
    } else {
      return 'https://cdn-icons-png.flaticon.com/512/847/847969.png';
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
    if (!rawDate || rawDate.length !== 8) return rawDate;
    const yyyy = rawDate.substring(0, 4);
    const mm = rawDate.substring(4, 6);
    const dd = rawDate.substring(6, 8);
    return `${dd}-${mm}-${yyyy}`;
  }
}
