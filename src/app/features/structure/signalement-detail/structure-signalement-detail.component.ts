import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { AbusResponseDto } from '../../../core/models/abus.model';
import { EnumStatut, EnumTypeUrgence } from '../../../core/models/enums.model';
import { Signalement } from '../../../core/models/signalement.model';
import { AbusService } from '../../../core/services/abus.service';
import { AgentService } from '../../../core/services/agent.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignalementService } from '../../../core/services/signalement.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-structure-signalement-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './structure-signalement-detail.component.html',
  styleUrl: './structure-signalement-detail.component.css'
})
export class StructureSignalementDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly abusService = inject(AbusService);
  private readonly agentService = inject(AgentService);
  private readonly signalementService = inject(SignalementService);

  readonly EnumStatut = EnumStatut;
  readonly structureId = this.authService.getIdStructure();
  readonly isResponsable = this.authService.isResponsableStructure();
  signalement: Signalement | null = null;
  abusExistant: AbusResponseDto | null = null;
  isLoading = false;
  errorMessage = '';

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
    forkJoin({
      signalements: this.signalementService.getByStructure(this.structureId),
      abus: this.abusService.obtenirLesAbus(),
      // Le backend ne renvoie que l'identifiant de l'agent : on récupère son nom
      // via la liste des agents de la structure. Un échec ne bloque pas la page.
      agents: this.agentService.obtenirAgentsParStructure(this.structureId).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ signalements, abus, agents }) => {
        this.signalement = signalements.find(item => item.idSignalement === id) ?? null;
        if (!this.signalement) {
          this.errorMessage = 'Ce signalement n’est pas attribué à votre structure.';
        } else {
          this.abusExistant = abus.find(item => item.idSignalement === id) ?? null;
          const idAgent = this.signalement.idAgentAssigne;
          if (idAgent != null && !this.signalement.agentAssigne) {
            this.signalement.agentAssigne = agents.find(agent => agent.idUtilisateur === idAgent);
          }
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

  getUrgencyClass(urgence: EnumTypeUrgence): string {
    const classes: Record<EnumTypeUrgence, string> = {
      [EnumTypeUrgence.FAIBLE]: 'urgency-low',
      [EnumTypeUrgence.MOYENNE]: 'urgency-medium',
      [EnumTypeUrgence.ELEVEE]: 'urgency-high',
      [EnumTypeUrgence.CRITIQUE]: 'urgency-critical'
    };
    return classes[urgence] ?? '';
  }

  estAssigneAUnAgent(signalement: Signalement): boolean {
    return signalement.idAgentAssigne != null || signalement.agentAssigne != null;
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

}