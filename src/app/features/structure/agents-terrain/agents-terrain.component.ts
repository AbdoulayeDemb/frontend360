import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AgentStructureResponseDto } from '../../../core/models/agent-structure.model';
import { AgentService } from '../../../core/services/agent.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-agents-terrain',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './agents-terrain.component.html',
  styleUrl: './agents-terrain.component.css'
})
export class AgentsTerrainComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly agentService = inject(AgentService);

  readonly currentUser = this.authService.currentUserValue;
  readonly structureName = this.currentUser?.nomStructure || 'Votre structure';
  readonly isResponsable = this.currentUser?.estResponsable ?? false;
  readonly structureId = this.authService.getIdStructure();

  selectedFilter = 'Tous';
  searchTerm = '';
  agents: AgentStructureResponseDto[] = [];
  isLoading = false;
  errorMessage = '';

  private readonly avatarColors = ['#d4b2a4', '#95bdb3', '#bca5d9', '#d9bfa8', '#cdbaf2'];

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    if (this.structureId === null) {
      this.errorMessage = 'Aucune structure n’est associée à ce compte.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.agentService.obtenirAgentsParStructure(this.structureId).subscribe({
      next: agents => {
        this.agents = agents.filter(agent => !agent.estResponsable);
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement des agents de la structure :', error);
        this.errorMessage = 'Impossible de charger les agents de votre structure.';
        this.isLoading = false;
      }
    });
  }

  readonly filters = ['Tous', 'Actifs', 'Inactifs'];

  get filteredAgents() {
    const query = this.searchTerm.trim().toLowerCase();

    return this.agents.filter((agent) => {
      const matchesFilter =
        this.selectedFilter === 'Tous' ||
        (this.selectedFilter === 'Actifs' && agent.estActif) ||
        (this.selectedFilter === 'Inactifs' && !agent.estActif);

      const matchesSearch =
        !query ||
        `${agent.prenom} ${agent.nom}`.toLocaleLowerCase('fr').includes(query) ||
        agent.matriculeAgent?.toLocaleLowerCase('fr').includes(query) ||
        agent.telephone?.toLocaleLowerCase('fr').includes(query) ||
        agent.email?.toLocaleLowerCase('fr').includes(query);

      return matchesFilter && matchesSearch;
    });
  }

  get totalActifs(): number {
    return this.agents.filter(agent => agent.estActif).length;
  }

  get totalInactifs(): number {
    return this.agents.filter(agent => !agent.estActif).length;
  }

  get displayCount(): number {
    return this.filteredAgents.length;
  }

  getStatusLabel(estActif: boolean): string {
    return estActif ? 'Actif' : 'Inactif';
  }

  getStatusClass(estActif: boolean): string {
    return estActif ? 'status status-active' : 'status status-inactive';
  }

  getAvatarStyle(idUtilisateur: number): Record<string, string> {
    return { background: this.avatarColors[idUtilisateur % this.avatarColors.length] };
  }
}
