import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { EnumStatut, EnumTypeUrgence } from '../../../core/models/enums.model';
import { Signalement } from '../../../core/models/signalement.model';
import { AuthService } from '../../../core/services/auth.service';
import { SignalementService } from '../../../core/services/signalement.service';

@Component({
  selector: 'app-structure-signalement-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './structure-signalement-detail.component.html',
  styleUrl: './structure-signalement-detail.component.css'
})
export class StructureSignalementDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly signalementService = inject(SignalementService);

  readonly EnumStatut = EnumStatut;
  readonly structureId = this.authService.getIdStructure();
  signalement: Signalement | null = null;
  isLoading = false;
  isUpdating = false;
  errorMessage = '';
  actionMessage = '';

  ngOnInit(): void {
    this.loadSignalement();
  }

  loadSignalement(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id < 1) {
      this.errorMessage = 'Identifiant du signalement invalide.';
      return;
    }
    if (this.structureId === null) {
      this.errorMessage = 'Aucune structure n’est associée à ce compte.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.signalementService.getByStructure(this.structureId).subscribe({
      next: signalements => {
        this.signalement = signalements.find(item => item.idSignalement === id) ?? null;
        if (!this.signalement) {
          this.errorMessage = 'Ce signalement n’est pas attribué à votre structure.';
        }
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement du signalement :', error);
        this.errorMessage = 'Impossible de charger le signalement.';
        this.isLoading = false;
      }
    });
  }

  getStatusLabel(statut: EnumStatut): string {
    const labels: Record<EnumStatut, string> = {
      [EnumStatut.DECLARE]: 'Nouveau',
      [EnumStatut.EN_COURS]: 'En cours',
      [EnumStatut.RESOLU]: 'Résolu',
      [EnumStatut.REJETE]: 'Refusé'
    };
    return labels[statut] ?? statut;
  }

  getStatusClass(statut: EnumStatut): string {
    const classes: Record<EnumStatut, string> = {
      [EnumStatut.DECLARE]: 'status-new',
      [EnumStatut.EN_COURS]: 'status-progress',
      [EnumStatut.RESOLU]: 'status-resolved',
      [EnumStatut.REJETE]: 'status-rejected'
    };
    return classes[statut] ?? '';
  }

  getUrgencyLabel(urgence: EnumTypeUrgence): string {
    const labels: Record<EnumTypeUrgence, string> = {
      [EnumTypeUrgence.FAIBLE]: 'Faible',
      [EnumTypeUrgence.MOYENNE]: 'Moyenne',
      [EnumTypeUrgence.ELEVEE]: 'Élevée',
      [EnumTypeUrgence.CRITIQUE]: 'Critique'
    };
    return labels[urgence] ?? urgence;
  }

  formatDate(date: string): string {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
  }

    formatCoordinate(value: number, axis: 'latitude' | 'longitude'): string {
      const hemisphere = axis === 'latitude'
        ? value >= 0 ? 'N' : 'S'
        : value >= 0 ? 'E' : 'W';
      return `${Math.abs(value).toFixed(4)}° ${hemisphere}`;
    }

  takeCharge(): void {
    this.updateStatus(EnumStatut.EN_COURS, 'Le signalement est maintenant pris en charge.');
  }

  refuse(): void {
    if (this.signalement && window.confirm('Confirmer le refus de ce signalement ?')) {
      this.updateStatus(EnumStatut.REJETE, 'Le signalement a été refusé.');
    }
  }

  private updateStatus(statut: EnumStatut, successMessage: string): void {
    if (!this.signalement || this.isUpdating) return;
    this.isUpdating = true;
    this.actionMessage = '';
    this.errorMessage = '';
    this.signalementService.changeStatut(this.signalement.idSignalement, statut).subscribe({
      next: signalement => {
        this.signalement = signalement;
        this.actionMessage = successMessage;
        this.isUpdating = false;
      },
      error: error => {
        console.error('Erreur lors de la mise à jour du statut :', error);
        this.errorMessage = 'La mise à jour du statut a échoué. Réessayez.';
        this.isUpdating = false;
      }
    });
  }
}