import { Routes } from '@angular/router';

import { LoginComponent } from './features/auth/login.component';

import { AdminLayoutComponent } from './core/layout/admin-layout/admin-layout.component';

import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';

import { SignalementsListComponent } from './features/admin/signalements-list/signalements-list.component';

import { SignalementDetailComponent } from './features/admin/signalement-detail/signalement-detail.component';

import { StructuresManagementComponent } from './features/admin/structures-management/structures-management.component';

import { StructureFormComponent } from './features/admin/structure-form/structure-form.component';

import { UtilisateursListComponent } from './features/admin/utilisateurs-list/utilisateurs-list.component';

import { UtilisateurFormComponent } from './features/admin/utilisateur-form/utilisateur-form.component';


export const routes: Routes = [

  // =========================
  // AUTHENTIFICATION
  // =========================

  {
    path: 'auth/login',
    component: LoginComponent
  },


  // =========================
  // ESPACE ADMIN
  // =========================

  {
    path: 'admin',
    component: AdminLayoutComponent,

    children: [

      // =========================
      // DASHBOARD
      // =========================

      {
        path: 'dashboard',
        component: AdminDashboardComponent
      },


      // =========================
      // SIGNALEMENTS
      // =========================

      {
        path: 'signalements',
        component: SignalementsListComponent
      },

      {
        path: 'signalements/:id',
        component: SignalementDetailComponent
      },


      // =========================
      // STRUCTURES
      // =========================

      // Ajouter une structure
      {
        path: 'structures/nouveau',
        component: StructureFormComponent
      },

      // Modifier une structure
      {
        path: 'structures/:id/modifier',
        component: StructureFormComponent
      },

      // Liste des structures
      {
        path: 'structures',
        component: StructuresManagementComponent
      },


      // =========================
      // UTILISATEURS
      // =========================

      // Ajouter un utilisateur
      {
        path: 'utilisateurs/nouveau',
        component: UtilisateurFormComponent
      },

      // Modifier un utilisateur
      {
        path: 'utilisateurs/:id/modifier',
        component: UtilisateurFormComponent
      },

      // Liste des utilisateurs
      {
        path: 'utilisateurs',
        component: UtilisateursListComponent
      },


      // =========================
      // ROUTE ADMIN PAR DÉFAUT
      // =========================

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }

    ]
  },


  // =========================
  // ROUTE RACINE
  // =========================

  {
    path: '',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },


  // =========================
  // ROUTE INCONNUE
  // =========================

  {
    path: '**',
    redirectTo: 'auth/login'
  }

];