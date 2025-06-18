import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError, throwError } from 'rxjs';

@Component({
  selector: 'app-financial-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './financial-invoice.component.html',
  styleUrls: ['./financial-invoice.component.scss']
})
export class FinancialInvoiceComponent implements OnInit {
  INVOICE: any[] = [];
  searchText: string = '';
  key: string = '';
  reverse: boolean = false;
  customerId: string = '';
  isLoading: boolean = false;
  errorMessage: string | null = null;
  currentPage = 1;
  itemsPerPage = 5;

  // Updated headers to match backend response
  headers = [
    "Customer Number", "Billing Document", "Billing Date", "Item Number", "Billing Type", "Download"
  ];

  names = [
    "Customerno", "billingDoc", "billingDate", "itemNumber", "billingtype", "DOWNLOAD"
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.customerId = localStorage.getItem('customerId') || '';
    
    if (!this.customerId) {
      this.errorMessage = 'Customer ID not found. Please log in again.';
      return;
    }

    this.fetchInvoiceData();
  }

  fetchInvoiceData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.http.post<any>('http://localhost:3000/invoice1', { CUSTNO: this.customerId })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.isLoading = false;
          this.errorMessage = this.getErrorMessage(error);
          return throwError(() => new Error(this.errorMessage || 'Unknown error'));
        })
      )
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.status === 'S' && response.agingDetails) {
            this.INVOICE = response.agingDetails;
          } else {
            this.errorMessage = 'No invoice data found';
            this.INVOICE = [];
          }
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  downloadPDF(billingDoc: string, itemNumber: string): void {
    this.isLoading = true;
    this.errorMessage = null;

 
    const payload = {
      IV_KUNNR: itemNumber,
      IV_VBELN: billingDoc,
      
      
     
    };

    this.http.post('http://localhost:3000/invoice', payload, { 
      responseType: 'blob',
      observe: 'response'
    })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.isLoading = false;
          if (error.status === 404) {
            this.errorMessage = 'Invoice document not found';
          } else {
            this.errorMessage = this.getErrorMessage(error);
          }
          return throwError(() => new Error(this.errorMessage || 'Unknown error'));
        })
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.body) {
            this.handlePdfResponse(response.body, billingDoc);
          } else {
            this.errorMessage = 'Empty PDF response from server';
          }
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  private handlePdfResponse(pdfBlob: Blob, billingDoc: string): void {
    const blob = new Blob([pdfBlob], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const fileName = `Invoice_${billingDoc}.pdf`;

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

  // Rest of your existing methods remain the same...
  sort(key: string): void {
    this.currentPage = 1;
    if (this.key === key) {
      this.reverse = !this.reverse;
    } else {
      this.key = key;
      this.reverse = false;
    }
  }

  get paginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.INVOICE
      .filter(row => JSON.stringify(row).toLowerCase().includes(this.searchText?.toLowerCase() || ''))
      .sort((a, b) => {
        if (!this.key) return 0;
        return this.reverse
          ? (a[this.key] > b[this.key] ? -1 : 1)
          : (a[this.key] < b[this.key] ? -1 : 1);
      })
      .slice(start, start + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(
      this.INVOICE.filter(row => JSON.stringify(row).toLowerCase().includes(this.searchText?.toLowerCase() || '')).length / this.itemsPerPage
    );
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Network error. Please check your connection.';
    } else if (error.status === 400) {
      return 'Invalid request. Please check your inputs.';
    } else if (error.status === 401) {
      return 'Authentication failed. Please log in again.';
    } else if (error.status === 404) {
      return 'Invoice not found for the provided details.';
    } else {
      return error.error?.message || 'Failed to process request. Please try again later.';
    }
  }

  clearError(): void {
    this.errorMessage = null;
  }
}