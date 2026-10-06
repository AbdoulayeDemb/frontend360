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

                    this.actualites = actualites;

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
            this.actualites.filter((actualite) => {

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

                return matchesSearch && matchesUrgence;
            });
    }

    onSearch(event: Event): void {

        const input =
            event.target as HTMLInputElement;

        this.searchTerm = input.value;

        this.applyFilters();
    }

    onUrgenceChange(event: Event): void {

        const select =
            event.target as HTMLSelectElement;

        this.selectedUrgence = select.value;

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
                `Voulez-vous vraiment supprimer l'actualité "${actualite.titre}" ?`
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

        if (isNaN(parsedDate.getTime())) {
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

        if (isNaN(parsedDate.getTime())) {
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