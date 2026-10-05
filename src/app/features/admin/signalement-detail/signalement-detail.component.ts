import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { SignalementService } from '../../../core/services/signalement.service';
import { Signalement } from '../../../core/models/signalement.model';

import {
  EnumStatut,
  EnumTypeUrgence
} from '../../../core/models/enums.model';

@Component({
  selector: 'app-signalement-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './signalement-detail.component.html',
  styleUrl: './signalement-detail.component.css'
})
export class SignalementDetailComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);

  private readonly signalementService =
    inject(SignalementService);

  // Permet d'utiliser EnumStatut dans le HTML
  readonly EnumStatut = EnumStatut;

  sig: Signalement | null = null;

  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadSignalement();
  }

  loadSignalement(): void {

    const idParam =
      this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.errorMessage =
        'Identifiant du signalement introuvable.';
      return;
    }

    const idSignalement =
      Number(idParam);

    if (isNaN(idSignalement)) {
      this.errorMessage =
        'Identifiant du signalement invalide.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.signalementService
      .getById(idSignalement)
      .subscribe({

        next: (signalement: Signalement) => {

          this.sig = signalement;

          this.isLoading = false;
        },

        error: (error) => {

          console.error(
            'Erreur lors du chargement du signalement :',
            error
          );

          this.errorMessage =
            'Impossible de charger les détails du signalement.';

          this.isLoading = false;
        }

      });
  }

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

    return parsedDate.toLocaleString(
      'fr-FR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  }
}