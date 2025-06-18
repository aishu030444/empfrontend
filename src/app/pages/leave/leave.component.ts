import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DatePipe } from '@angular/common';

interface Leave {
  PERNR: string;
  BEGDA: string;
  ENDDA: string;
  SUBTY: string;
  AWART: string;
  ABWTG: string;
  AEDTM: string;
  UNAME: string;
  STDAZ: string;
  PLANS: string;
  ENAME: string;
  ATEXT: string;
  ABS_DAYS: string;
  STATUS: string;
}

interface LeaveAnalytics {
  totalLeaves: number;
  availableLeaves: number;
  pendingRequests: number;
  utilizationRate: number;
  thisMonthLeaves: number;
  totalAllowedLeaves: number;
}

@Component({
  selector: 'app-employee-leave',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgChartsModule
  ],
  templateUrl: './leave.component.html',
  styleUrls: ['./leave.component.scss'],
  providers: [DatePipe]
})
export class LeaveComponent implements OnInit {
  leaves: Leave[] = [];
  filteredLeaves: Leave[] = [];
  isLoading = false;
  error: string = '';
  searchTerm: string = '';
  selectedFilter: string = '';
  
  leaveAnalytics: LeaveAnalytics | null = null;
  chartData: any = null;
  chartOptions: any = {};

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe
  ) {
    this.initializeChartOptions();
  }

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
            BEGDA: this.formatDate(leave.BEGDA),
            ENDDA: this.formatDate(leave.ENDDA),
            AEDTM: this.formatDate(leave.AEDTM),
            ABS_DAYS: parseFloat(leave.ABS_DAYS).toFixed(1),
            ABWTG: parseFloat(leave.ABWTG).toFixed(1)
          }));
          this.filteredLeaves = [...this.leaves];
          this.calculateAnalytics();
          this.generateChartData();
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

  calculateAnalytics(): void {
    const totalLeaves = this.leaves.length;
    const totalDaysTaken = this.leaves.reduce((sum, leave) => sum + parseFloat(leave.ABS_DAYS), 0);
    const pendingRequests = this.leaves.filter(leave => 
      leave.STATUS.toLowerCase().includes('pending') || 
      leave.STATUS.toLowerCase().includes('submitted')
    ).length;
    
    // Assuming 25 days annual leave allowance
    const totalAllowedLeaves = 25;
    const availableLeaves = Math.max(0, totalAllowedLeaves - totalDaysTaken);
    const utilizationRate = Math.round((totalDaysTaken / totalAllowedLeaves) * 100);
    
    // Calculate this month's leaves
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthLeaves = this.leaves.filter(leave => {
      const leaveDate = new Date(leave.BEGDA);
      return leaveDate.getMonth() === currentMonth && leaveDate.getFullYear() === currentYear;
    }).length;

    this.leaveAnalytics = {
      totalLeaves: totalDaysTaken,
      availableLeaves,
      pendingRequests,
      utilizationRate,
      thisMonthLeaves,
      totalAllowedLeaves
    };
  }

  generateChartData(): void {
    // Generate leave trends for last 6 months
    const months = [];
    const leaveCounts = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push(monthName);
      
      const monthLeaves = this.leaves.filter(leave => {
        const leaveDate = new Date(leave.BEGDA);
        return leaveDate.getMonth() === date.getMonth() && 
               leaveDate.getFullYear() === date.getFullYear();
      }).length;
      
      leaveCounts.push(monthLeaves);
    }

    // Generate leave types distribution
    const leaveTypes = new Map<string, number>();
    this.leaves.forEach(leave => {
      const type = leave.ATEXT || 'Unknown';
      leaveTypes.set(type, (leaveTypes.get(type) || 0) + 1);
    });

    this.chartData = {
      leavesTrend: {
        labels: months,
        datasets: [{
          label: 'Leaves Taken',
          data: leaveCounts,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      leaveTypes: {
        labels: Array.from(leaveTypes.keys()),
        datasets: [{
          data: Array.from(leaveTypes.values()),
          backgroundColor: [
            '#10b981',
            '#3b82f6',
            '#8b5cf6',
            '#f59e0b',
            '#ef4444',
            '#06b6d4'
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      }
    };
  }

  initializeChartOptions(): void {
    this.chartOptions = {
      line: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#667eea',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 12,
                weight: '500'
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 12,
                weight: '500'
              },
              stepSize: 1
            }
          }
        }
      },
      doughnut: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12,
                weight: '500'
              },
              color: '#64748b'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#667eea',
            borderWidth: 1,
            cornerRadius: 8
          }
        },
        cutout: '60%'
      }
    };
  }

  filterLeaves(): void {
    this.filteredLeaves = this.leaves.filter(leave => {
      const matchesSearch = !this.searchTerm || 
        leave.ATEXT?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        leave.STATUS?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        leave.ENAME?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesFilter = !this.selectedFilter || 
        leave.ATEXT?.toLowerCase().includes(this.selectedFilter.toLowerCase());
      
      return matchesSearch && matchesFilter;
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const normalizedDate = dateString.includes('-') 
      ? dateString 
      : `${dateString.substr(0, 4)}-${dateString.substr(4, 2)}-${dateString.substr(6, 2)}`;
    return this.datePipe.transform(normalizedDate, 'dd-MMM-yyyy') || dateString;
  }

  getStatusClass(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('approved') || statusLower.includes('completed')) {
      return 'approved';
    } else if (statusLower.includes('pending') || statusLower.includes('submitted')) {
      return 'pending';
    } else if (statusLower.includes('rejected') || statusLower.includes('cancelled')) {
      return 'rejected';
    }
    return 'completed';
  }

  getLeaveTypeClass(leaveType: string): string {
    const type = leaveType?.toLowerCase() || '';
    if (type.includes('annual') || type.includes('vacation')) {
      return 'annual';
    } else if (type.includes('sick') || type.includes('medical')) {
      return 'sick';
    } else if (type.includes('personal') || type.includes('emergency')) {
      return 'personal';
    }
    return 'default';
  }

  getLeaveTypeIcon(leaveType: string): string {
    const type = leaveType?.toLowerCase() || '';
    if (type.includes('annual') || type.includes('vacation')) {
      return '🏖️';
    } else if (type.includes('sick') || type.includes('medical')) {
      return '🏥';
    } else if (type.includes('personal') || type.includes('emergency')) {
      return '👤';
    }
    return '📅';
  }
}