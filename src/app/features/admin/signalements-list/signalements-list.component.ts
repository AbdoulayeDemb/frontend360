import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { SignalementService } from '../../../core/services/signalement.service';
import { Signalement } from '../../../core/models/signalement.model';
import {
  EnumStatut,
  EnumTypeUrgence
} from '../../../core/models/enums.model';

@Component({
  selector: 'app-signalements-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signalements-list.component.html',
  styleUrl: './signalements-list.component.css'
})
export class SignalementsListComponent implements OnInit {

  private readonly signalementService =
    inject(SignalementService);

  private readonly router =
    inject(Router);

  signalements: Signalement[] = [];

  filteredSignalements: Signalement[] = [];

  searchTerm = '';

  selectedStatut = '';

  selectedUrgence = '';

  isLoading = false;

  errorMessage = '';

  ngOnInit(): void {
    this.loadSignalements();
  }

  /**
   * Chargement des signalements depuis le backend.
   */
  loadSignalements(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.signalementService.getAll().subscribe({

      next: (signalements) => {
        this.signalements = signalements;
        this.applyFilters();
        this.isLoading = false;
      },

      error: (error) => {
        console.error(
          'Erreur lors du chargement des signalements :',
          error
        );

        this.errorMessage =
          'Impossible de charger les signalements.';

        this.isLoading = false;
      }
    });
  }

  /**
   * Recherche + filtres.
   */
  applyFilters(): void {

    const search =
      this.searchTerm.trim().toLowerCase();

    this.filteredSignalements =
      this.signalements.filter((sig) => {

        const matchesSearch =
          !search ||

          sig.codeTrackingUnique
            ?.toLowerCase()
            .includes(search) ||

          sig.nomCategorie
            ?.toLowerCase()
            .includes(search) ||

          sig.citoyenNomComplet
            ?.toLowerCase()
            .includes(search) ||

          sig.nomStructureAssignee
            ?.toLowerCase()
            .includes(search);

        const matchesStatut =
          !this.selectedStatut ||
          sig.statut === this.selectedStatut;

        const matchesUrgence =
          !this.selectedUrgence ||
          sig.typeUrgence === this.selectedUrgence;

        return (
          matchesSearch &&
          matchesStatut &&
          matchesUrgence
        );
      });
  }

  /**
   * Recherche textuelle.
   */
  onSearch(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    this.searchTerm = input.value;

    this.applyFilters();
  }

  /**
   * Filtre par statut.
   */
  onStatutChange(event: Event): void {

    const select =
      event.target as HTMLSelectElement;

    this.selectedStatut = select.value;

    this.applyFilters();
  }

  /**
   * Filtre par urgence.
   */
  onUrgenceChange(event: Event): void {

    const select =
      event.target as HTMLSelectElement;

    this.selectedUrgence = select.value;

    this.applyFilters();
  }

  /**
   * Ouvre le détail d'un signalement.
   */
  voirDetail(idSignalement: number): void {

    this.router.navigate([
      '/admin/signalements',
      idSignalement
    ]);
  }

  /**
   * Libellé affiché pour le statut.
   */
  getStatutLabel(statut: EnumStatut): string {

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

  /**
   * Libellé affiché pour l'urgence.
   */
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

  /**
   * Classe CSS pour l'urgence.
   */
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

  /**
   * Classe CSS pour le statut.
   */
  getStatutClass(statut: EnumStatut): string {

    switch (statut) {

      case EnumStatut.DECLARE:
        return 'badge-blue';

      case EnumStatut.EN_COURS:
        return 'badge-orange';

      case EnumStatut.RESOLU:
        return 'badge-green';

      case EnumStatut.REJETE:
        return 'badge-danger';

      default:
        return '';
    }
  }

  /**
   * Nom complet du citoyen.
   */
  getCitoyenName(
    signalement: Signalement
  ): string {

    return signalement.citoyenNomComplet ||
      'Citoyen inconnu';
  }

  /**
   * Structure assignée.
   */
  getStructureName(
    signalement: Signalement
  ): string {

    return signalement.nomStructureAssignee ||
      'Non assignée';
  }

  /**
   * Date formatée.
   */
  formatDate(
    date: string
  ): string {

    if (!date) {
      return '-';
    }

    const parsedDate =
      new Date(date);

    if (isNaN(parsedDate.getTime())) {
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
}