import { Routes } from '@angular/router';

import { LoginComponent } from './features/auth/login.component';

import { AdminLayoutComponent } from './core/layout/admin-layout/admin-layout.component';

import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';

import { SignalementsListComponent } from './features/admin/signalements-list/signalements-list.component';

import { SignalementDetailComponent } from './features/admin/signalement-detail/signalement-detail.component';

import { StructuresManagementComponent } from './features/admin/structures-management/structures-management.component';

import { StructureFormComponent } from './features/admin/structure-form/structure-form.component';

import { UtilisateursListComponent } from './features/admin/utilisateurs-list/utilisateurs-list.component';
import { StructureDashboardComponent } from './features/structure/structure-dashboard/structure-dashboard.component';
import { SignalementsMapComponent } from './features/admin/signalements-map/signalements-map.component';
import { StructureSignalementsListComponent } from './features/structure/signalements-list/structure-signalements-list.component';
import { SignalementsAssignationComponent } from './features/structure/signalements-assignation/signalements-assignation.component';
import { StructureSignalementDetailComponent } from './features/structure/signalement-detail/structure-signalement-detail.component';
import { AgentsTerrainComponent } from './features/structure/agents-terrain/agents-terrain.component';
import { StructureAgentFormComponent } from './features/structure/agents-terrain/structure-agent-form.component';
import { StructureAgentDetailComponent } from './features/structure/agents-terrain/structure-agent-detail.component';
import { AbusComponent } from './features/structure/abus/abus.component';
import { AbusFormComponent } from './features/structure/abus/abus-form.component';
import { RapportComponent } from './features/structure/rapport/rapport.component';
import { RapportProfileComponent } from './features/structure/rapport-profile/rapport-profile.component';
import { StructurePreuvesComponent } from './features/structure/preuves/structure-preuves.component';
import { StructureSignalementsMapComponent } from './features/structure/structure-map/structure-signalements-map.component';
import { EnumRole } from './core/models/enums.model';
import { roleGuard } from './core/guards/role.guard';

import { UtilisateurFormComponent } from './features/admin/utilisateur-form/utilisateur-form.component';

import { ActualitesManagementComponent } from './features/admin/actualites-management/actualites-management.component';

import { ActualiteFormComponent } from './features/admin/actualite-form/actualite-form.component';

import { ContenusEducatifsManagementComponent } from './features/admin/contenus-educatifs-management/contenus-educatifs-management.component';

import { ContenuEducatifFormComponent } from './features/admin/contenu-educatif-form/contenu-educatif-form.component';

import { GestionAbusComponent } from './features/admin/abus-management/gestion-abus.component';


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


      // GESTION DES ABUS
      {
        path: 'gestion-abus',
        component: GestionAbusComponent
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
      // ACTUALITÉS
      // =========================

      // Ajouter une actualité
      {
        path: 'actualites/nouveau',
        component: ActualiteFormComponent
      },

      // Modifier une actualité
      {
        path: 'actualites/:id/modifier',
        component: ActualiteFormComponent
      },

      // Liste des actualités
      {
        path: 'actualites',
        component: ActualitesManagementComponent
      },


      // =========================
      // CONTENUS ÉDUCATIFS
      // =========================

      // Ajouter un contenu éducatif
      {
        path: 'contenus-educatifs/nouveau',
        component: ContenuEducatifFormComponent
      },

      // Modifier un contenu éducatif
      {
        path: 'contenus-educatifs/:id/modifier',
        component: ContenuEducatifFormComponent
      },

      // Liste des contenus éducatifs
      {
        path: 'contenus-educatifs',
        component: ContenusEducatifsManagementComponent
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
  {
    path: 'structure',
    component: AdminLayoutComponent,
    canActivate: [roleGuard],
    data: { roles: [EnumRole.STRUCTURE] },
    children: [
      { path: 'dashboard', component: StructureDashboardComponent },
      { path: 'signalements', component: StructureSignalementsListComponent },
      { path: 'signalements/:id/assigner', component: SignalementsAssignationComponent },
      { path: 'signalements/:id', component: StructureSignalementDetailComponent },
      { path: 'agents/nouveau', component: StructureAgentFormComponent },
      { path: 'agents/:id/modifier', component: StructureAgentFormComponent },
      { path: 'agents/:id', component: StructureAgentDetailComponent },
      { path: 'agents', component: AgentsTerrainComponent },
      { path: 'carte', component: StructureSignalementsMapComponent },
      { path: 'abus/nouveau/:idSignalement', component: AbusFormComponent },
      { path: 'abus', component: AbusComponent },
      { path: 'rapport', component: RapportComponent },
      { path: 'preuves', component: StructurePreuvesComponent },
      { path: 'profil', component: RapportProfileComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },


  // =========================
  // ROUTE RACINE
  // =========================

  {
    path: '',
    redirectTo: 'auth/login',
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