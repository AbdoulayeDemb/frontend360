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

    private readonly actualiteService = inject(ActualiteService);

    private readonly route = inject(ActivatedRoute);

    private readonly router = inject(Router);

    actualiteForm!: FormGroup;

    actualiteId: number | null = null;

    isEditMode = false;

    isLoading = false;

    isSubmitting = false;

    errorMessage = '';

    successMessage = '';

    // ==========================================
    // NOTIFICATION DE SUCCÈS
    // ==========================================

    notificationVisible = false;

    notificationTitre = '';

    notificationMessage = '';

    // ==========================================
    // INITIALISATION
    // ==========================================

    ngOnInit(): void {
        this.initialiserForm();
        this.detecterMode();
    }

    // ==========================================
    // INITIALISATION DU FORMULAIRE
    // ==========================================

    initialiserForm(): void {
        this.actualiteForm = this.fb.group({

            titre: [
                '',
                [
                    Validators.required,
                    Validators.minLength(3),
                    Validators.maxLength(200)
                ]
            ],

            communeCible: [''],

            corpsTexte: [
                '',
                [
                    Validators.required,
                    Validators.minLength(10)
                ]
            ],

            estUrgent: [false],

            imageUrl: [
                '',
                [Validators.pattern(/^https?:\/\/.+/i)]
            ]

        });
    }

    // ==========================================
    // DÉTECTION CRÉATION / MODIFICATION
    // ==========================================

    detecterMode(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            this.actualiteId = Number(id);
            this.isEditMode = true;

            this.chargerActualite(this.actualiteId);
        } else {
            this.isEditMode = false;
        }
    }

    // ==========================================
    // CHARGEMENT D'UNE ACTUALITÉ
    // ==========================================

    chargerActualite(idActualite: number): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.actualiteService
            .obtenirActualiteParId(idActualite)
            .subscribe({

                next: (actualite) => {
                    this.remplirFormulaire(actualite);
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

    remplirFormulaire(actualite: ActualiteResponseDto): void {
        this.actualiteForm.patchValue({

            titre: actualite.titre,

            communeCible: actualite.communeCible || '',

            corpsTexte: actualite.corpsTexte,

            estUrgent: actualite.estUrgent,

            imageUrl: actualite.imageUrl || ''

        });
    }

    // ==========================================
    // VALIDATION DES CHAMPS
    // ==========================================

    isInvalid(controlName: string): boolean {
        const control = this.actualiteForm.get(controlName);

        return !!(
            control &&
            control.invalid &&
            (control.dirty || control.touched)
        );
    }

    // ==========================================
    // APERÇU DE L'IMAGE
    // ==========================================

    onImagePreviewError(): void {
        this.errorMessage =
            'Impossible de charger l’aperçu. Vérifiez que l’URL de l’image est publique et correcte.';
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

        const formValue = this.actualiteForm.getRawValue();

        const dto: ActualiteRequestDto = {

            titre: formValue.titre.trim(),

            corpsTexte: formValue.corpsTexte.trim(),

            communeCible: this.normaliserValeur(
                formValue.communeCible
            ),

            estUrgent: Boolean(formValue.estUrgent),

            imageUrl: this.normaliserValeur(
                formValue.imageUrl
            ) ?? null

        };

        // ======================================
        // MODIFICATION
        // ======================================

        if (this.isEditMode && this.actualiteId !== null) {

            this.actualiteService
                .modifierActualite(this.actualiteId, dto)
                .subscribe({

                    next: () => {
                        this.isSubmitting = false;

                        this.successMessage =
                            'Actualité modifiée avec succès.';

                        this.afficherNotification(
                            'Modification réussie !',
                            'Les modifications de cette actualité ont été enregistrées avec succès.'
                        );
                    },

                    error: (error) => {
                        console.error(
                            'Erreur lors de la modification :',
                            error
                        );

                        this.errorMessage = this.extraireMessageErreur(
                            error,
                            'Impossible de modifier cette actualité.'
                        );

                        this.isSubmitting = false;
                    }

                });

        } else {

            // ======================================
            // CRÉATION
            // ======================================

            this.actualiteService
                .creerActualite(dto)
                .subscribe({

                    next: () => {
                        this.isSubmitting = false;

                        this.successMessage =
                            'Actualité publiée avec succès.';

                        this.afficherNotification(
                            'Publication réussie !',
                            'Votre actualité a été publiée avec succès.'
                        );
                    },

                    error: (error) => {
                        console.error(
                            'Erreur lors de la création :',
                            error
                        );

                        this.errorMessage = this.extraireMessageErreur(
                            error,
                            'Impossible de publier cette actualité.'
                        );

                        this.isSubmitting = false;
                    }

                });

        }
    }

    // ==========================================
    // AFFICHER LA NOTIFICATION DE SUCCÈS
    // ==========================================

    private afficherNotification(
        titre: string,
        message: string
    ): void {
        this.notificationTitre = titre;
        this.notificationMessage = message;
        this.notificationVisible = true;
    }

    // ==========================================
    // FERMER LA POPUP ET RETOURNER À LA LISTE
    // ==========================================

    fermerNotification(): void {
        if (!this.notificationVisible) {
            return;
        }

        this.notificationVisible = false;
        this.retourListe();
    }

    // ==========================================
    // NORMALISATION
    // ==========================================

    private normaliserValeur(
        valeur: string | null | undefined
    ): string | undefined {

        if (!valeur || !valeur.trim()) {
            return undefined;
        }

        return valeur.trim();
    }

    // ==========================================
    // MESSAGE D'ERREUR
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

        if (typeof error?.error === 'string') {
            return error.error;
        }

        return messageParDefaut;
    }

    // ==========================================
    // RETOUR À LA LISTE
    // ==========================================

    retourListe(): void {
        this.router.navigate(['/admin/actualites']);
    }

}
