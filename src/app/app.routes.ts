import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AdminLoginComponent } from './pages/admin/admin-login.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard.component';
import { adminGuard } from './guards/admin.guard';

// The new UI handles Home + Category + Restaurant + Cart all inside HomeComponent.
// Old /cart and /restaurant/:id routes redirect to home.
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: '' },
];
