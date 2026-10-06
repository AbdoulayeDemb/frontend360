import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';

import { EnumStatut, EnumTypeUrgence } from '../../../core/models/enums.model';
import { Signalement } from '../../../core/models/signalement.model';
import { AuthService } from '../../../core/services/auth.service';
import { SignalementService } from '../../../core/services/signalement.service';

interface CategorySummary {
	name: string;
	count: number;
	percentage: number;
	color: string;
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
	private readonly sanitizer = inject(DomSanitizer);

	readonly currentUser = this.authService.currentUserValue;
	readonly structureId = this.authService.getIdStructure();
	readonly todayLabel = new Date().toLocaleDateString('fr-FR', {
		day: 'numeric', month: 'long', year: 'numeric'
	});
	structureName = this.currentUser?.nomStructure || '';
	mapUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
		'https://www.openstreetmap.org/export/embed.html?bbox=-8.1%2C12.55%2C-7.9%2C12.75&layer=mapnik'
	);

	signalements: Signalement[] = [];
	recentSignalements: Signalement[] = [];
	categories: CategorySummary[] = [];
	isLoading = false;
	errorMessage = '';

	stats = {
		total: 0,
		urgents: 0,
		resolus: 0
	};

	chartBackground = 'conic-gradient(#3485f6 0% 100%)';

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
				this.recentSignalements = this.signalements.slice(0, 6);
				this.structureName = this.currentUser?.nomStructure ||
					signalements.find(signalement => signalement.nomStructureAssignee)?.nomStructureAssignee ||
					'Votre structure';
				this.updateMap(signalements);
				this.stats = {
					total: signalements.length,
					urgents: signalements.filter(signalement =>
						(signalement.typeUrgence === EnumTypeUrgence.CRITIQUE ||
							signalement.typeUrgence === EnumTypeUrgence.ELEVEE) &&
						signalement.statut !== EnumStatut.RESOLU &&
						signalement.statut !== EnumStatut.REJETE
					).length,
					resolus: signalements.filter(
						signalement => signalement.statut === EnumStatut.RESOLU
					).length
				};
				this.calculateCategories(signalements);
				this.isLoading = false;
			},
			error: (error) => {
				console.error('Erreur lors du chargement du dashboard structure :', error);
				this.errorMessage = 'Impossible de charger les données de votre structure.';
				this.isLoading = false;
			}
		});
	}

	private updateMap(signalements: Signalement[]): void {
		const located = signalements.filter(signalement =>
			Number.isFinite(signalement.latitude) && Number.isFinite(signalement.longitude)
		);
		if (!located.length) return;

		const latitudes = located.map(signalement => signalement.latitude);
		const longitudes = located.map(signalement => signalement.longitude);
		const latitudePadding = Math.max((Math.max(...latitudes) - Math.min(...latitudes)) * 0.2, 0.02);
		const longitudePadding = Math.max((Math.max(...longitudes) - Math.min(...longitudes)) * 0.2, 0.02);
		const bounds = [
			Math.min(...longitudes) - longitudePadding,
			Math.min(...latitudes) - latitudePadding,
			Math.max(...longitudes) + longitudePadding,
			Math.max(...latitudes) + latitudePadding
		].map(value => value.toFixed(5)).join('%2C');

		this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
			`https://www.openstreetmap.org/export/embed.html?bbox=${bounds}&layer=mapnik`
		);
	}

	calculateCategories(signalements: Signalement[]): void {
		const counts = new Map<string, number>();
		signalements.forEach(signalement => {
			const name = signalement.nomCategorie || 'Autres';
			counts.set(name, (counts.get(name) ?? 0) + 1);
		});

		const rankedCategories = [...counts.entries()]
			.sort((first, second) => second[1] - first[1]);
		const visibleCategories = rankedCategories.slice(0, 5);
		const remainingCount = rankedCategories.slice(5)
			.reduce((total, [, count]) => total + count, 0);
		if (remainingCount) visibleCategories.push(['Autres', remainingCount]);

		const palette = ['#3485f6', '#08a979', '#66758f', '#a125dc', '#f59e0b', '#ef476f'];
		this.categories = visibleCategories
			.map(([name, count], index) => ({
				name,
				count,
				percentage: signalements.length
					? Math.round((count / signalements.length) * 100)
					: 0,
				color: palette[index % palette.length]
			}))
			.sort((first, second) => second.count - first.count)
			.slice(0, 6);

		let currentPercentage = 0;
		const slices = this.categories.map(category => {
			const start = currentPercentage;
			currentPercentage += signalements.length
				? (category.count / signalements.length) * 100
				: 0;
			return `${category.color} ${start}% ${currentPercentage}%`;
		});
		this.chartBackground = `conic-gradient(${slices.join(', ') || '#e8eef7 0% 100%'})`;
	}

	mapCoordinate(signalement: Signalement, axis: 'x' | 'y'): number {
		const values = this.recentSignalements.map(item =>
			axis === 'x' ? item.longitude : item.latitude
		);
		const value = axis === 'x' ? signalement.longitude : signalement.latitude;
		const minimum = Math.min(...values);
		const maximum = Math.max(...values);
		if (minimum === maximum) return 50;

		const normalized = (value - minimum) / (maximum - minimum);
		return axis === 'x'
			? 8 + normalized * 84
			: 86 - normalized * 72;
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
