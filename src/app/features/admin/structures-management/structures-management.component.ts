import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { StructureService } from '../../../core/services/structure.service';
import { StructureCompetenteResponseDto } from '../../../core/models/structure-competente.model';
import { EnumTypeStructure } from '../../../core/models/enums.model';

@Component({
  selector: 'app-structures-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './structures-management.component.html',
  styleUrl: './structures-management.component.css'
})
export class StructuresManagementComponent implements OnInit {

  // Permet d'utiliser EnumTypeStructure dans le template HTML
  readonly EnumTypeStructure = EnumTypeStructure;

  private readonly structureService = inject(StructureService);
  private readonly router = inject(Router);

  structures: StructureCompetenteResponseDto[] = [];
  filteredStructures: StructureCompetenteResponseDto[] = [];

  searchTerm = '';
  selectedType = '';

  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.chargerStructures();
  }

  chargerStructures(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.structureService.obtenirToutesLesStructures().subscribe({
      next: (structures) => {
        this.structures = structures;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error(
          'Erreur lors du chargement des structures :',
          error
        );

        this.errorMessage =
          'Impossible de charger les structures.';

        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredStructures = this.structures.filter((structure) => {

      const matchesSearch =
        !search ||
        structure.nomStructure?.toLowerCase().includes(search) ||
        structure.quartier?.toLowerCase().includes(search) ||
        structure.telephoneUrgence?.toLowerCase().includes(search);

      const matchesType =
        !this.selectedType ||
        structure.typeStructure === this.selectedType;

      return matchesSearch && matchesType;
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm = input.value;

    this.applyFilters();
  }

  onTypeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;

    this.selectedType = select.value;

    this.applyFilters();
  }

  ajouterStructure(): void {
    this.router.navigate([
      '/admin/structures/nouveau'
    ]);
  }

  modifierStructure(idStructure: number): void {
    this.router.navigate([
      '/admin/structures',
      idStructure,
      'modifier'
    ]);
  }

  supprimerStructure(
    structure: StructureCompetenteResponseDto
  ): void {

    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer la structure "${structure.nomStructure}" ?`
    );

    if (!confirmation) {
      return;
    }

    this.structureService
      .supprimerStructure(structure.idStructure)
      .subscribe({
        next: () => {
          this.structures = this.structures.filter(
            s => s.idStructure !== structure.idStructure
          );

          this.applyFilters();
        },

        error: (error) => {
          console.error(
            'Erreur lors de la suppression :',
            error
          );

          this.errorMessage =
            'Impossible de supprimer cette structure.';
        }
      });
  }

  getTypeLabel(type: EnumTypeStructure): string {
    switch (type) {

      case EnumTypeStructure.MAIRIE:
        return 'Mairie';

      case EnumTypeStructure.EDM_SA:
        return 'EDM-SA';

      case EnumTypeStructure.SAPEURS_POMPIERS:
        return 'Sapeurs-pompiers';

      case EnumTypeStructure.SOMAGEP:
        return 'SOMAGEP';

      case EnumTypeStructure.GIE:
        return 'GIE';

      case EnumTypeStructure.POLICE:
        return 'Police';

      default:
        return type;
    }
  }

  getTypeClass(type: EnumTypeStructure): string {
    switch (type) {

      case EnumTypeStructure.MAIRIE:
        return 'badge-info';

      case EnumTypeStructure.EDM_SA:
        return 'badge-warning';

      case EnumTypeStructure.SAPEURS_POMPIERS:
        return 'badge-danger';

      case EnumTypeStructure.SOMAGEP:
        return 'badge-primary';

      case EnumTypeStructure.GIE:
        return 'badge-success';

      case EnumTypeStructure.POLICE:
        return 'badge-dark';

      default:
        return '';
    }
  }

  getNombreAgents(
    structure: StructureCompetenteResponseDto
  ): number {
    return structure.nombreAgents ?? 0;
  }

  getNombreSignalementsActifs(
    structure: StructureCompetenteResponseDto
  ): number {
    return structure.nombreSignalementsActifs ?? 0;
  }
}