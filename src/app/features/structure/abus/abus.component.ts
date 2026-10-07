import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { SignalementService } from '../../../core/services/signalement.service';

@Component({
  selector: 'app-structure-abus',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './abus.component.html',
  styleUrl: './abus.component.css'
})
export class AbusComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly signalementService = inject(SignalementService);

  private readonly structureId = this.authService.getIdStructure();
  signalements: unknown[] = [];
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    if (this.structureId === null) {
      this.errorMessage = 'Aucune structure n’est associée à ce compte.';
      return;
    }

    this.isLoading = true;
    this.signalementService.getByStructure(this.structureId).subscribe({
      next: signalements => {
        this.signalements = signalements.filter(signalement =>
          signalement.statut === 'REJETE'
        );
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement des abus :', error);
        this.errorMessage = 'Impossible de charger les signalements pour l’instant.';
        this.isLoading = false;
      }
    });
  }
}
