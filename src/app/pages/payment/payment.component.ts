import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-payslip',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    ReactiveFormsModule
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  isLoading = false;
  error: string = '';
  pernr: string = '';
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
  pdfUrl: string | null = null;

  payslipForm = new FormGroup({
    month: new FormControl('', [Validators.required]),
    year: new FormControl('', [Validators.required])
  });

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    // Generate years from current year to 10 years back
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 10; year--) {
      this.years.push(year);
    }
  }

  ngOnInit(): void {
    this.pernr = localStorage.getItem('employeeId') || '';
    if (!this.pernr) {
      this.error = 'Employee ID not found. Please log in again.';
    }
  }

  fetchPayslip(): void {
    if (this.payslipForm.invalid || !this.pernr) {
      return;
    }

    this.isLoading = true;
    this.error = '';
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
        
        // Updated file saving logic from invoice template
        this.handlePdfResponse(response, `Payslip_${this.pernr}_${year}${month}.pdf`);
        
        this.snackBar.open('Payslip downloaded successfully!', 'Close', {
          duration: 3000
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Failed to fetch payslip. Please try again.';
        console.error('Payslip error:', err);
        this.snackBar.open('Error fetching payslip!', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
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
    
    // Cleanup
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
    
    this.snackBar.open('Email functionality would be implemented here', 'Close', {
      duration: 3000
    });
  }
}