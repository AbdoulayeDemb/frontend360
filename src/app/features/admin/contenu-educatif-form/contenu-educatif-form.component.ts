import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import {
    ActivatedRoute,
    Router,
    RouterModule
} from '@angular/router';

import {
    EnumFormat,
    EnumThematique
} from '../../../core/models/enums.model';

import {
    ContenuEducatifRequestDto,
    ContenuEducatifResponseDto
} from '../../../core/models/contenu-educatif.model';

import {
    ContenuEducatifService
} from '../../../core/services/contenu-educatif.service';

@Component({
    selector: 'app-contenu-educatif-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule
    ],
    templateUrl: './contenu-educatif-form.component.html',
    styleUrls: ['./contenu-educatif-form.component.css']
})
export class ContenuEducatifFormComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    private readonly contenuEducatifService =
        inject(ContenuEducatifService);

    contenuForm!: FormGroup;

    idContenu: number | null = null;
    modeEdition = false;

    chargement = false;
    enregistrement = false;

    erreur = '';

    readonly themes = Object.values(EnumThematique);
    readonly formats = Object.values(EnumFormat);

    ngOnInit(): void {

        this.initialiserFormulaire();

        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            this.idContenu = Number(id);
            this.modeEdition = true;
            this.chargerContenu();
        }
    }

    /**
     * Initialisation du formulaire
     */
    private initialiserFormulaire(): void {

        this.contenuForm = this.fb.group({

            titre: [
                '',
                [
                    Validators.required,
                    Validators.maxLength(255)
                ]
            ],

            theme: [
                '',
                [
                    Validators.required
                ]
            ],

            format: [
                '',
                [
                    Validators.required
                ]
            ],

            mediaUrl: [
                '',
                [
                    Validators.required,
                    Validators.maxLength(500),
                    Validators.pattern(
                        /^(https?:\/\/|www\.)\S+$/i
                    )
                ]
            ]
        });
    }

    /**
     * Charger le contenu lors d'une modification
     */
    private chargerContenu(): void {

        if (!this.idContenu) {
            return;
        }

        this.chargement = true;
        this.erreur = '';

        this.contenuEducatifService
            .obtenirContenuParId(this.idContenu)
            .subscribe({

                next: (
                    contenu: ContenuEducatifResponseDto
                ) => {

                    this.contenuForm.patchValue({

                        titre: contenu.titre,

                        theme: contenu.theme,

                        format: contenu.format,

                        mediaUrl: contenu.mediaUrl
                    });

                    this.chargement = false;
                },

                error: (error) => {

                    console.error(
                        'Erreur lors du chargement du contenu :',
                        error
                    );

                    console.error(
                        'Réponse backend :',
                        error?.error
                    );

                    console.error(
                        'Détails validation :',
                        error?.error?.data
                    );

                    this.erreur =
                        error?.error?.message ??
                        'Impossible de charger ce contenu éducatif.';

                    this.chargement = false;
                }
            });
    }

    /**
     * Soumission du formulaire
     */
    enregistrer(): void {

        if (this.contenuForm.invalid) {

            this.contenuForm.markAllAsTouched();

            return;
        }

        this.enregistrement = true;
        this.erreur = '';

        /**
         * Récupération propre des valeurs
         */
        const titre =
            String(
                this.contenuForm.get('titre')?.value ?? ''
            ).trim();

        const theme =
            this.contenuForm.get('theme')?.value as EnumThematique;

        const format =
            this.contenuForm.get('format')?.value as EnumFormat;

        const mediaUrl =
            String(
                this.contenuForm.get('mediaUrl')?.value ?? ''
            ).trim();

        /**
         * DTO envoyé au backend
         *
         * IMPORTANT :
         * theme et format correspondent directement
         * aux valeurs des enums Java.
         */
        const dto: ContenuEducatifRequestDto = {
            titre,
            theme,
            format,
            mediaUrl
        };

        /**
         * DEBUG TEMPORAIRE
         *
         * Permet de vérifier exactement ce qui
         * est envoyé à Spring Boot.
         */
        console.log(
            '========== CONTENU EDUCATIF =========='
        );

        console.log(
            'DTO envoyé au backend :',
            dto
        );

        console.log(
            'Titre :',
            dto.titre
        );

        console.log(
            'Thème :',
            dto.theme
        );

        console.log(
            'Format :',
            dto.format
        );

        console.log(
            'URL média :',
            dto.mediaUrl
        );

        console.log(
            '======================================'
        );

        if (
            this.modeEdition &&
            this.idContenu !== null
        ) {

            this.modifier(dto);

        } else {

            this.creer(dto);
        }
    }

    /**
     * Création
     */
    private creer(
        dto: ContenuEducatifRequestDto
    ): void {

        this.contenuEducatifService
            .creerContenu(dto)
            .subscribe({

                next: (response) => {

                    console.log(
                        'Contenu éducatif créé avec succès :',
                        response
                    );

                    this.enregistrement = false;

                    this.router.navigate([
                        '/admin/contenus-educatifs'
                    ]);
                },

                error: (error) => {

                    console.error(
                        '========== ERREUR CREATION =========='
                    );

                    console.error(
                        'Erreur complète :',
                        error
                    );

                    console.error(
                        'Réponse backend :',
                        error?.error
                    );

                    console.error(
                        'Message backend :',
                        error?.error?.message
                    );

                    console.error(
                        'Détails validation :',
                        error?.error?.data
                    );

                    console.error(
                        '======================================'
                    );

                    /**
                     * Si le backend renvoie des détails
                     * de validation, on essaie de les afficher.
                     */
                    const details =
                        error?.error?.data;

                    if (details) {

                        if (
                            typeof details === 'object'
                        ) {

                            this.erreur =
                                Object.entries(details)
                                    .map(
                                        ([champ, message]) =>
                                            `${champ} : ${message}`
                                    )
                                    .join(' | ');

                        } else {

                            this.erreur =
                                String(details);
                        }

                    } else {

                        this.erreur =
                            error?.error?.message ??
                            'Impossible de créer le contenu éducatif.';
                    }

                    this.enregistrement = false;
                }
            });
    }

    /**
     * Modification
     */
    private modifier(
        dto: ContenuEducatifRequestDto
    ): void {

        if (this.idContenu === null) {
            return;
        }

        this.contenuEducatifService
            .modifierContenu(
                this.idContenu,
                dto
            )
            .subscribe({

                next: (response) => {

                    console.log(
                        'Contenu éducatif modifié avec succès :',
                        response
                    );

                    this.enregistrement = false;

                    this.router.navigate([
                        '/admin/contenus-educatifs'
                    ]);
                },

                error: (error) => {

                    console.error(
                        '========== ERREUR MODIFICATION =========='
                    );

                    console.error(
                        'Erreur complète :',
                        error
                    );

                    console.error(
                        'Réponse backend :',
                        error?.error
                    );

                    console.error(
                        'Message backend :',
                        error?.error?.message
                    );

                    console.error(
                        'Détails validation :',
                        error?.error?.data
                    );

                    console.error(
                        '=========================================='
                    );

                    const details =
                        error?.error?.data;

                    if (details) {

                        if (
                            typeof details === 'object'
                        ) {

                            this.erreur =
                                Object.entries(details)
                                    .map(
                                        ([champ, message]) =>
                                            `${champ} : ${message}`
                                    )
                                    .join(' | ');

                        } else {

                            this.erreur =
                                String(details);
                        }

                    } else {

                        this.erreur =
                            error?.error?.message ??
                            'Impossible de modifier le contenu éducatif.';
                    }

                    this.enregistrement = false;
                }
            });
    }

    /**
     * Annuler
     */
    annuler(): void {

        this.router.navigate([
            '/admin/contenus-educatifs'
        ]);
    }

    /**
     * Vérifier si un champ est invalide
     */
    champInvalide(
        nomChamp: string
    ): boolean {

        const champ =
            this.contenuForm.get(nomChamp);

        return !!(
            champ &&
            champ.invalid &&
            champ.touched
        );
    }

    /**
     * Erreur titre
     */
    get erreurTitre(): string {

        const champ =
            this.contenuForm.get('titre');

        if (!champ || !champ.touched) {
            return '';
        }

        if (champ.hasError('required')) {
            return 'Le titre est obligatoire.';
        }

        if (champ.hasError('maxlength')) {
            return 'Le titre ne doit pas dépasser 255 caractères.';
        }

        return '';
    }

    /**
     * Erreur thème
     */
    get erreurTheme(): string {

        const champ =
            this.contenuForm.get('theme');

        if (!champ || !champ.touched) {
            return '';
        }

        if (champ.hasError('required')) {
            return 'La thématique est obligatoire.';
        }

        return '';
    }

    /**
     * Erreur format
     */
    get erreurFormat(): string {

        const champ =
            this.contenuForm.get('format');

        if (!champ || !champ.touched) {
            return '';
        }

        if (champ.hasError('required')) {
            return 'Le format est obligatoire.';
        }

        return '';
    }

    /**
     * Erreur URL
     */
    get erreurMediaUrl(): string {

        const champ =
            this.contenuForm.get('mediaUrl');

        if (!champ || !champ.touched) {
            return '';
        }

        if (champ.hasError('required')) {
            return 'L’URL du média est obligatoire.';
        }

        if (champ.hasError('maxlength')) {
            return 'L’URL ne doit pas dépasser 500 caractères.';
        }

        if (champ.hasError('pattern')) {
            return 'Veuillez saisir une URL valide.';
        }

        return '';
    }

    /**
     * Libellé de la thématique
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
     * Libellé du format
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
}