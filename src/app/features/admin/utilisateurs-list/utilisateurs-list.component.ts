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

    private readonly utilisateurService = inject(UtilisateurService);
    private readonly router = inject(Router);

    utilisateurs: Utilisateur[] = [];
    filteredUtilisateurs: Utilisateur[] = [];

    searchTerm = '';
    selectedRole: string = '';
    selectedStatut = '';

    isLoading = false;
    errorMessage = '';

    isUpdatingStatusId: number | null = null;

    ngOnInit(): void {
        this.loadUtilisateurs();
    }

    /**
     * Chargement des utilisateurs depuis le backend.
     */
    loadUtilisateurs(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.utilisateurService.obtenirTousLesUtilisateurs().subscribe({

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

    /**
     * Recherche et filtres.
     */
    applyFilters(): void {

        const search = this.searchTerm.trim().toLowerCase();

        this.filteredUtilisateurs = this.utilisateurs.filter((user) => {

            const matchesSearch =
                !search ||

                user.nom?.toLowerCase().includes(search) ||

                user.prenom?.toLowerCase().includes(search) ||

                user.telephone?.toLowerCase().includes(search) ||

                user.email?.toLowerCase().includes(search) ||

                user.nomStructure?.toLowerCase().includes(search) ||

                user.matriculeAgent?.toLowerCase().includes(search);

            const matchesRole =
                !this.selectedRole ||
                user.role === this.selectedRole;

            const matchesStatut =
                !this.selectedStatut ||
                (this.selectedStatut === 'ACTIF' && user.estActif) ||
                (this.selectedStatut === 'INACTIF' && !user.estActif);

            return matchesSearch && matchesRole && matchesStatut;
        });
    }

    /**
     * Recherche textuelle.
     */
    onSearch(event: Event): void {

        const input = event.target as HTMLInputElement;

        this.searchTerm = input.value;

        this.applyFilters();
    }

    /**
     * Filtre par rôle.
     */
    onRoleChange(event: Event): void {

        const select = event.target as HTMLSelectElement;

        this.selectedRole = select.value;

        this.applyFilters();
    }

    /**
     * Filtre par statut.
     */
    onStatutChange(event: Event): void {

        const select = event.target as HTMLSelectElement;

        this.selectedStatut = select.value;

        this.applyFilters();
    }

    /**
     * Ouvrir le formulaire de création.
     * La route sera ajoutée lors de la configuration du formulaire.
     */
    ajouterUtilisateur(): void {
        this.router.navigate(['/admin/utilisateurs/nouveau']);
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

    /**
     * Activer ou désactiver un compte.
     */
    changerStatutUtilisateur(utilisateur: Utilisateur): void {

        const nouveauStatut = !utilisateur.estActif;

        const action = nouveauStatut
            ? 'activer'
            : 'désactiver';

        const confirmation = window.confirm(
            `Voulez-vous vraiment ${action} le compte de ${utilisateur.prenom} ${utilisateur.nom} ?`
        );

        if (!confirmation) {
            return;
        }

        this.isUpdatingStatusId = utilisateur.idUtilisateur;

        this.utilisateurService.changerStatutCompte(
            utilisateur.idUtilisateur,
            nouveauStatut
        ).subscribe({

            next: (utilisateurMisAJour) => {

                const index = this.utilisateurs.findIndex(
                    user => user.idUtilisateur === utilisateur.idUtilisateur
                );

                if (index !== -1) {
                    this.utilisateurs[index] = utilisateurMisAJour;
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

    /**
     * Classe CSS du statut.
     */
    getStatutClass(estActif: boolean): string {
        return estActif ? 'badge-success' : 'badge-danger';
    }

    /**
     * Libellé du statut.
     */
    getStatutLabel(estActif: boolean): string {
        return estActif ? 'Actif' : 'Inactif';
    }

    /**
     * Nom complet.
     */
    getNomComplet(utilisateur: Utilisateur): string {
        return `${utilisateur.prenom} ${utilisateur.nom}`;
    }

    /**
     * Structure de l'utilisateur.
     */
    getStructureName(utilisateur: Utilisateur): string {

        if (utilisateur.role !== EnumRole.STRUCTURE) {
            return '-';
        }

        return utilisateur.nomStructure || 'Non renseignée';
    }

    /**
     * Date de création formatée.
     */
    formatDate(date?: string): string {

        if (!date) {
            return '-';
        }

        const parsedDate = new Date(date);

        if (isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}