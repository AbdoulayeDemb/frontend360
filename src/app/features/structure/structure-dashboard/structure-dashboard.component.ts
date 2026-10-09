import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { EnumStatut, EnumTypeUrgence } from '../../../core/models/enums.model';
import { Signalement } from '../../../core/models/signalement.model';
import { AuthService } from '../../../core/services/auth.service';
import { SignalementService } from '../../../core/services/signalement.service';

interface UrgencySummary {
	name: string;
	count: number;
	percentage: number;
	color: string;
}

interface ActivityPoint {
	label: string;
	dateLabel: string;
	count: number;
	x: number;
	y: number;
}

interface ActivityTick {
	value: number;
	y: number;
}

@Component({
	selector: 'app-structure-dashboard',
	standalone: true,
	imports: [CommonModule, RouterLink],
	templateUrl: './structure-dashboard.component.html',
	styleUrl: './structure-dashboard.component.css'
})
export class StructureDashboardComponent implements OnInit {
	private readonly authService = inject(AuthService);
	private readonly signalementService = inject(SignalementService);
	private readonly router = inject(Router);

	readonly currentUser = this.authService.currentUserValue;
	readonly structureId = this.authService.getIdStructure();
	readonly todayLabel = new Date().toLocaleDateString('fr-FR', {
		day: 'numeric', month: 'long', year: 'numeric'
	});
	structureName = this.currentUser?.nomStructure || '';

	signalements: Signalement[] = [];
	recentSignalements: Signalement[] = [];
	urgencySummaries: UrgencySummary[] = [];
	activityPoints: ActivityPoint[] = [];
	activityTicks: ActivityTick[] = [];
	activityLinePath = '';
	activityAreaPath = '';
	isLoading = false;
	errorMessage = '';

	stats = {
		total: 0,
		declares: 0,
		enCours: 0,
		resolus: 0
	};

	urgencyChartBackground = 'conic-gradient(#e8eef7 0% 100%)';

	ngOnInit(): void {
		this.loadDashboard();
	}

	loadDashboard(): void {
		if (this.structureId === null) {
			this.errorMessage = 'Aucune structure n’est associée à ce compte.';
			return;
		}

		this.isLoading = true;
		this.errorMessage = '';

		this.signalementService.getByStructure(this.structureId).subscribe({
			next: (signalements) => {
				this.signalements = [...signalements].sort(
					(first, second) =>
						new Date(second.dateHeureAlerte).getTime() -
						new Date(first.dateHeureAlerte).getTime()
				);
				this.recentSignalements = this.signalements
					.filter(signalement =>
						signalement.statut === EnumStatut.DECLARE &&
						(signalement.typeUrgence === EnumTypeUrgence.CRITIQUE ||
							signalement.typeUrgence === EnumTypeUrgence.ELEVEE)
					)
					.slice(0, 6);
				this.structureName = this.currentUser?.nomStructure ||
					signalements.find(signalement => signalement.nomStructureAssignee)?.nomStructureAssignee ||
					'Votre structure';
				this.updateActivityChart(signalements);
				this.stats = {
					total: signalements.length,
					declares: signalements.filter(signalement => signalement.statut === EnumStatut.DECLARE).length,
					enCours: signalements.filter(signalement => signalement.statut === EnumStatut.EN_COURS).length,
					resolus: signalements.filter(signalement => signalement.statut === EnumStatut.RESOLU).length
				};
				this.calculateUrgencies(signalements);
				this.isLoading = false;
			},
			error: (error) => {
				console.error('Erreur lors du chargement du dashboard structure :', error);
				this.errorMessage = 'Impossible de charger les données de votre structure.';
				this.isLoading = false;
			}
		});
	}

