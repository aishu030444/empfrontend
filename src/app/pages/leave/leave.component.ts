import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
interface Leave {
  PERNR: string;
  BEGDA: string;  // Begin date
  ENDDA: string;  // End date
  SUBTY: string;  // Subtype
  AWART: string;  // Absence type
  ABWTG: string;  // Absence days
  AEDTM: string;  // Request date
  UNAME: string;  // Approver ID
  STDAZ: string;  // Standard hours
  PLANS: string;  // Position
  ENAME: string;  // Approver name
  ATEXT: string;  // Leave type text
  ABS_DAYS: string; // Absence days
  STATUS: string; // Leave status
}

@Component({
  selector: 'app-employee-leave',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatIcon
  ],
  templateUrl: './leave.component.html',
  styleUrls: ['./leave.component.scss'],
  providers: [DatePipe]
})
export class LeaveComponent implements OnInit {
  leaves: Leave[] = [];
  isLoading = false;
  error: string = '';
  
  // Define columns to display
  displayedColumns: string[] = [
    'leaveType',  // ATEXT + AWART (tooltip)
    'period',     // BEGDA to ENDDA
    'duration',   // ABS_DAYS
    'status',     // STATUS
    'approver',   // ENAME (UNAME as tooltip)
    'requestDate' // AEDTM
  ];

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    const empno = localStorage.getItem('employeeId');
    if (empno) {
      this.fetchLeaveData(empno);
    } else {
      this.error = 'Employee ID not found. Please log in again.';
    }
  }

  fetchLeaveData(pernr: string): void {
    this.isLoading = true;
    this.error = '';
    this.http.post<any>('http://localhost:3030/leave', { PERNR: pernr }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'S' && response.leaves) {
          this.leaves = response.leaves.map((leave: Leave) => ({
            ...leave,
            // Format dates consistently
            BEGDA: this.formatDate(leave.BEGDA),
            ENDDA: this.formatDate(leave.ENDDA),
            AEDTM: this.formatDate(leave.AEDTM),
            // Ensure numeric values are properly formatted
            ABS_DAYS: parseFloat(leave.ABS_DAYS).toFixed(1),
            ABWTG: parseFloat(leave.ABWTG).toFixed(1)
          }));
        } else {
          this.error = response.message || 'No leave data found.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Failed to load leave data.';
        console.error('Leave data error:', err);
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    // Handle both YYYY-MM-DD and YYYYMMDD formats
    const normalizedDate = dateString.includes('-') 
      ? dateString 
      : `${dateString.substr(0, 4)}-${dateString.substr(4, 2)}-${dateString.substr(6, 2)}`;
    return this.datePipe.transform(normalizedDate, 'dd-MMM-yyyy') || dateString;
  }

  getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'Completed': 'primary',
      'Approved': 'primary',
      'Pending': 'accent',
      'Rejected': 'warn',
      'Cancelled': 'warn'
    };
    return statusColors[status] || '';
  }
}
