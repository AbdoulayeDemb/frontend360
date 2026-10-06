import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { EnumStatut } from '../../../core/models/enums.model';
import { Signalement } from '../../../core/models/signalement.model';
import { AuthService } from '../../../core/services/auth.service';
import { SignalementService } from '../../../core/services/signalement.service';

@Component({
  selector: 'app-structure-signalements-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './structure-signalements-list.component.html',
  styleUrl: './structure-signalements-list.component.css'
})
export class StructureSignalementsListComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly signalementService = inject(SignalementService);
  private readonly router = inject(Router);

  private readonly structureId = this.authService.getIdStructure();
  readonly EnumStatut = EnumStatut;
  readonly pageSize = 6;

  signalements: Signalement[] = [];
  filteredSignalements: Signalement[] = [];
  visibleSignalements: Signalement[] = [];
  searchTerm = '';
  selectedStatut = '';
  currentPage = 1;
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadSignalements();
  }

  loadSignalements(): void {
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
        this.applyFilters();
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement des signalements de la structure :', error);
        this.errorMessage = 'Impossible de charger les signalements de votre structure.';
        this.isLoading = false;
      }
    });
  }

  setStatut(statut: string): void {
    this.selectedStatut = statut;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    const query = this.searchTerm.trim().toLocaleLowerCase('fr');
    this.filteredSignalements = this.signalements.filter(signalement => {
      const matchesStatus = !this.selectedStatut || signalement.statut === this.selectedStatut;
      const searchable = [
        signalement.codeTrackingUnique,
        signalement.nomCategorie,
        signalement.description,
        signalement.repereVisuel
      ].join(' ').toLocaleLowerCase('fr');
      return matchesStatus && (!query || searchable.includes(query));
    });

    const lastPage = Math.max(1, Math.ceil(this.filteredSignalements.length / this.pageSize));
    this.currentPage = Math.min(this.currentPage, lastPage);
    const start = (this.currentPage - 1) * this.pageSize;
    this.visibleSignalements = this.filteredSignalements.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredSignalements.length / this.pageSize));
  }

  getStatusCount(statut: string): number {
    return statut
      ? this.signalements.filter(signalement => signalement.statut === statut).length
      : this.signalements.length;
  }

  changePage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
    this.applyFilters();
  }

  statusLabel(statut: EnumStatut): string {
    const labels: Record<EnumStatut, string> = {
      [EnumStatut.DECLARE]: 'Nouveau',
      [EnumStatut.EN_COURS]: 'En cours',
      [EnumStatut.RESOLU]: 'Résolu',
      [EnumStatut.REJETE]: 'Refusé'
    };
    return labels[statut] ?? statut;
  }

  statusClass(statut: EnumStatut): string {
    const classes: Record<EnumStatut, string> = {
      [EnumStatut.DECLARE]: 'status-new',
      [EnumStatut.EN_COURS]: 'status-progress',
      [EnumStatut.RESOLU]: 'status-resolved',
      [EnumStatut.REJETE]: 'status-rejected'
    };
    return classes[statut] ?? '';
  }

  formatDate(date: string): string {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  openSignalement(id: number): void {
    this.router.navigate(['/structure/signalements', id]);
  }
}