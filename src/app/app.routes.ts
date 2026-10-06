import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { AdminLayoutComponent } from './core/layout/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';
import { SignalementsListComponent } from './features/admin/signalements-list/signalements-list.component';
import { SignalementDetailComponent } from './features/admin/signalement-detail/signalement-detail.component';
import { StructuresManagementComponent } from './features/admin/structures-management/structures-management.component';
// AuthGuard will be added later if needed, but for now we focus on structure

import { UtilisateursListComponent } from './features/admin/utilisateurs-list/utilisateurs-list.component';
import { StructureDashboardComponent } from './features/structure/structure-dashboard/structure-dashboard.component';
import { StructureSignalementsListComponent } from './features/structure/signalements-list/structure-signalements-list.component';
import { StructureSignalementDetailComponent } from './features/structure/signalement-detail/structure-signalement-detail.component';
import { EnumRole } from './core/models/enums.model';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'auth/login', component: LoginComponent },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'signalements', component: SignalementsListComponent },
      { path: 'signalements/:id', component: SignalementDetailComponent },
      { path: 'structures', component: StructuresManagementComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'utilisateurs', component: UtilisateursListComponent },
    ]
  },
  {
    path: 'structure',
    component: AdminLayoutComponent,
    canActivate: [roleGuard],
    data: { roles: [EnumRole.STRUCTURE] },
    children: [
      { path: 'dashboard', component: StructureDashboardComponent },
      { path: 'signalements', component: StructureSignalementsListComponent },
      { path: 'signalements/:id', component: StructureSignalementDetailComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'admin/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth/login' }
];