
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AbusService } from '../../../core/services/abus.service';
import {
    AbusResponseDto,
    StatutAbus,
    TypeAbus,
    NiveauGraviteAbus
} from '../../../core/models/abus.model';

@Component({
    selector: 'app-gestion-abus',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './gestion-abus.component.html',
    styleUrls: ['./gestion-abus.component.css']
})
export class GestionAbusComponent implements OnInit {
    private readonly abusService = inject(AbusService);

    abus: AbusResponseDto[] = [];
    abusFiltres: AbusResponseDto[] = [];

    recherche = '';
    filtreStatut = '';
    filtreGravite = '';

    isLoading = false;
    errorMessage = '';
    successMessage = '';

    currentPage = 1;
    pageSize = 8;

    abusSelectionne: AbusResponseDto | null = null;
    confirmationEnCours = false;
    idAbusEnCours: number | null = null;

    readonly typesAbus: Record<TypeAbus, string> = {
        FAUSSE_INFORMATION: 'Fausse information',
        FAUSSE_LOCALISATION: 'Fausse localisation',
        PHOTO_NON_CORRESPONDANTE: 'Photo non correspondante',
        AUTRE: 'Autre'
    };

    readonly niveauxGravite: Record<NiveauGraviteAbus, string> = {
        FAIBLE: 'Faible',
        MOYEN: 'Moyenne',
        ELEVE: 'Élevée'
    };

    ngOnInit(): void {
        this.chargerAbus();
    }

    chargerAbus(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.abusService.obtenirLesAbus().subscribe({
            next: (resultats) => {
                this.abus = resultats ?? [];
                this.appliquerFiltres();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Erreur de chargement des abus :', error);

                this.errorMessage =
                    'Impossible de charger les abus. Vérifiez votre connexion et vos autorisations.';

                this.isLoading = false;
            }
        });
    }

    appliquerFiltres(): void {
        const terme = this.recherche.trim().toLowerCase();

        this.abusFiltres = this.abus.filter((abus) => {
            const correspondRecherche =
                !terme ||
                String(abus.idAbus).includes(terme) ||
                String(abus.idSignalement).includes(terme) ||
                (abus.codeTrackingUnique ?? '').toLowerCase().includes(terme) ||
                (abus.citoyenNomComplet ?? '').toLowerCase().includes(terme) ||
                (abus.categorie ?? '').toLowerCase().includes(terme) ||
                (abus.nomStructure ?? '').toLowerCase().includes(terme) ||
                this.getTypeAbusLabel(abus).toLowerCase().includes(terme);

            const correspondStatut =
                !this.filtreStatut || abus.statut === this.filtreStatut;

            const correspondGravite =
                !this.filtreGravite || abus.niveauGravite === this.filtreGravite;

            return correspondRecherche && correspondStatut && correspondGravite;
        });

        this.currentPage = 1;
    }

    get abusPagines(): AbusResponseDto[] {
        const debut = (this.currentPage - 1) * this.pageSize;
        return this.abusFiltres.slice(debut, debut + this.pageSize);
    }

    get totalPages(): number {
        return Math.ceil(this.abusFiltres.length / this.pageSize);
    }

    get paginationStart(): number {
        return this.abusFiltres.length === 0
            ? 0
            : (this.currentPage - 1) * this.pageSize + 1;
    }

    get paginationEnd(): number {
        return Math.min(
            this.currentPage * this.pageSize,
            this.abusFiltres.length
        );
    }

    get nombreAVerifier(): number {
        return this.abus.filter((abus) => abus.statut === 'A_VERIFIER').length;
    }

    get nombreConfirmes(): number {
        return this.abus.filter((abus) => abus.statut === 'CONFIRME').length;
    }

    changerPage(page: number): void {
        if (page < 1 || page > this.totalPages) {
            return;
        }

        this.currentPage = page;
    }

    get pagesVisibles(): number[] {
        const pages: number[] = [];

        for (let page = 1; page <= this.totalPages; page++) {
            if (
                page === 1 ||
                page === this.totalPages ||
                Math.abs(page - this.currentPage) <= 1
            ) {
                pages.push(page);
            }
        }

        return pages;
    }

    getTypeAbusLabel(abus: AbusResponseDto): string {
        if (abus.typeAbus === 'AUTRE' && abus.typeAbusPersonnalise?.trim()) {
            return abus.typeAbusPersonnalise;
        }

        return this.typesAbus[abus.typeAbus] ?? abus.typeAbus;
    }

    getGraviteLabel(gravite: NiveauGraviteAbus): string {
        return this.niveauxGravite[gravite] ?? gravite;
    }

    getStatutLabel(statut: StatutAbus): string {
        return statut === 'CONFIRME' ? 'Confirmé' : 'À vérifier';
    }

    getStatutClass(statut: StatutAbus): string {
        return statut === 'CONFIRME' ? 'badge-confirmed' : 'badge-pending';
    }

    getGraviteClass(gravite: NiveauGraviteAbus): string {
        switch (gravite) {
            case 'FAIBLE':
                return 'severity-low';
            case 'MOYEN':
                return 'severity-medium';
            case 'ELEVE':
                return 'severity-high';
            default:
                return '';
        }
    }

    formatDate(date: string): string {
        if (!date) {
            return '—';
        }

        const valeur = new Date(date);

        if (Number.isNaN(valeur.getTime())) {
            return '—';
        }

        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(valeur);
    }

    ouvrirDetails(abus: AbusResponseDto): void {
        this.abusSelectionne = abus;
        this.successMessage = '';
        this.errorMessage = '';
    }

    fermerDetails(): void {
        this.abusSelectionne = null;
        this.confirmationEnCours = false;
    }

    confirmerAbus(abus: AbusResponseDto): void {
        if (abus.statut === 'CONFIRME' || this.idAbusEnCours !== null) {
            return;
        }

        const accepte = window.confirm(
            `Confirmer l'abus concernant le signalement ${abus.codeTrackingUnique} ?`
        );

        if (!accepte) {
            return;
        }

        this.idAbusEnCours = abus.idAbus;
        this.errorMessage = '';
        this.successMessage = '';

        this.abusService.changerStatut(abus.idAbus, 'CONFIRME').subscribe({
            next: (abusMisAJour) => {
                this.abus = this.abus.map((item) =>
                    item.idAbus === abusMisAJour.idAbus
                        ? abusMisAJour
                        : item
                );

                this.appliquerFiltres();

                if (this.abusSelectionne?.idAbus === abusMisAJour.idAbus) {
                    this.abusSelectionne = abusMisAJour;
                }

                this.successMessage = 'L’abus a été confirmé avec succès.';
                this.idAbusEnCours = null;
            },
            error: (error) => {
                console.error('Erreur lors de la confirmation :', error);

                this.errorMessage =
                    'La confirmation a échoué. Vérifiez vos droits et réessayez.';

                this.idAbusEnCours = null;
            }
        });
    }

    reinitialiserFiltres(): void {
        this.recherche = '';
        this.filtreStatut = '';
        this.filtreGravite = '';
        this.appliquerFiltres();
    }

    ouvrirPieceJointe(abus: AbusResponseDto): void {
        if (!abus.pieceJointeUrl) {
            return;
        }

        window.open(abus.pieceJointeUrl, '_blank', 'noopener,noreferrer');
    }
}

