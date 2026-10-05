import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { UtilisateurService } from '../../../core/services/utilisateur.service';
import { StructureService } from '../../../core/services/structure.service';

import {
    AdminUtilisateurCreateDto,
    AdminUtilisateurUpdateDto,
    Utilisateur
} from '../../../core/models/utilisateur.model';

import {
    StructureCompetenteResponseDto
} from '../../../core/models/structure-competente.model';

import { EnumRole } from '../../../core/models/enums.model';

@Component({
    selector: 'app-utilisateur-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './utilisateur-form.component.html',
    styleUrl: './utilisateur-form.component.css'
})
export class UtilisateurFormComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly utilisateurService = inject(UtilisateurService);
    private readonly structureService = inject(StructureService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    utilisateurForm!: FormGroup;

    structures: StructureCompetenteResponseDto[] = [];

    utilisateurId: number | null = null;

    isEditMode = false;
    isLoading = false;
    isSubmitting = false;

    errorMessage = '';
    successMessage = '';

    readonly roles = [
        {
            value: EnumRole.CITOYEN,
            label: 'Citoyen'
        },
        {
            value: EnumRole.ADMIN,
            label: 'Administrateur'
        },
        {
            value: EnumRole.STRUCTURE,
            label: 'Agent de structure'
        }
    ];

    ngOnInit(): void {
        this.initialiserForm();
        this.chargerStructures();
        this.detecterMode();
    }

    /**
     * Initialisation du formulaire.
     */
    initialiserForm(): void {

        this.utilisateurForm = this.fb.group({

            nom: [
                '',
                [
                    Validators.required,
                    Validators.minLength(2)
                ]
            ],

            prenom: [
                '',
                [
                    Validators.required,
                    Validators.minLength(2)
                ]
            ],

            telephone: [
                '',
                [
                    Validators.required
                ]
            ],

            email: [
                '',
                [
                    Validators.email
                ]
            ],

            motDePasse: [
                '',
                [
                    Validators.minLength(6)
                ]
            ],

            role: [
                EnumRole.CITOYEN,
                [
                    Validators.required
                ]
            ],

            matriculeAgent: [
                ''
            ],

            idStructure: [
                null
            ],

            estResponsable: [
                false
            ]
        });

        this.utilisateurForm
            .get('role')
            ?.valueChanges
            .subscribe((role: EnumRole) => {
                this.gererChampsStructure(role);
            });

        this.gererChampsStructure(
            this.utilisateurForm.get('role')?.value
        );
    }

    /**
     * Détermine si on est en création ou modification.
     */
    detecterMode(): void {

        const id = this.route.snapshot.paramMap.get('id');

        if (id) {

            this.utilisateurId = Number(id);
            this.isEditMode = true;

            this.chargerUtilisateur(this.utilisateurId);

        } else {

            this.isEditMode = false;

            this.utilisateurForm
                .get('motDePasse')
                ?.setValidators([
                    Validators.required,
                    Validators.minLength(6)
                ]);

            this.utilisateurForm
                .get('motDePasse')
                ?.updateValueAndValidity();
        }
    }

    /**
     * Charge les structures disponibles.
     */
    chargerStructures(): void {

        this.structureService
            .obtenirToutesLesStructures()
            .subscribe({

                next: (structures) => {
                    this.structures = structures;
                },

                error: (error) => {

                    console.error(
                        'Erreur lors du chargement des structures :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de charger les structures.';
                }
            });
    }

    /**
     * Charge l'utilisateur à modifier.
     */
    chargerUtilisateur(idUtilisateur: number): void {

        this.isLoading = true;
        this.errorMessage = '';

        this.utilisateurService
            .obtenirUtilisateurParId(idUtilisateur)
            .subscribe({

                next: (utilisateur) => {

                    this.remplirFormulaire(utilisateur);

                    this.isLoading = false;
                },

                error: (error) => {

                    console.error(
                        'Erreur lors du chargement de l’utilisateur :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de charger cet utilisateur.';

                    this.isLoading = false;
                }
            });
    }

    /**
     * Remplit le formulaire avec les données existantes.
     */
    remplirFormulaire(utilisateur: Utilisateur): void {

        this.utilisateurForm.patchValue({

            nom: utilisateur.nom,

            prenom: utilisateur.prenom,

            telephone: utilisateur.telephone,

            email: utilisateur.email || '',

            role: utilisateur.role,

            matriculeAgent:
                utilisateur.matriculeAgent || '',

            idStructure:
                utilisateur.idStructure || null,

            estResponsable:
                utilisateur.estResponsable || false,

            motDePasse: ''
        });

        /*
         * En modification, le mot de passe n'est pas obligatoire
         * car le backend PUT ne le modifie pas.
         */
        this.utilisateurForm
            .get('motDePasse')
            ?.clearValidators();

        this.utilisateurForm
            .get('motDePasse')
            ?.updateValueAndValidity();

        this.gererChampsStructure(utilisateur.role);
    }

    /**
     * Affiche / masque et valide les champs STRUCTURE.
     */
    gererChampsStructure(role: EnumRole): void {

        const matriculeControl =
            this.utilisateurForm?.get('matriculeAgent');

        const structureControl =
            this.utilisateurForm?.get('idStructure');

        const responsableControl =
            this.utilisateurForm?.get('estResponsable');

        if (!matriculeControl ||
            !structureControl ||
            !responsableControl) {
            return;
        }

        if (role === EnumRole.STRUCTURE) {

            matriculeControl.setValidators([
                Validators.required
            ]);

            structureControl.setValidators([
                Validators.required
            ]);

        } else {

            matriculeControl.clearValidators();

            structureControl.clearValidators();

            matriculeControl.setValue('');

            structureControl.setValue(null);

            responsableControl.setValue(false);
        }

        matriculeControl.updateValueAndValidity();
        structureControl.updateValueAndValidity();
    }

    /**
     * Vérifie si un champ est invalide et doit afficher son erreur.
     */
    isInvalid(controlName: string): boolean {

        const control =
            this.utilisateurForm.get(controlName);

        return !!(
            control &&
            control.invalid &&
            (control.dirty || control.touched)
        );
    }

    /**
     * Soumission du formulaire.
     */
    enregistrer(): void {

        this.errorMessage = '';
        this.successMessage = '';

        if (this.utilisateurForm.invalid) {

            this.utilisateurForm.markAllAsTouched();

            return;
        }

        this.isSubmitting = true;

        const formValue =
            this.utilisateurForm.value;

        if (this.isEditMode && this.utilisateurId !== null) {

            const dto: AdminUtilisateurUpdateDto =
                this.construireUpdateDto(formValue);

            this.utilisateurService
                .modifierUtilisateur(
                    this.utilisateurId,
                    dto
                )
                .subscribe({

                    next: () => {

                        this.isSubmitting = false;

                        this.successMessage =
                            'Utilisateur modifié avec succès.';

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
                                'Impossible de modifier cet utilisateur.'
                            );

                        this.isSubmitting = false;
                    }
                });

        } else {

            const dto: AdminUtilisateurCreateDto =
                this.construireCreateDto(formValue);

            this.utilisateurService
                .creerUtilisateur(dto)
                .subscribe({

                    next: () => {

                        this.isSubmitting = false;

                        this.successMessage =
                            'Utilisateur créé avec succès.';

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
                                'Impossible de créer cet utilisateur.'
                            );

                        this.isSubmitting = false;
                    }
                });
        }
    }

    /**
     * Construction du DTO de création.
     */
    private construireCreateDto(
        value: any
    ): AdminUtilisateurCreateDto {

        const dto: AdminUtilisateurCreateDto = {

            nom: value.nom.trim(),

            prenom: value.prenom.trim(),

            telephone: value.telephone.trim(),

            email: this.normaliserEmail(value.email),

            motDePasse: value.motDePasse,

            role: value.role
        };

        if (value.role === EnumRole.STRUCTURE) {

            dto.matriculeAgent =
                value.matriculeAgent.trim();

            dto.idStructure =
                Number(value.idStructure);

            dto.estResponsable =
                !!value.estResponsable;
        }

        return dto;
    }

    /**
     * Construction du DTO de modification.
     */
    private construireUpdateDto(
        value: any
    ): AdminUtilisateurUpdateDto {

        const dto: AdminUtilisateurUpdateDto = {

            nom: value.nom.trim(),

            prenom: value.prenom.trim(),

            telephone: value.telephone.trim(),

            email: this.normaliserEmail(value.email),

            role: value.role
        };

        if (value.role === EnumRole.STRUCTURE) {

            dto.matriculeAgent =
                value.matriculeAgent.trim();

            dto.idStructure =
                Number(value.idStructure);

            dto.estResponsable =
                !!value.estResponsable;
        }

        return dto;
    }

    /**
     * Normalisation de l'email.
     */
    private normaliserEmail(
        email: string | null | undefined
    ): string | undefined {

        if (!email || !email.trim()) {
            return undefined;
        }

        return email.trim();
    }

    /**
     * Extraction du message envoyé par le backend.
     */
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

    /**
     * Retour à la liste.
     */
    retourListe(): void {
        this.router.navigate(['/admin/utilisateurs']);
    }
}