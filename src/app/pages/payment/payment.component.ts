import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

interface PaymentAnalytics {
  currentSalary: number;
  ytdEarnings: number;
  totalTaxDeducted: number;
  averageNetPay: number;
  salaryIncrease: number;
  monthsWorked: number;
  taxRate: number;
  payslipsGenerated: number;
}

interface RecentPayslip {
  month: string;
  year: number;
  amount: number;
  generatedDate: string;
}

@Component({
  selector: 'app-payslip',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgChartsModule
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  isLoading = false;
  error: string = '';
  successMessage: string = '';
  pernr: string = '';
  pdfUrl: string | null = null;
  
  paymentAnalytics: PaymentAnalytics | null = null;
  chartData: any = null;
  chartOptions: any = {};
  recentPayslips: RecentPayslip[] = [];

  months = [
    { value: '01', name: 'January' },
    { value: '02', name: 'February' },
    { value: '03', name: 'March' },
    { value: '04', name: 'April' },
    { value: '05', name: 'May' },
    { value: '06', name: 'June' },
    { value: '07', name: 'July' },
    { value: '08', name: 'August' },
    { value: '09', name: 'September' },
    { value: '10', name: 'October' },
    { value: '11', name: 'November' },
    { value: '12', name: 'December' }
  ];
  
  years: number[] = [];

  payslipForm = new FormGroup({
    month: new FormControl('', [Validators.required]),
    year: new FormControl('', [Validators.required])
  });

  constructor(private http: HttpClient) {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 10; year--) {
      this.years.push(year);
    }
    this.initializeChartOptions();
  }

  ngOnInit(): void {
    this.pernr = localStorage.getItem('employeeId') || '';
    if (!this.pernr) {
      this.error = 'Employee ID not found. Please log in again.';
    } else {
      this.generateMockAnalytics();
      this.generateMockChartData();
      this.generateRecentPayslips();
    }
  }

  generateMockAnalytics(): void {
    // Generate realistic payment analytics
    const currentSalary = 5200 + Math.floor(Math.random() * 3000);
    const monthsWorked = new Date().getMonth() + 1;
    const ytdEarnings = currentSalary * monthsWorked;
    const taxRate = 22;
    const totalTaxDeducted = Math.floor(ytdEarnings * (taxRate / 100));
    const averageNetPay = Math.floor((ytdEarnings - totalTaxDeducted) / monthsWorked);

    this.paymentAnalytics = {
      currentSalary,
      ytdEarnings,
      totalTaxDeducted,
      averageNetPay,
      salaryIncrease: 3.5,
      monthsWorked,
      taxRate,
      payslipsGenerated: monthsWorked + 12 // Current year + previous year
    };
  }

  generateMockChartData(): void {
    // Generate salary trend for last 12 months
    const months = [];
    const salaryData = [];
    const currentDate = new Date();
    const baseSalary = this.paymentAnalytics?.currentSalary || 5200;
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push(monthName);
      
      // Add some variation to salary (bonuses, overtime, etc.)
      const variation = (Math.random() - 0.5) * 500;
      salaryData.push(Math.floor(baseSalary + variation));
    }

    // Generate deductions breakdown
    const grossSalary = baseSalary;
    const deductions = {
      'Federal Tax': Math.floor(grossSalary * 0.15),
      'State Tax': Math.floor(grossSalary * 0.07),
      'Social Security': Math.floor(grossSalary * 0.062),
      'Medicare': Math.floor(grossSalary * 0.0145),
      'Health Insurance': 250,
      '401k': Math.floor(grossSalary * 0.06)
    };

    this.chartData = {
      salaryTrend: {
        labels: months,
        datasets: [{
          label: 'Net Salary',
          data: salaryData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      deductionsBreakdown: {
        labels: Object.keys(deductions),
        datasets: [{
          data: Object.values(deductions),
          backgroundColor: [
            '#ef4444',
            '#f59e0b',
            '#10b981',
            '#3b82f6',
            '#8b5cf6',
            '#06b6d4'
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      }
    };
  }

  generateRecentPayslips(): void {
    const currentDate = new Date();
    this.recentPayslips = [];
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      const year = date.getFullYear();
      const amount = (this.paymentAnalytics?.averageNetPay || 4000) + Math.floor((Math.random() - 0.5) * 400);
      const generatedDate = new Date(date.getFullYear(), date.getMonth() + 1, 5).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      this.recentPayslips.push({
        month: monthName,
        year,
        amount,
        generatedDate
      });
    }
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
            borderColor: '#3b82f6',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (context: any) => `$${context.parsed.y.toLocaleString()}`
            }
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
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 12,
                weight: '500'
              },
              callback: (value: any) => `$${value.toLocaleString()}`
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
            borderColor: '#3b82f6',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: (context: any) => `${context.label}: $${context.parsed.toLocaleString()}`
            }
          }
        },
        cutout: '60%'
      }
    };
  }

  fetchPayslip(): void {
    if (this.payslipForm.invalid || !this.pernr) {
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.successMessage = '';
    this.pdfUrl = null;

    const formValue = this.payslipForm.value;
    const month = formValue.month || '';
    const year = formValue.year || '';

    this.http.post(
      'http://localhost:3030/paymentslip',
      {
        employeeId: this.pernr,
        month: month,
        year: year
      },
      { responseType: 'blob' }
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        const blob = new Blob([response], { type: 'application/pdf' });
        this.pdfUrl = URL.createObjectURL(blob);
        
        this.handlePdfResponse(response, `Payslip_${this.pernr}_${year}${month}.pdf`);
        this.successMessage = 'Payslip generated successfully!';
        
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Failed to generate payslip. Please try again.';
        console.error('Payslip error:', err);
      }
    });
  }

  private handlePdfResponse(pdfBlob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  printPayslip(): void {
    if (!this.pdfUrl) return;
    
    const printWindow = window.open(this.pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  mailPayslip(): void {
    if (!this.pdfUrl) return;
    
    this.successMessage = 'Email functionality would be implemented here';
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  downloadRecentPayslip(payslip: RecentPayslip): void {
    // Simulate downloading a recent payslip
    this.isLoading = true;
    
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = `Downloaded ${payslip.month} ${payslip.year} payslip`;
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }, 1000);
  }

  closePdfPreview(): void {
    if (this.pdfUrl) {
      URL.revokeObjectURL(this.pdfUrl);
      this.pdfUrl = null;
    }
  }
}