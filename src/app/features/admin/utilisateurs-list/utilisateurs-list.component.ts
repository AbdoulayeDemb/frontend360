
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { UtilisateurService } from '../../../core/services/utilisateur.service';
import { Utilisateur } from '../../../core/models/utilisateur.model';
import { EnumRole } from '../../../core/models/enums.model';

@Component({
    selector: 'app-utilisateurs-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './utilisateurs-list.component.html',
    styleUrl: './utilisateurs-list.component.css'
})
export class UtilisateursListComponent implements OnInit {

    private readonly utilisateurService =
        inject(UtilisateurService);

    private readonly router =
        inject(Router);


    utilisateurs: Utilisateur[] = [];

    filteredUtilisateurs: Utilisateur[] = [];


    searchTerm = '';

    selectedRole: string = '';

    selectedStatut = '';


    isLoading = false;

    errorMessage = '';


    isUpdatingStatusId: number | null = null;


    // ==========================================
    // PAGINATION
    // ==========================================

    currentPage = 1;

    readonly pageSize = 10;


    get totalPages(): number {

        return Math.ceil(
            this.filteredUtilisateurs.length /
            this.pageSize
        );

    }


    get paginationStart(): number {

        if (this.filteredUtilisateurs.length === 0) {
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
            this.filteredUtilisateurs.length
        );

    }


    get paginatedUtilisateurs(): Utilisateur[] {

        const start =
            (this.currentPage - 1) *
            this.pageSize;

        const end =
            start + this.pageSize;

        return this.filteredUtilisateurs.slice(
            start,
            end
        );

    }


    /**
     * Pages affichées dans la pagination.
     *
     * Exemple :
     * 1 2 3 4 ... 20
     *
     * ou :
     * 1 ... 9 10 11 ... 20
     *
     * Cela évite d'afficher une liste exhaustive
     * lorsque beaucoup de pages existent.
     */
    get visiblePages(): number[] {

        const total = this.totalPages;
        const current = this.currentPage;

        // S'il y a 5 pages ou moins,
        // on affiche toutes les pages.
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
            Math.min(total - 1, current + 1);


        // Lorsque l'on se trouve au début
        if (current <= 3) {

            startPage = 2;
            endPage = 4;

        }


        // Lorsque l'on se trouve à la fin
        if (current >= total - 2) {

            startPage = total - 3;
            endPage = total - 1;

        }


        // Pages autour de la page courante
        for (
            let page = startPage;
            page <= endPage;
            page++
        ) {

            pages.push(page);

        }


        // Dernière page
        pages.push(total);


        // Évite les doublons éventuels
        return [...new Set(pages)];

    }


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


    goToPreviousPage(): void {

        if (this.currentPage > 1) {

            this.currentPage--;

        }

    }


    goToNextPage(): void {

        if (this.currentPage < this.totalPages) {

            this.currentPage++;

        }

    }


    resetPagination(): void {

        this.currentPage = 1;

    }


    // ==========================================
    // INITIALISATION
    // ==========================================

    ngOnInit(): void {

        this.loadUtilisateurs();

    }


    // ==========================================
    // CHARGEMENT
    // ==========================================

