
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ActualiteService } from '../../../core/services/actualite.service';

import {
    ActualiteResponseDto
} from '../../../core/models/actualite.model';

@Component({
    selector: 'app-actualites-management',
    standalone: true,
    imports: [
        CommonModule
    ],
    templateUrl: './actualites-management.component.html',
    styleUrl: './actualites-management.component.css'
})
export class ActualitesManagementComponent implements OnInit {

    private readonly actualiteService =
        inject(ActualiteService);

    private readonly router =
        inject(Router);


    actualites: ActualiteResponseDto[] = [];

    filteredActualites: ActualiteResponseDto[] = [];


    searchTerm = '';

    selectedUrgence = '';


    isLoading = false;

    errorMessage = '';


    // ==========================================
    // PAGINATION
    // ==========================================

    currentPage = 1;

    readonly pageSize = 10;


    /**
     * Nombre total de pages.
     */
    get totalPages(): number {

        return Math.ceil(
            this.filteredActualites.length /
            this.pageSize
        );

    }


    /**
     * Premier élément affiché.
     */
    get paginationStart(): number {

        if (this.filteredActualites.length === 0) {

            return 0;

        }

        return (
            (this.currentPage - 1) *
            this.pageSize
        ) + 1;

    }


    /**
     * Dernier élément affiché.
     */
    get paginationEnd(): number {

        return Math.min(
            this.currentPage * this.pageSize,
            this.filteredActualites.length
        );

    }


    /**
     * Actualités affichées sur la page actuelle.
     */
    get paginatedActualites(): ActualiteResponseDto[] {

        const start =
            (this.currentPage - 1) *
            this.pageSize;

        const end =
            start + this.pageSize;

        return this.filteredActualites.slice(
            start,
            end
        );

    }


    /**
     * Génère les numéros de pages visibles.
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
     * Cela permet d'éviter une longue liste
     * de boutons lorsque beaucoup d'actualités existent.
     */
    get visiblePages(): number[] {

        const total =
            this.totalPages;

        const current =
            this.currentPage;


        if (total <= 5) {

            return Array.from(
                { length: total },
                (_, index) => index + 1
            );

        }


        const pages: number[] = [];


        // Première page
        pages.push(1);


        let startPage =
            Math.max(2, current - 1);

        let endPage =
            Math.min(
                total - 1,
                current + 1
            );


        // Début de pagination
        if (current <= 3) {

            startPage = 2;

            endPage = 4;

        }


        // Fin de pagination
        if (current >= total - 2) {

            startPage =
                total - 3;

            endPage =
                total - 1;

        }


        for (
            let page = startPage;
            page <= endPage;
            page++
        ) {

            pages.push(page);

        }


        // Dernière page
        pages.push(total);


        // Suppression des éventuels doublons
        return [
            ...new Set(pages)
        ];

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
     * Aller à la page précédente.
     */
    goToPreviousPage(): void {

        if (this.currentPage > 1) {

            this.currentPage--;

        }

    }


    /**
     * Aller à la page suivante.
     */
    goToNextPage(): void {

        if (
            this.currentPage <
            this.totalPages
        ) {

            this.currentPage++;

        }

    }


    /**
     * Réinitialiser la pagination.
     *
     * Utilisé après une recherche,
     * un filtre ou une suppression.
     */
    resetPagination(): void {

        this.currentPage = 1;

    }


    // ==========================================
    // INITIALISATION
    // ==========================================

    ngOnInit(): void {

        this.chargerActualites();

    }


    // ==========================================
    // CHARGEMENT
    // ==========================================

    chargerActualites(): void {

        this.isLoading = true;

        this.errorMessage = '';


        this.actualiteService
            .obtenirToutesLesActualites()
            .subscribe({

                next: (actualites) => {

                    this.actualites =
                        actualites;

                    this.applyFilters();

                    this.isLoading = false;

                },


                error: (error) => {

                    console.error(
                        'Erreur lors du chargement des actualités :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de charger les actualités.';

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


        this.filteredActualites =
            this.actualites.filter(
                (actualite) => {

                    const matchesSearch =
                        !search ||

                        actualite.titre
                            ?.toLowerCase()
                            .includes(search) ||

                        actualite.corpsTexte
                            ?.toLowerCase()
                            .includes(search) ||

                        actualite.communeCible
                            ?.toLowerCase()
                            .includes(search) ||

                        actualite.nomAdminAuteur
                            ?.toLowerCase()
                            .includes(search);


                    const matchesUrgence =
                        !this.selectedUrgence ||

                        (
                            this.selectedUrgence === 'urgent' &&
                            actualite.estUrgent
                        ) ||

                        (
                            this.selectedUrgence === 'normal' &&
                            !actualite.estUrgent
                        );


                    return (
                        matchesSearch &&
                        matchesUrgence
                    );

                }
            );


        // Après chaque recherche ou filtre,
        // revenir automatiquement à la page 1.
        this.resetPagination();

    }


    onSearch(event: Event): void {

        const input =
            event.target as HTMLInputElement;

        this.searchTerm =
            input.value;

        this.applyFilters();

    }


    onUrgenceChange(event: Event): void {

        const select =
            event.target as HTMLSelectElement;

        this.selectedUrgence =
            select.value;

        this.applyFilters();

    }


    // ==========================================
    // NAVIGATION
    // ==========================================

    ajouterActualite(): void {

        this.router.navigate([
            '/admin/actualites/nouveau'
        ]);

    }


    modifierActualite(
        idActualite: number
    ): void {

        this.router.navigate([
            '/admin/actualites',
            idActualite,
            'modifier'
        ]);

    }


    // ==========================================
    // SUPPRESSION
    // ==========================================

    supprimerActualite(
        actualite: ActualiteResponseDto
    ): void {

        const confirmation =
            window.confirm(
                `Voulez - vous vraiment supprimer l'actualité "${actualite.titre}" ?`
            );


        if (!confirmation) {

            return;

        }


        this.actualiteService
            .supprimerActualite(
                actualite.idActualite
            )
            .subscribe({

                next: () => {

                    this.actualites =
                        this.actualites.filter(
                            a =>
                                a.idActualite !==
                                actualite.idActualite
                        );


                    this.applyFilters();

                },


                error: (error) => {

                    console.error(
                        'Erreur lors de la suppression :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de supprimer cette actualité.';

                }

            });

    }


    // ==========================================
    // AFFICHAGE
    // ==========================================

    getAuteur(
        actualite: ActualiteResponseDto
    ): string {

        return actualite.nomAdminAuteur ||
            'Administrateur';

    }


    formatDate(
        date: string
    ): string {

        if (!date) {

            return '-';

        }


        const parsedDate =
            new Date(date);


        if (
            isNaN(
                parsedDate.getTime()
            )
        ) {

            return date;

        }


        return parsedDate.toLocaleDateString(
            'fr-FR',
            {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }
        );

    }


    formatHeure(
        date: string
    ): string {

        if (!date) {

            return '';

        }


        const parsedDate =
            new Date(date);


        if (
            isNaN(
                parsedDate.getTime()
            )
        ) {

            return '';

        }


        return parsedDate.toLocaleTimeString(
            'fr-FR',
            {
                hour: '2-digit',
                minute: '2-digit'
            }
        );

    }

}
