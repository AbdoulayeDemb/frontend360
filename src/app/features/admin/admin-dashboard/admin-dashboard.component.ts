import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { SignalementService } from '../../../core/services/signalement.service';
import { AdminSearchService } from '../../../core/services/admin-search.service';

import { Signalement } from '../../../core/models/signalement.model';

import {
  EnumStatut,
  EnumTypeUrgence
} from '../../../core/models/enums.model';


@Component({
  selector: 'app-admin-dashboard',
  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent
  implements OnInit, OnDestroy {


  // =========================================================
  // SERVICES
  // =========================================================

  private readonly signalementService =
    inject(SignalementService);

  private readonly adminSearchService =
    inject(AdminSearchService);

  private readonly router =
    inject(Router);


  // =========================================================
  // ABONNEMENT RECHERCHE
  // =========================================================

  private searchSubscription?: Subscription;


  // =========================================================
  // DONNÉES
  // =========================================================

  signalements: Signalement[] = [];

  recentSignalements: Signalement[] = [];

  /**
   * Signalements correspondant à la recherche.
   */
  filteredSignalements: Signalement[] = [];


  // =========================================================
  // RECHERCHE
  // =========================================================

  searchTerm = '';


  // =========================================================
  // STATISTIQUES
  // =========================================================

  stats = {
    total: 0,
    declares: 0,
    enCours: 0,
    resolus: 0,
    rejetes: 0
  };


  // =========================================================
  // ÉTAT
  // =========================================================

  isLoading = false;

  errorMessage = '';


  // =========================================================
  // ENUMS ACCESSIBLES AU TEMPLATE
  // =========================================================

  readonly EnumStatut =
    EnumStatut;

  readonly EnumTypeUrgence =
    EnumTypeUrgence;


  // =========================================================
  // INITIALISATION
  // =========================================================

  ngOnInit(): void {

    this.loadDashboard();

    this.searchSubscription =
      this.adminSearchService.search$
        .subscribe(searchTerm => {

          this.searchTerm =
            searchTerm;

          this.applySearch();
        });
  }


  // =========================================================
  // DESTRUCTION
  // =========================================================

  ngOnDestroy(): void {

    this.searchSubscription?.unsubscribe();
  }


  // =========================================================
  // CHARGEMENT
  // =========================================================

  loadDashboard(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.signalementService
      .getAll()
      .subscribe({

        next: (signalements) => {

          this.signalements =
            signalements;

          this.calculateStats();

          this.applySearch();

          this.isLoading = false;
        },

        error: (error) => {

          console.error(
            'Erreur lors du chargement du dashboard :',
            error
          );

          this.errorMessage =
            'Impossible de charger les données du dashboard.';

          this.isLoading = false;
        }

      });
  }


  // =========================================================
  // RECHERCHE
  // =========================================================

  /**
   * Filtre les signalements selon
   * le terme provenant du Topbar.
   */
  private applySearch(): void {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();


    // ---------------------------------------------------------
    // Aucune recherche
    // ---------------------------------------------------------

    if (!search) {

      this.filteredSignalements = [
        ...this.signalements
      ];

    }

    // ---------------------------------------------------------
    // Recherche active
    // ---------------------------------------------------------

    else {

      this.filteredSignalements =
        this.signalements.filter(
          signalement => {

            const code =
              signalement.codeTrackingUnique
                ?.toLowerCase() || '';

            const categorie =
              signalement.nomCategorie
                ?.toLowerCase() || '';

            const citoyen =
              signalement.citoyenNomComplet
                ?.toLowerCase() || '';

            const structure =
              signalement.nomStructureAssignee
                ?.toLowerCase() || '';

            const description =
              signalement.description
                ?.toLowerCase() || '';

            const repere =
              signalement.repereVisuel
                ?.toLowerCase() || '';


            return (

              code.includes(search) ||

              categorie.includes(search) ||

              citoyen.includes(search) ||

              structure.includes(search) ||

              description.includes(search) ||

              repere.includes(search)

            );
          }
        );
    }


    // ---------------------------------------------------------
    // Mise à jour des signalements récents
    // ---------------------------------------------------------

    this.loadRecentSignalements();
  }


  // =========================================================
  // CALCUL DES STATISTIQUES
  // =========================================================

  private calculateStats(): void {

    this.stats.total =
      this.signalements.length;

    this.stats.declares =
      this.countByStatut(
        EnumStatut.DECLARE
      );

    this.stats.enCours =
      this.countByStatut(
        EnumStatut.EN_COURS
      );

    this.stats.resolus =
      this.countByStatut(
        EnumStatut.RESOLU
      );

    this.stats.rejetes =
      this.countByStatut(
        EnumStatut.REJETE
      );
  }


  private countByStatut(
    statut: EnumStatut
  ): number {

    return this.signalements.filter(
      signalement =>
        signalement.statut === statut
    ).length;
  }


  // =========================================================
  // SIGNALEMENTS RÉCENTS
  // =========================================================

  private loadRecentSignalements(): void {

    this.recentSignalements =
      [...this.filteredSignalements]
        .sort(
          (a, b) =>
            new Date(
              b.dateHeureAlerte
            ).getTime() -
            new Date(
              a.dateHeureAlerte
            ).getTime()
        )
        .slice(0, 5);
  }


  // =========================================================
  // NAVIGATION
  // =========================================================

  voirDetail(
    idSignalement: number
  ): void {

    this.router.navigate([
      '/admin/signalements',
      idSignalement
    ]);
  }


  voirTousLesSignalements(): void {

    this.router.navigate([
      '/admin/signalements'
    ]);
  }


  // =========================================================
  // LABELS STATUT
  // =========================================================

  getStatutLabel(
    statut: EnumStatut
  ): string {

    switch (statut) {

      case EnumStatut.DECLARE:
        return 'Déclaré';

      case EnumStatut.EN_COURS:
        return 'En cours';

      case EnumStatut.RESOLU:
        return 'Résolu';

      case EnumStatut.REJETE:
        return 'Rejeté';

      default:
        return statut;
    }
  }


  getStatutClass(
    statut: EnumStatut
  ): string {

    switch (statut) {

      case EnumStatut.DECLARE:
        return 'badge-warning';

      case EnumStatut.EN_COURS:
        return 'badge-info';

      case EnumStatut.RESOLU:
        return 'badge-success';

      case EnumStatut.REJETE:
        return 'badge-danger';

      default:
        return '';
    }
  }


  // =========================================================
  // LABELS URGENCE
  // =========================================================

  getUrgenceLabel(
    urgence: EnumTypeUrgence
  ): string {

    switch (urgence) {

      case EnumTypeUrgence.FAIBLE:
        return 'Faible';

      case EnumTypeUrgence.MOYENNE:
        return 'Moyenne';

      case EnumTypeUrgence.ELEVEE:
        return 'Élevée';

      case EnumTypeUrgence.CRITIQUE:
        return 'Critique';

      default:
        return urgence;
    }
  }


  getUrgenceClass(
    urgence: EnumTypeUrgence
  ): string {

    switch (urgence) {

      case EnumTypeUrgence.CRITIQUE:
      case EnumTypeUrgence.ELEVEE:
        return 'badge-danger';

      case EnumTypeUrgence.MOYENNE:
        return 'badge-warning';

      case EnumTypeUrgence.FAIBLE:
        return 'badge-success';

      default:
        return '';
    }
  }


  // =========================================================
  // DATE
  // =========================================================

  formatDate(
    date: string
  ): string {

    if (!date) {
      return '-';
    }

    const parsedDate =
      new Date(date);

    if (
      isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      'fr-FR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    );
  }


  formatDateRelative(
    date: string
  ): string {

    if (!date) {
      return '-';
    }

    const parsedDate =
      new Date(date);

    if (
      isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    const now =
      new Date().getTime();

    const timestamp =
      parsedDate.getTime();

    const difference =
      now - timestamp;


    const minute =
      60 * 1000;

    const hour =
      60 * minute;

    const day =
      24 * hour;


    if (difference < minute) {
      return 'À l’instant';
    }


    if (difference < hour) {

      const minutes =
        Math.floor(
          difference / minute
        );

      return `Il y a ${minutes} min`;
    }


    if (difference < day) {

      const hours =
        Math.floor(
          difference / hour
        );

      return `Il y a ${hours}h`;
    }


    if (difference < 2 * day) {
      return 'Hier';
    }


    return this.formatDate(date);
  }
}