	private updateActivityChart(signalements: Signalement[]): void {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const countsByDate = new Map<string, number>();
		signalements.forEach(signalement => {
			const alertDate = new Date(signalement.dateHeureAlerte);
			if (Number.isNaN(alertDate.getTime())) return;

			const key = this.getDateKey(alertDate);
			countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
		});

		const dates = Array.from({ length: 7 }, (_, index) => {
			const date = new Date(today);
			date.setDate(today.getDate() - (6 - index));
			return date;
		});
		const counts = dates.map(date => countsByDate.get(this.getDateKey(date)) ?? 0);
		const maximumCount = Math.max(1, ...counts);
		const chartMaximum = Math.max(4, Math.ceil(maximumCount / 4) * 4);
		const chartTop = 24;
		const chartBottom = 174;

		this.activityPoints = dates.map((date, index) => ({
			label: date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
			dateLabel: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
			count: counts[index],
			x: 56 + index * 82,
			y: chartBottom - (counts[index] / chartMaximum) * (chartBottom - chartTop)
		}));
		this.activityTicks = Array.from({ length: 5 }, (_, index) => {
			const value = chartMaximum - (chartMaximum / 4) * index;
			return {
				value,
				y: chartTop + ((chartBottom - chartTop) / 4) * index
			};
		});

		const firstPoint = this.activityPoints[0];
		const lastPoint = this.activityPoints[this.activityPoints.length - 1];
		this.activityLinePath = this.activityPoints
			.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
			.join(' ');
		this.activityAreaPath = `${this.activityLinePath} L ${lastPoint.x} ${chartBottom} L ${firstPoint.x} ${chartBottom} Z`;
	}

	private getDateKey(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	calculateUrgencies(signalements: Signalement[]): void {
		const urgencyLevels: { type: EnumTypeUrgence; name: string; color: string }[] = [
			{ type: EnumTypeUrgence.FAIBLE, name: 'Faible', color: '#10b981' },
			{ type: EnumTypeUrgence.MOYENNE, name: 'Moyenne', color: '#f59e0b' },
			{ type: EnumTypeUrgence.ELEVEE, name: 'Élevée', color: '#f97316' },
			{ type: EnumTypeUrgence.CRITIQUE, name: 'Critique', color: '#ef4444' }
		];
		const counts = new Map<EnumTypeUrgence, number>();
		signalements.forEach(signalement => {
			counts.set(signalement.typeUrgence, (counts.get(signalement.typeUrgence) ?? 0) + 1);
		});

		this.urgencySummaries = urgencyLevels.map(level => {
			const count = counts.get(level.type) ?? 0;
			return {
				name: level.name,
				count,
				percentage: signalements.length
					? Math.round((count / signalements.length) * 100)
					: 0,
				color: level.color
			};
		});
		let currentPercentage = 0;
		const slices = this.urgencySummaries
			.filter(summary => summary.count > 0)
			.map(summary => {
			const start = currentPercentage;
			currentPercentage += signalements.length
				? (summary.count / signalements.length) * 100
				: 0;
			return `${summary.color} ${start}% ${currentPercentage}%`;
		});
		this.urgencyChartBackground = `conic-gradient(${slices.join(', ') || '#e8eef7 0% 100%'})`;
	}

	get prioritySignalementsCount(): number {
		return this.signalements.filter(signalement =>
			(signalement.typeUrgence === EnumTypeUrgence.ELEVEE ||
				signalement.typeUrgence === EnumTypeUrgence.CRITIQUE) &&
			(signalement.statut === EnumStatut.DECLARE || signalement.statut === EnumStatut.EN_COURS)
		).length;
	}

	get activityWeekTotal(): number {
		return this.activityPoints.reduce((total, point) => total + point.count, 0);
	}

	get busiestActivityDay(): ActivityPoint | null {
		return this.activityPoints.reduce<ActivityPoint | null>(
			(busiest, point) => !busiest || point.count > busiest.count ? point : busiest,
			null
		);
	}

	getStructureName(): string {
		return this.structureName || 'Votre structure';
	}

	getStatusLabel(statut: EnumStatut): string {
		const labels: Record<EnumStatut, string> = {
			[EnumStatut.DECLARE]: 'Nouveau',
			[EnumStatut.EN_COURS]: 'En cours',
			[EnumStatut.RESOLU]: 'Résolu',
			[EnumStatut.REJETE]: 'Rejeté'
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
		const parsedDate = new Date(date);
		return Number.isNaN(parsedDate.getTime())
			? date
			: parsedDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
	}

	openSignalement(idSignalement: number): void {
		this.router.navigate(['/structure/signalements', idSignalement]);
	}
}
