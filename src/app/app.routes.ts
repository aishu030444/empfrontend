import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { HomeDashboardComponent } from './pages/home/home-dashboard/home-dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { LeaveComponent } from './pages/leave/leave.component';
import { PaymentComponent } from './pages/payment/payment.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent,
    children: [
      {
        path: '',
        component: HomeDashboardComponent, // Default dashboard with cards
        pathMatch: 'full'
      },
      {
        path: 'profile',
        component: ProfileComponent
      },
      {
        path: 'leave',
        component: LeaveComponent
      },
      {
        path: 'payment',
        component: PaymentComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
