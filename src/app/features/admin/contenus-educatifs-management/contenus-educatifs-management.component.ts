import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import {
    ContenuEducatifResponseDto
} from '../../../core/models/contenu-educatif.model';

import {
    EnumFormat,
    EnumThematique
} from '../../../core/models/enums.model';

import {
    ContenuEducatifService
} from '../../../core/services/contenu-educatif.service';

@Component({
    selector: 'app-contenus-educatifs-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule
    ],
    templateUrl: './contenus-educatifs-management.component.html',
    styleUrls: ['./contenus-educatifs-management.component.css']
})
export class ContenusEducatifsManagementComponent implements OnInit {

    private readonly contenuEducatifService =
        inject(ContenuEducatifService);

    private readonly router = inject(Router);

    contenus: ContenuEducatifResponseDto[] = [];
    contenusFiltres: ContenuEducatifResponseDto[] = [];

    recherche = '';
    themeSelectionne = '';
    formatSelectionne = '';

    chargement = false;
    erreur = '';

    readonly themes = Object.values(EnumThematique);
    readonly formats = Object.values(EnumFormat);

    ngOnInit(): void {
        this.chargerContenus();
    }

    /**
     * Charger tous les contenus éducatifs
     */
    chargerContenus(): void {

        this.chargement = true;
        this.erreur = '';

        this.contenuEducatifService
            .obtenirTousLesContenus()
            .subscribe({

                next: (contenus) => {

                    this.contenus = contenus;

                    this.appliquerFiltres();

                    this.chargement = false;
                },

                error: (error) => {

                    console.error(
                        'Erreur lors du chargement des contenus éducatifs :',
                        error
                    );

                    this.erreur =
                        'Impossible de charger les contenus éducatifs.';

                    this.chargement = false;
                }
            });
    }

    /**
     * Recherche + filtres
     */
    appliquerFiltres(): void {

        const rechercheNormalisee =
            this.recherche.trim().toLowerCase();

        this.contenusFiltres =
            this.contenus.filter((contenu) => {

                const correspondRecherche =
                    !rechercheNormalisee ||
                    contenu.titre
                        .toLowerCase()
                        .includes(rechercheNormalisee) ||
                    contenu.mediaUrl
                        .toLowerCase()
                        .includes(rechercheNormalisee) ||
                    (contenu.nomAuteur ?? '')
                        .toLowerCase()
                        .includes(rechercheNormalisee);

                const correspondTheme =
                    !this.themeSelectionne ||
                    contenu.theme === this.themeSelectionne;

                const correspondFormat =
                    !this.formatSelectionne ||
                    contenu.format === this.formatSelectionne;

                return (
                    correspondRecherche &&
                    correspondTheme &&
                    correspondFormat
                );
            });
    }

    /**
     * Réinitialiser les filtres
     */
    reinitialiserFiltres(): void {

        this.recherche = '';
        this.themeSelectionne = '';
        this.formatSelectionne = '';

        this.appliquerFiltres();
    }

    /**
     * Aller vers le formulaire de création
     */
    nouveauContenu(): void {

        this.router.navigate([
            '/admin/contenus-educatifs/nouveau'
        ]);
    }

    /**
     * Modifier un contenu
     */
    modifierContenu(idContenu: number): void {

        this.router.navigate([
            '/admin/contenus-educatifs',
            idContenu,
            'modifier'
        ]);
    }

    /**
     * Supprimer un contenu
     */
    supprimerContenu(
        contenu: ContenuEducatifResponseDto
    ): void {

        const confirmation = confirm(
            `Voulez-vous vraiment supprimer le contenu "${contenu.titre}" ?`
        );

        if (!confirmation) {
            return;
        }

        this.contenuEducatifService
            .supprimerContenu(contenu.idContenu)
            .subscribe({

                next: () => {

                    this.contenus =
                        this.contenus.filter(
                            (item) =>
                                item.idContenu !==
                                contenu.idContenu
                        );

                    this.appliquerFiltres();
                },

                error: (error) => {

                    console.error(
                        'Erreur lors de la suppression :',
                        error
                    );

                    alert(
                        'Impossible de supprimer ce contenu éducatif.'
                    );
                }
            });
    }

    /**
     * Libellé lisible du thème
     */
    getLibelleTheme(
        theme: EnumThematique
    ): string {

        switch (theme) {

            case EnumThematique.ASSAINISSEMENT:
                return 'Assainissement';

            case EnumThematique.RECYCLAGE:
                return 'Recyclage';

            case EnumThematique.SECOURISME:
                return 'Secourisme';

            case EnumThematique.CITOYENNETE:
                return 'Citoyenneté';

            default:
                return theme;
        }
    }

    /**
     * Libellé lisible du format
     */
    getLibelleFormat(
        format: EnumFormat
    ): string {

        switch (format) {

            case EnumFormat.AUDIO:
                return 'Audio';

            case EnumFormat.VIDEO:
                return 'Vidéo';

            case EnumFormat.IMAGE:
                return 'Image';

            default:
                return format;
        }
    }

    /**
     * Icône Bootstrap selon le format
     */
    getIconeFormat(
        format: EnumFormat
    ): string {

        switch (format) {

            case EnumFormat.AUDIO:
                return 'bi bi-volume-up';

            case EnumFormat.VIDEO:
                return 'bi bi-play-circle';

            case EnumFormat.IMAGE:
                return 'bi bi-image';

            default:
                return 'bi bi-file-earmark';
        }
    }
}