    /**
     * Chargement des utilisateurs depuis le backend.
     */
    loadUtilisateurs(): void {

        this.isLoading = true;

        this.errorMessage = '';


        this.utilisateurService
            .obtenirTousLesUtilisateurs()
            .subscribe({

                next: (utilisateurs) => {

                    this.utilisateurs = utilisateurs;

                    this.applyFilters();

                    this.isLoading = false;

                },


                error: (error) => {

                    console.error(
                        'Erreur lors du chargement des utilisateurs :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de charger les utilisateurs.';

                    this.isLoading = false;

                }

            });

    }


    // ==========================================
    // RECHERCHE ET FILTRES
    // ==========================================

    /**
     * Recherche et filtres.
     */
    applyFilters(): void {

        const search =
            this.searchTerm
                .trim()
                .toLowerCase();


        this.filteredUtilisateurs =
            this.utilisateurs.filter((user) => {

                const matchesSearch =
                    !search ||

                    user.nom
                        ?.toLowerCase()
                        .includes(search) ||

                    user.prenom
                        ?.toLowerCase()
                        .includes(search) ||

                    user.telephone
                        ?.toLowerCase()
                        .includes(search) ||

                    user.email
                        ?.toLowerCase()
                        .includes(search) ||

                    user.nomStructure
                        ?.toLowerCase()
                        .includes(search) ||

                    user.matriculeAgent
                        ?.toLowerCase()
                        .includes(search);


                const matchesRole =
                    !this.selectedRole ||
                    user.role === this.selectedRole;


                const matchesStatut =
                    !this.selectedStatut ||

                    (
                        this.selectedStatut === 'ACTIF' &&
                        user.estActif
                    ) ||

                    (
                        this.selectedStatut === 'INACTIF' &&
                        !user.estActif
                    );


                return (
                    matchesSearch &&
                    matchesRole &&
                    matchesStatut
                );

            });


        // Retour à la première page
        // après recherche ou filtrage.
        this.resetPagination();

    }


    /**
     * Recherche textuelle.
     */
    onSearch(event: Event): void {

        const input =
            event.target as HTMLInputElement;

        this.searchTerm = input.value;

        this.applyFilters();

    }


    /**
     * Filtre par rôle.
     */
    onRoleChange(event: Event): void {

        const select =
            event.target as HTMLSelectElement;

        this.selectedRole = select.value;

        this.applyFilters();

    }


    /**
     * Filtre par statut.
     */
    onStatutChange(event: Event): void {

        const select =
            event.target as HTMLSelectElement;

        this.selectedStatut = select.value;

        this.applyFilters();

    }


    // ==========================================
    // NAVIGATION
    // ==========================================

    /**
     * Ouvrir le formulaire de création.
     * La route sera ajoutée lors de la configuration du formulaire.
     */
    ajouterUtilisateur(): void {

        this.router.navigate([
            '/admin/utilisateurs/nouveau'
        ]);

    }


    /**
     * Ouvrir le formulaire de modification.
     * La route sera ajoutée lors de la configuration du formulaire.
     */
    modifierUtilisateur(idUtilisateur: number): void {

        this.router.navigate([
            '/admin/utilisateurs',
            idUtilisateur,
            'modifier'
        ]);

    }


    // ==========================================
    // STATUT UTILISATEUR
    // ==========================================

    /**
     * Activer ou désactiver un compte.
     */
    changerStatutUtilisateur(
        utilisateur: Utilisateur
    ): void {

        const nouveauStatut =
            !utilisateur.estActif;


        const action =
            nouveauStatut
                ? 'activer'
                : 'désactiver';


        const confirmation =
            window.confirm(
                `Voulez-vous vraiment ${action} le compte de ${utilisateur.prenom} ${utilisateur.nom} ?`
            );


        if (!confirmation) {

            return;

        }


        this.isUpdatingStatusId =
            utilisateur.idUtilisateur;


        this.utilisateurService
            .changerStatutCompte(
                utilisateur.idUtilisateur,
                nouveauStatut
            )
            .subscribe({

                next: (utilisateurMisAJour) => {

                    const index =
                        this.utilisateurs.findIndex(
                            user =>
                                user.idUtilisateur ===
                                utilisateur.idUtilisateur
                        );


                    if (index !== -1) {

                        this.utilisateurs[index] =
                            utilisateurMisAJour;

                    }


                    this.applyFilters();

                    this.isUpdatingStatusId = null;

                },


                error: (error) => {

                    console.error(
                        'Erreur lors du changement de statut :',
                        error
                    );


                    this.errorMessage =
                        'Impossible de modifier le statut de cet utilisateur.';


                    this.isUpdatingStatusId = null;

                }

            });

    }


    // ==========================================
    // RÔLE
    // ==========================================

    /**
     * Libellé du rôle.
     */
    getRoleLabel(role: EnumRole): string {

        switch (role) {

            case EnumRole.ADMIN:

                return 'Administrateur';


            case EnumRole.CITOYEN:

                return 'Citoyen';


            case EnumRole.STRUCTURE:

                return 'Agent de structure';


            default:

                return role;

        }

    }


    /**
     * Classe CSS du rôle.
     */
    getRoleClass(role: EnumRole): string {

        switch (role) {

            case EnumRole.ADMIN:

                return 'badge-info';


            case EnumRole.CITOYEN:

                return 'badge-success';


            case EnumRole.STRUCTURE:

                return 'badge-warning';


            default:

                return '';

        }

    }


    // ==========================================
    // STATUT
    // ==========================================

    /**
     * Classe CSS du statut.
     */
    getStatutClass(
        estActif: boolean
    ): string {

        return estActif
            ? 'badge-success'
            : 'badge-danger';

    }


    /**
     * Libellé du statut.
     */
    getStatutLabel(
        estActif: boolean
    ): string {

        return estActif
            ? 'Actif'
            : 'Inactif';

    }


    // ==========================================
    // UTILISATEUR
    // ==========================================

    /**
     * Nom complet.
     */
    getNomComplet(
        utilisateur: Utilisateur
    ): string {

        return `${utilisateur.prenom} ${utilisateur.nom}`;

    }


    /**
     * Structure de l'utilisateur.
     */
    getStructureName(
        utilisateur: Utilisateur
    ): string {

        if (
            utilisateur.role !==
            EnumRole.STRUCTURE
        ) {

            return '-';

        }


        return (
            utilisateur.nomStructure ||
            'Non renseignée'
        );

    }


    // ==========================================
    // DATE
    // ==========================================

    /**
     * Date de création formatée.
     */
    formatDate(date?: string): string {

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

}

