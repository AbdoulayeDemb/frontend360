import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { StructureService } from '../../../core/services/structure.service';

import {
    StructureCompetenteRequestDto,
    StructureCompetenteResponseDto
} from '../../../core/models/structure-competente.model';

import { EnumTypeStructure } from '../../../core/models/enums.model';

@Component({
    selector: 'app-structure-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './structure-form.component.html',
    styleUrl: './structure-form.component.css'
})
export class StructureFormComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly structureService = inject(StructureService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    readonly EnumTypeStructure = EnumTypeStructure;

    structureForm!: FormGroup;

    structureId: number | null = null;

    isEditMode = false;
    isLoading = false;
    isSubmitting = false;

    errorMessage = '';
    successMessage = '';

    readonly typesStructures = [
        {
            value: EnumTypeStructure.MAIRIE,
            label: 'Mairie'
        },
        {
            value: EnumTypeStructure.EDM_SA,
            label: 'EDM-SA'
        },
        {
            value: EnumTypeStructure.SAPEURS_POMPIERS,
            label: 'Sapeurs-pompiers'
        },
        {
            value: EnumTypeStructure.SOMAGEP,
            label: 'SOMAGEP'
        },
        {
            value: EnumTypeStructure.GIE,
            label: 'GIE'
        },
        {
            value: EnumTypeStructure.POLICE,
            label: 'Police'
        }
    ];

    ngOnInit(): void {
        this.initialiserForm();
        this.detecterMode();
    }

    initialiserForm(): void {
        this.structureForm = this.fb.group({
            nomStructure: [
                '',
                [
                    Validators.required,
                    Validators.minLength(2)
                ]
            ],

            quartier: [
                ''
            ],

            typeStructure: [
                EnumTypeStructure.MAIRIE,
                Validators.required
            ],

            telephoneUrgence: [
                ''
            ]
        });
    }

    detecterMode(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            this.structureId = Number(id);
            this.isEditMode = true;

            this.chargerStructure(this.structureId);
        } else {
            this.isEditMode = false;
        }
    }

    chargerStructure(idStructure: number): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.structureService
            .obtenirStructureParId(idStructure)
            .subscribe({
                next: (structure) => {
                    this.remplirFormulaire(structure);
                    this.isLoading = false;
                },

                error: (error) => {
                    console.error(
                        'Erreur lors du chargement de la structure :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de charger cette structure.';

                    this.isLoading = false;
                }
            });
    }

    remplirFormulaire(
        structure: StructureCompetenteResponseDto
    ): void {

        this.structureForm.patchValue({
            nomStructure: structure.nomStructure,
            quartier: structure.quartier || '',
            typeStructure: structure.typeStructure,
            telephoneUrgence: structure.telephoneUrgence || ''
        });
    }

    isInvalid(controlName: string): boolean {
        const control = this.structureForm.get(controlName);

        return !!(
            control &&
            control.invalid &&
            (control.dirty || control.touched)
        );
    }

    enregistrer(): void {
        this.errorMessage = '';
        this.successMessage = '';

        if (this.structureForm.invalid) {
            this.structureForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;

        const formValue = this.structureForm.value;

        const dto: StructureCompetenteRequestDto = {
            nomStructure: formValue.nomStructure.trim(),
            quartier: this.normaliserValeur(
                formValue.quartier
            ),
            typeStructure: formValue.typeStructure,
            telephoneUrgence: this.normaliserValeur(
                formValue.telephoneUrgence
            )
        };

        if (
            this.isEditMode &&
            this.structureId !== null
        ) {

            this.structureService
                .modifierStructure(
                    this.structureId,
                    dto
                )
                .subscribe({

                    next: () => {
                        this.isSubmitting = false;
                        this.successMessage =
                            'Structure modifiée avec succès.';

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
                                'Impossible de modifier cette structure.'
                            );

                        this.isSubmitting = false;
                    }
                });

        } else {

            this.structureService
                .creerStructure(dto)
                .subscribe({

                    next: () => {
                        this.isSubmitting = false;
                        this.successMessage =
                            'Structure créée avec succès.';

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
                                'Impossible de créer cette structure.'
                            );

                        this.isSubmitting = false;
                    }
                });
        }
    }

    private normaliserValeur(
        valeur: string | null | undefined
    ): string | undefined {

        if (!valeur || !valeur.trim()) {
            return undefined;
        }

        return valeur.trim();
    }

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

    retourListe(): void {
        this.router.navigate([
            '/admin/structures'
        ]);
    }
}