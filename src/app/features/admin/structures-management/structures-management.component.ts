
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

  private readonly structureService =
    inject(StructureService);

  private readonly router =
    inject(Router);


  structures: StructureCompetenteResponseDto[] = [];

  filteredStructures: StructureCompetenteResponseDto[] = [];


  searchTerm = '';

  selectedType = '';


  isLoading = false;

  errorMessage = '';


  // ==========================================
  // PAGINATION
  // ==========================================

  currentPage = 1;

  readonly pageSize = 10;


  get totalPages(): number {

    return Math.ceil(
      this.filteredStructures.length /
      this.pageSize
    );

  }


  get paginationStart(): number {

    if (this.filteredStructures.length === 0) {
      return 0;
    }

    return (
      (this.currentPage - 1) *
      this.pageSize
    ) + 1;

  }


  get paginationEnd(): number {

    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredStructures.length
    );

  }


  /**
   * Structures affichées sur la page actuelle.
   */
  get paginatedStructures(): StructureCompetenteResponseDto[] {

    const start =
      (this.currentPage - 1) *
      this.pageSize;

    const end =
      start + this.pageSize;

    return this.filteredStructures.slice(
      start,
      end
    );

  }


  /**
   * Numéros de pages affichés.
   *
   * Exemple :
   *
   * 1 2 3 4 5
   *
   * ou :
   *
   * 1 2 3 4 ... 10
   *
   * ou :
   *
   * 1 ... 5 6 7 ... 10
   *
   * ou :
   *
   * 1 ... 7 8 9 10
   *
   * Cela évite d'avoir une liste exhaustive
   * lorsque beaucoup de structures existent.
   */
  get visiblePages(): number[] {

    const total = this.totalPages;

    const current = this.currentPage;


    // S'il y a 5 pages ou moins,
    // afficher toutes les pages.
    if (total <= 5) {

      return Array.from(
        { length: total },
        (_, index) => index + 1
      );

    }


    const pages: number[] = [];


    // Toujours afficher la première page.
    pages.push(1);


    let startPage =
      Math.max(2, current - 1);

    let endPage =
      Math.min(total - 1, current + 1);


    // Lorsque l'on est au début.
    if (current <= 3) {

      startPage = 2;

      endPage = 4;

    }


    // Lorsque l'on est à la fin.
    if (current >= total - 2) {

      startPage = total - 3;

      endPage = total - 1;

    }


    // Ajouter les pages autour de la page actuelle.
    for (
      let page = startPage;
      page <= endPage;
      page++
    ) {

      pages.push(page);

    }


    // Toujours afficher la dernière page.
    pages.push(total);


    // Éviter les doublons.
    return [...new Set(pages)];

  }


  /**
   * Aller directement à une page.
   */
  goToPage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages ||
      page === this.currentPage
    ) {

      return;

    }

    this.currentPage = page;

  }


  /**
   * Page précédente.
   */
  goToPreviousPage(): void {

    if (this.currentPage > 1) {

      this.currentPage--;

    }

  }


  /**
   * Page suivante.
   */
  goToNextPage(): void {

    if (this.currentPage < this.totalPages) {

      this.currentPage++;

    }

  }


  /**
   * Revenir à la première page.
   */
  resetPagination(): void {

    this.currentPage = 1;

  }


  // ==========================================
  // INITIALISATION
  // ==========================================

  ngOnInit(): void {

    this.chargerStructures();

  }


  // ==========================================
  // CHARGEMENT
  // ==========================================

  chargerStructures(): void {

    this.isLoading = true;

    this.errorMessage = '';


    this.structureService
      .obtenirToutesLesStructures()
      .subscribe({

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


  // ==========================================
  // FILTRES
  // ==========================================

  applyFilters(): void {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();


    this.filteredStructures =
      this.structures.filter((structure) => {

        const matchesSearch =
          !search ||

          structure.nomStructure
            ?.toLowerCase()
            .includes(search) ||

          structure.quartier
            ?.toLowerCase()
            .includes(search) ||

          structure.telephoneUrgence
            ?.toLowerCase()
            .includes(search);


        const matchesType =
          !this.selectedType ||
          structure.typeStructure ===
          this.selectedType;


        return (
          matchesSearch &&
          matchesType
        );

      });


    // Après une recherche ou un filtre,
    // on revient toujours à la première page.
    this.resetPagination();

  }


  onSearch(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    this.searchTerm =
      input.value;

    this.applyFilters();

  }


  onTypeChange(event: Event): void {

    const select =
      event.target as HTMLSelectElement;

    this.selectedType =
      select.value;

    this.applyFilters();

  }


  // ==========================================
  // NAVIGATION
  // ==========================================

  ajouterStructure(): void {

    this.router.navigate([
      '/admin/structures/nouveau'
    ]);

  }


  modifierStructure(
    idStructure: number
  ): void {

    this.router.navigate([
      '/admin/structures',
      idStructure,
      'modifier'
    ]);

  }


  // ==========================================
  // SUPPRESSION
  // ==========================================

  supprimerStructure(
    structure: StructureCompetenteResponseDto
  ): void {

    const confirmation =
      window.confirm(
        `Voulez-vous vraiment supprimer la structure "${structure.nomStructure}" ?`
      );


    if (!confirmation) {

      return;

    }


    this.structureService
      .supprimerStructure(
        structure.idStructure
      )
      .subscribe({

        next: () => {

          this.structures =
            this.structures.filter(
              s =>
                s.idStructure !==
                structure.idStructure
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


  // ==========================================
  // TYPE STRUCTURE
  // ==========================================

  getTypeLabel(
    type: EnumTypeStructure
  ): string {

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


  getTypeClass(
    type: EnumTypeStructure
  ): string {

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


  // ==========================================
  // STATISTIQUES
  // ==========================================

  getNombreAgents(
    structure: StructureCompetenteResponseDto
  ): number {

    return structure.nombreAgents ?? 0;

  }


  getNombreSignalementsActifs(
    structure: StructureCompetenteResponseDto
  ): number {

    return (
      structure.nombreSignalementsActifs ??
      0
    );

  }

}

