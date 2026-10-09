import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AbusService } from '../../../core/services/abus.service';
import { AuthService } from '../../../core/services/auth.service';
import { Signalement } from '../../../core/models/signalement.model';
import { EnumStatut } from '../../../core/models/enums.model';
import { SignalementService } from '../../../core/services/signalement.service';
import { AbusResponseDto, NiveauGraviteAbus, TypeAbus } from '../../../core/models/abus.model';

@Component({
  selector: 'app-abus-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './abus-form.component.html',
  styleUrl: './abus-form.component.css'
})
export class AbusFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly abusService = inject(AbusService);
  private readonly signalementService = inject(SignalementService);

  readonly typesAbus: { value: TypeAbus; label: string }[] = [
    { value: 'FAUSSE_INFORMATION', label: 'Fausse information' },
    { value: 'FAUSSE_LOCALISATION', label: 'Fausse localisation' },
    { value: 'PHOTO_NON_CORRESPONDANTE', label: 'Photo non correspondante' },
    { value: 'AUTRE', label: 'Autre' }
  ];
  readonly niveauxGravite: { value: NiveauGraviteAbus; label: string }[] = [
    { value: 'FAIBLE', label: 'Faible' },
    { value: 'MOYEN', label: 'Moyen' },
    { value: 'ELEVE', label: 'Élevé' }
  ];
  readonly form = this.formBuilder.nonNullable.group({
    typeAbus: this.formBuilder.nonNullable.control<TypeAbus>('FAUSSE_INFORMATION', Validators.required),
    typeAbusPersonnalise: this.formBuilder.nonNullable.control('', []),
    niveauGravite: this.formBuilder.nonNullable.control<NiveauGraviteAbus>('MOYEN', Validators.required),
    justification: ['', [Validators.required, Validators.maxLength(5000)]]
  });

  signalement: Signalement | null = null;
  pieceJointe: File | null = null;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  fileError = '';
  existingAbus: AbusResponseDto | null = null;

  get isResponsable(): boolean {
    return this.authService.isResponsableStructure();
  }

  ngOnInit(): void {
    this.form.controls.typeAbus.valueChanges.subscribe(typeAbus => {
      const typePersonnalise = this.form.controls.typeAbusPersonnalise;
      if (typeAbus === 'AUTRE') {
        typePersonnalise.setValidators([Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]);
      } else {
        typePersonnalise.clearValidators();
        typePersonnalise.setValue('');
      }
      typePersonnalise.updateValueAndValidity();
    });

    if (!this.isResponsable) {
      this.errorMessage = 'Seul le responsable de la structure peut classer un signalement comme abus.';
      return;
    }
    const idSignalement = Number(this.route.snapshot.paramMap.get('idSignalement'));
    const idStructure = this.authService.getIdStructure();
    if (!Number.isInteger(idSignalement) || idSignalement < 1 || idStructure === null) {
      this.errorMessage = 'Le signalement ou la structure est introuvable.';
      return;
    }

    this.isLoading = true;
    forkJoin({
      signalements: this.signalementService.getByStructure(idStructure),
      abus: this.abusService.obtenirLesAbus()
    }).subscribe({
      next: ({ signalements, abus }) => {
        this.signalement = signalements.find(item => item.idSignalement === idSignalement) ?? null;
        this.existingAbus = abus.find(item => item.idSignalement === idSignalement) ?? null;
        if (!this.signalement) {
          this.errorMessage = 'Ce signalement ne relève pas de votre structure.';
        } else if (this.existingAbus) {
          this.errorMessage = 'Ce signalement a déjà été classé comme abus.';
        } else if (!this.estEligibleAuClassement(this.signalement)) {
          this.errorMessage = 'Un signalement résolu ou déjà attribué à un agent ne peut pas être classé comme abus.';
        }
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement du signalement à classer :', error);
        this.errorMessage = 'Impossible de vérifier le signalement. Réessayez.';
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.fileError = '';
    this.pieceJointe = null;
    if (!file) return;

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      this.fileError = 'Formats acceptés : PNG, JPG, WEBP, PDF ou DOC/DOCX.';
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.fileError = 'La pièce jointe ne doit pas dépasser 10 Mo.';
      input.value = '';
      return;
    }
    this.pieceJointe = file;
  }

  retirerPieceJointe(input: HTMLInputElement): void {
    this.pieceJointe = null;
    input.value = '';
  }

  soumettre(): void {
    if (!this.signalement || this.existingAbus || !this.estEligibleAuClassement(this.signalement) ||
        this.isSubmitting || !this.isResponsable) return;
    this.form.markAllAsTouched();
    if (this.form.invalid || this.fileError) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.abusService.classerCommeAbus({
      idSignalement: this.signalement.idSignalement,
      typeAbus: this.form.controls.typeAbus.value,
      ...(this.form.controls.typeAbus.value === 'AUTRE'
        ? { typeAbusPersonnalise: this.form.controls.typeAbusPersonnalise.value.trim() }
        : {}),
      niveauGravite: this.form.controls.niveauGravite.value,
      justification: this.form.controls.justification.value
    }, this.pieceJointe).subscribe({
      next: () => {
        void this.router.navigate(['/structure/abus']);
      },
      error: error => {
        console.error('Erreur lors du classement du signalement comme abus :', error);
        this.errorMessage = error.status === 409
          ? 'Ce signalement a déjà été classé comme abus.'
          : 'Le classement a échoué. Vérifiez les informations puis réessayez.';
        this.isSubmitting = false;
      }
    });
  }

  labelType(type: TypeAbus): string {
    return this.typesAbus.find(item => item.value === type)?.label ?? type;
  }

  labelGravite(niveau: NiveauGraviteAbus): string {
    return this.niveauxGravite.find(item => item.value === niveau)?.label ?? niveau;
  }

  estEligibleAuClassement(signalement: Signalement): boolean {
    return signalement.statut !== EnumStatut.RESOLU &&
      signalement.idAgentAssigne == null &&
      !signalement.agentAssigne;
  }
}
