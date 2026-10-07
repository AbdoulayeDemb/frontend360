import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { EnumStatut, EnumTypeUrgence } from '../../../core/models/enums.model';
import { AgentStructureResponseDto } from '../../../core/models/agent-structure.model';
import { Signalement } from '../../../core/models/signalement.model';
import { AgentService } from '../../../core/services/agent.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignalementService } from '../../../core/services/signalement.service';

@Component({
	selector: 'app-structure-agent-detail',
	standalone: true,
	imports: [CommonModule, RouterLink],
	templateUrl: './structure-agent-detail.component.html',
	styleUrl: './structure-agent-detail.component.css'
})
export class StructureAgentDetailComponent implements OnInit {
	private readonly route = inject(ActivatedRoute);
	private readonly agentService = inject(AgentService);
	private readonly signalementService = inject(SignalementService);
	private readonly authService = inject(AuthService);

	readonly EnumTypeUrgence = EnumTypeUrgence;
	readonly structureId = this.authService.getIdStructure();
	readonly isResponsable = this.authService.currentUserValue?.estResponsable ?? false;
	readonly reportsPerPage = 3;
	agent: AgentStructureResponseDto | null = null;
	signalements: Signalement[] = [];
	currentReportPage = 1;
	isLoading = false;
	errorMessage = '';

	get visibleSignalements(): Signalement[] {
		const startIndex = (this.currentReportPage - 1) * this.reportsPerPage;
		return this.signalements.slice(startIndex, startIndex + this.reportsPerPage);
	}

	get reportPageCount(): number {
		return Math.ceil(this.signalements.length / this.reportsPerPage);
	}

	get reportPageNumbers(): number[] {
		const visiblePageCount = Math.min(5, this.reportPageCount);
		const firstPage = Math.max(
			1,
			Math.min(this.currentReportPage - 2, this.reportPageCount - visiblePageCount + 1)
		);
		return Array.from({ length: visiblePageCount }, (_, index) => firstPage + index);
	}

	get firstVisibleReport(): number {
		return this.signalements.length ? (this.currentReportPage - 1) * this.reportsPerPage + 1 : 0;
	}

	get lastVisibleReport(): number {
		return Math.min(this.currentReportPage * this.reportsPerPage, this.signalements.length);
	}

	get declaredCount(): number {
		return this.signalements.filter(signalement => signalement.statut === EnumStatut.DECLARE).length;
	}

	get inProgressCount(): number {
		return this.signalements.filter(signalement => signalement.statut === EnumStatut.EN_COURS).length;
	}

	get resolvedCount(): number {
		return this.signalements.filter(signalement => signalement.statut === EnumStatut.RESOLU).length;
	}

	ngOnInit(): void {
		this.loadDetails();
	}

	loadDetails(): void {
		const idAgent = Number(this.route.snapshot.paramMap.get('id'));
		if (!Number.isInteger(idAgent) || idAgent < 1) {
			this.errorMessage = 'Identifiant d’agent invalide.';
			return;
		}
		if (this.structureId === null) {
			this.errorMessage = 'Aucune structure n’est associée à ce compte.';
			return;
		}

		this.isLoading = true;
		this.errorMessage = '';
		forkJoin({
			agent: this.agentService.obtenirAgentParId(idAgent),
			signalements: this.signalementService.getByAgent(idAgent)
		}).subscribe({
			next: result => {
				if (result.agent.idStructure !== this.structureId || result.agent.estResponsable) {
					this.errorMessage = 'Cet agent n’appartient pas à votre structure.';
					this.isLoading = false;
					return;
				}

				this.agent = result.agent;
				this.signalements = result.signalements
					.filter(signalement => signalement.idStructureAssignee === this.structureId)
					.sort((first, second) =>
						new Date(second.dateHeureAlerte).getTime() - new Date(first.dateHeureAlerte).getTime()
					);
				this.currentReportPage = 1;
				this.isLoading = false;
			},
			error: error => {
				console.error('Erreur lors du chargement des détails de l’agent :', error);
				this.errorMessage = error.error?.message || 'Impossible de charger les informations de cet agent.';
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

	changeReportPage(page: number): void {
		if (page < 1 || page > this.reportPageCount || page === this.currentReportPage) return;
		this.currentReportPage = page;
	}
}
