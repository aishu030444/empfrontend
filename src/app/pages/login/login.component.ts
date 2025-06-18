import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, HttpClientModule]
})
export class LoginComponent {
  empno = '';  // Changed from custno to empno to match backend
  password = '';
  errorMessage: string = '';
  rememberMe = false;
  isLoading = false;

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.post<any>('http://localhost:3030/login', {
      EMPNO: this.empno,
      PASSWORD: this.password
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'S') {
          localStorage.setItem('employeeId', this.empno);
          this.router.navigate(['/home']);
        } else {
          this.errorMessage = response.message || 'Authentication failed';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}