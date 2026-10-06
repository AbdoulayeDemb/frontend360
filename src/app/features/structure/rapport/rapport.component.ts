import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';

import { EnumStatut } from '../../../core/models/enums.model';
import { Signalement } from '../../../core/models/signalement.model';
import { AuthService } from '../../../core/services/auth.service';
import { SignalementService } from '../../../core/services/signalement.service';

@Component({
  selector: 'app-structure-rapport',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rapport.component.html',
  styleUrl: './rapport.component.css'
})
export class RapportComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly signalementService = inject(SignalementService);

  private readonly structureId = this.authService.getIdStructure();

  signalements: Signalement[] = [];
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    if (this.structureId === null) {
      this.errorMessage = 'Aucune structure n’est associée à ce compte.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.signalementService.getByStructure(this.structureId).subscribe({
      next: signalements => {
        this.signalements = [...signalements].sort(
          (first, second) => new Date(second.dateHeureAlerte).getTime() - new Date(first.dateHeureAlerte).getTime()
        );
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement du rapport :', error);
        this.errorMessage = 'Impossible de charger le rapport de votre structure.';
        this.isLoading = false;
      }
    });
  }

  get total(): number {
    return this.signalements.length;
  }

  get declarations(): number {
    return this.signalements.filter(signalement => signalement.statut === EnumStatut.DECLARE).length;
  }

  get enCours(): number {
    return this.signalements.filter(signalement => signalement.statut === EnumStatut.EN_COURS).length;
  }

  get resolus(): number {
    return this.signalements.filter(signalement => signalement.statut === EnumStatut.RESOLU).length;
  }

  get rejetes(): number {
    return this.signalements.filter(signalement => signalement.statut === EnumStatut.REJETE).length;
  }

  get dernierSignalement(): Signalement | undefined {
    return this.signalements[0];
  }

  formatDate(date: string): string {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
