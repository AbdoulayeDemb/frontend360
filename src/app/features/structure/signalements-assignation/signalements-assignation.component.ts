import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AgentStructureResponseDto } from '../../../core/models/agent-structure.model';
import { EnumStatut, EnumTypeUrgence } from '../../../core/models/enums.model';
import { Signalement } from '../../../core/models/signalement.model';
import { AgentService } from '../../../core/services/agent.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignalementService } from '../../../core/services/signalement.service';

@Component({
	selector: 'app-signalements-assignation',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './signalements-assignation.component.html',
	styleUrl: './signalements-assignation.component.css'
})
export class SignalementsAssignationComponent implements OnInit {
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly authService = inject(AuthService);
	private readonly agentService = inject(AgentService);
	private readonly signalementService = inject(SignalementService);

	readonly EnumTypeUrgence = EnumTypeUrgence;
	readonly structureId = this.authService.getIdStructure();
	signalement: Signalement | null = null;
	agents: AgentStructureResponseDto[] = [];
	searchTerm = '';
	selectedAgentId: number | null = null;
	instruction = '';
	isLoading = false;
	isSubmitting = false;
	errorMessage = '';

	ngOnInit(): void {
		this.loadData();
	}

	loadData(): void {
		const idSignalement = Number(this.route.snapshot.paramMap.get('id'));
		if (!Number.isInteger(idSignalement) || idSignalement < 1) {
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
			agents: this.agentService.obtenirAgentsParStructure(this.structureId)
		}).subscribe({
			next: result => {
				this.signalement = result.signalements.find(item => item.idSignalement === idSignalement) ?? null;
				if (!this.signalement) {
					this.errorMessage = 'Ce signalement n’est pas attribué à votre structure.';
				}
				this.agents = result.agents.filter(agent => !agent.estResponsable && agent.estActif);
				this.isLoading = false;
			},
			error: error => {
				console.error('Erreur lors du chargement des données d’assignation :', error);
				this.errorMessage = 'Impossible de charger le signalement ou les agents de votre structure.';
				this.isLoading = false;
			}
		});
	}

	get filteredAgents(): AgentStructureResponseDto[] {
		const query = this.searchTerm.trim().toLocaleLowerCase('fr');
		return this.agents.filter(agent => {
			if (!query) {
				return true;
			}

			const searchableText = [
				`${agent.prenom} ${agent.nom}`,
				agent.matriculeAgent,
				agent.telephone
			].join(' ').toLocaleLowerCase('fr');

			return searchableText.includes(query);
		});
	}

	getAgentInitials(agent: AgentStructureResponseDto): string {
		const prenom = agent.prenom?.charAt(0) || '';
		const nom = agent.nom?.charAt(0) || '';
		return `${prenom}${nom}`;
	}

	getAgentFullName(agent: AgentStructureResponseDto): string {
		return `${agent.prenom || ''} ${agent.nom || ''}`.trim();
	}

	get selectedAgent(): AgentStructureResponseDto | null {
		return this.agents.find(agent => agent.idUtilisateur === this.selectedAgentId) ?? null;
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

	getLocation(): string {
		if (!this.signalement) return '';
		return this.signalement.repereVisuel || `${this.signalement.latitude}, ${this.signalement.longitude}`;
	}

	assigner(): void {
		if (!this.signalement || this.selectedAgentId === null || this.isSubmitting) return;

		this.isSubmitting = true;
		this.errorMessage = '';
		this.signalementService.assignerAgent(this.signalement.idSignalement, { idAgent: this.selectedAgentId }).subscribe({
			next: () => {
				this.isSubmitting = false;
				this.router.navigate(['/structure/signalements']);
			},
			error: error => {
				console.error('Erreur lors de l’assignation du signalement :', error);
				this.errorMessage = error.error?.message || 'Impossible d’assigner ce signalement à cet agent.';
				this.isSubmitting = false;
			}
		});
	}

	retourListe(): void {
		this.router.navigate(['/structure/signalements']);
	}
}
