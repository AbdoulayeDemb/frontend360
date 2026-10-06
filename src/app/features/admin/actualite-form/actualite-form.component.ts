import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import {
    ActivatedRoute,
    Router
} from '@angular/router';

import { ActualiteService } from '../../../core/services/actualite.service';

import {
    ActualiteRequestDto,
    ActualiteResponseDto
} from '../../../core/models/actualite.model';

@Component({
    selector: 'app-actualite-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './actualite-form.component.html',
    styleUrl: './actualite-form.component.css'
})
export class ActualiteFormComponent implements OnInit {

    private readonly fb = inject(FormBuilder);

    private readonly actualiteService =
        inject(ActualiteService);

    private readonly route =
        inject(ActivatedRoute);

    private readonly router =
        inject(Router);

    actualiteForm!: FormGroup;

    actualiteId: number | null = null;

    isEditMode = false;

    isLoading = false;

    isSubmitting = false;

    errorMessage = '';

    successMessage = '';

    ngOnInit(): void {

        this.initialiserForm();

        this.detecterMode();
    }

    // ==========================================
    // INITIALISATION DU FORMULAIRE
    // ==========================================

    initialiserForm(): void {

        this.actualiteForm =
            this.fb.group({

                titre: [
                    '',
                    [
                        Validators.required,
                        Validators.minLength(3),
                        Validators.maxLength(200)
                    ]
                ],

                communeCible: [
                    ''
                ],

                corpsTexte: [
                    '',
                    [
                        Validators.required,
                        Validators.minLength(10)
                    ]
                ],

                estUrgent: [
                    false,
                    Validators.required
                ]

            });
    }

    // ==========================================
    // DETECTION CREATION / MODIFICATION
    // ==========================================

    detecterMode(): void {

        const id =
            this.route.snapshot.paramMap.get('id');

        if (id) {

            this.actualiteId = Number(id);

            this.isEditMode = true;

            this.chargerActualite(
                this.actualiteId
            );

        } else {

            this.isEditMode = false;

        }
    }

    // ==========================================
    // CHARGER ACTUALITE
    // ==========================================

    chargerActualite(
        idActualite: number
    ): void {

        this.isLoading = true;

        this.errorMessage = '';

        this.actualiteService
            .obtenirActualiteParId(idActualite)
            .subscribe({

                next: (actualite) => {

                    this.remplirFormulaire(
                        actualite
                    );

                    this.isLoading = false;
                },

                error: (error) => {

                    console.error(
                        'Erreur lors du chargement de l’actualité :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de charger cette actualité.';

                    this.isLoading = false;
                }

            });
    }

    // ==========================================
    // REMPLIR LE FORMULAIRE
    // ==========================================

    remplirFormulaire(
        actualite: ActualiteResponseDto
    ): void {

        this.actualiteForm.patchValue({

            titre:
                actualite.titre,

            communeCible:
                actualite.communeCible || '',

            corpsTexte:
                actualite.corpsTexte,

            estUrgent:
                actualite.estUrgent

        });
    }

    // ==========================================
    // VALIDATION DES CHAMPS
    // ==========================================

    isInvalid(
        controlName: string
    ): boolean {

        const control =
            this.actualiteForm.get(
                controlName
            );

        return !!(
            control &&
            control.invalid &&
            (
                control.dirty ||
                control.touched
            )
        );
    }

    // ==========================================
    // ENREGISTREMENT
    // ==========================================

    enregistrer(): void {

        this.errorMessage = '';

        this.successMessage = '';

        if (this.actualiteForm.invalid) {

            this.actualiteForm.markAllAsTouched();

            return;
        }

        this.isSubmitting = true;

        const formValue =
            this.actualiteForm.value;

        const dto: ActualiteRequestDto = {

            titre:
                formValue.titre.trim(),

            corpsTexte:
                formValue.corpsTexte.trim(),

            communeCible:
                this.normaliserValeur(
                    formValue.communeCible
                ),

            estUrgent:
                Boolean(formValue.estUrgent)

        };

        // ======================================
        // MODIFICATION
        // ======================================

        if (
            this.isEditMode &&
            this.actualiteId !== null
        ) {

            this.actualiteService
                .modifierActualite(
                    this.actualiteId,
                    dto
                )
                .subscribe({

                    next: () => {

                        this.isSubmitting = false;

                        this.successMessage =
                            'Actualité modifiée avec succès.';

                        setTimeout(() => {

                            this.retourListe();

                        }, 700);
                    },

                    error: (error) => {

                        console.error(
                            'Erreur lors de la modification :',
                            error
                        );

                        this.errorMessage =
                            this.extraireMessageErreur(
                                error,
                                'Impossible de modifier cette actualité.'
                            );

                        this.isSubmitting = false;
                    }

                });

        }

        // ======================================
        // CREATION
        // ======================================

        else {

            this.actualiteService
                .creerActualite(dto)
                .subscribe({

                    next: () => {

                        this.isSubmitting = false;

                        this.successMessage =
                            'Actualité publiée avec succès.';

                        setTimeout(() => {

                            this.retourListe();

                        }, 700);
                    },

                    error: (error) => {

                        console.error(
                            'Erreur lors de la création :',
                            error
                        );

                        this.errorMessage =
                            this.extraireMessageErreur(
                                error,
                                'Impossible de publier cette actualité.'
                            );

                        this.isSubmitting = false;
                    }

                });
        }
    }

    // ==========================================
    // NORMALISATION
    // ==========================================

    private normaliserValeur(
        valeur: string | null | undefined
    ): string | undefined {

        if (
            !valeur ||
            !valeur.trim()
        ) {
            return undefined;
        }

        return valeur.trim();
    }

    // ==========================================
    // MESSAGE ERREUR
    // ==========================================

    private extraireMessageErreur(
        error: any,
        messageParDefaut: string
    ): string {

        if (error?.error?.message) {

            return error.error.message;
        }

        if (error?.error?.error) {

            return error.error.error;
        }

        if (
            typeof error?.error === 'string'
        ) {

            return error.error;
        }

        return messageParDefaut;
    }

    // ==========================================
    // RETOUR LISTE
    // ==========================================

    retourListe(): void {

        this.router.navigate([
            '/admin/actualites'
        ]);
    }
}