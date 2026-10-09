import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AgentStructureResponseDto, AgentStructureUpdateDto } from '../../../core/models/agent-structure.model';
import { Utilisateur } from '../../../core/models/utilisateur.model';
import { AgentService } from '../../../core/services/agent.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-rapport-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './rapport-profile.component.html',
  styleUrl: './rapport-profile.component.css'
})
export class RapportProfileComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly agentService = inject(AgentService);
  private readonly authService = inject(AuthService);

  currentUser: Utilisateur | null = this.authService.currentUserValue;
  readonly profileForm = this.formBuilder.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    telephone: ['', Validators.required],
    email: ['', Validators.email],
    matriculeAgent: ['', Validators.required]
  });

  isLoading = false;
  isSubmitting = false;
  isProfileLoaded = false;
  errorMessage = '';
  successMessage = '';
  avatarPreviewUrl: string | null = null;
  avatarMessage = '';
  private avatarObjectUrl: string | null = null;

  get structureName(): string {
    return this.currentUser?.nomStructure || 'Votre structure';
  }

  get isResponsable(): boolean {
    return this.currentUser?.estResponsable ?? false;
  }

  get initials(): string {
    const firstNameInitial = this.profileForm.controls.prenom.value.trim().charAt(0);
    const lastNameInitial = this.profileForm.controls.nom.value.trim().charAt(0);
    return `${firstNameInitial}${lastNameInitial}`.toUpperCase() || 'U';
  }

  ngOnInit(): void {
    if (!this.currentUser) {
      this.errorMessage = 'Impossible de charger le profil de l’utilisateur connecté.';
      return;
    }

    this.remplirFormulaire(this.currentUser);
    this.isLoading = true;
    this.agentService.obtenirAgentParId(this.currentUser.idUtilisateur).subscribe({
      next: agent => {
        this.remplirFormulaireDepuisAgent(agent);
        this.isProfileLoaded = true;
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement du profil :', error);
        this.errorMessage = 'Les informations complètes du profil n’ont pas pu être chargées. La modification est indisponible pour éviter d’écraser des données.';
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.libererApercuAvatar();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.avatarMessage = '';

    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      this.avatarMessage = 'Sélectionnez une image au format PNG ou JPG.';
      input.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.avatarMessage = 'La photo doit peser 2 Mo maximum.';
      input.value = '';
      return;
    }

    this.libererApercuAvatar();
    this.avatarObjectUrl = URL.createObjectURL(file);
    this.avatarPreviewUrl = this.avatarObjectUrl;
    this.avatarMessage = 'Aperçu local uniquement : l’API ne permet pas d’enregistrer une photo de profil.';
  }

  enregistrer(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.isProfileLoaded || !this.currentUser || this.isSubmitting) return;
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const value = this.profileForm.getRawValue();
    const dto: AgentStructureUpdateDto = {
      nom: value.nom.trim(),
      prenom: value.prenom.trim(),
      telephone: value.telephone.trim(),
      email: value.email.trim() || undefined,
      matriculeAgent: value.matriculeAgent.trim()
    };

    this.isSubmitting = true;
    this.agentService.modifierAgent(this.currentUser.idUtilisateur, dto).subscribe({
      next: agent => this.apresEnregistrement(agent),
      error: error => {
        console.error('Erreur lors de la modification du profil :', error);
        this.errorMessage = error.error?.message || 'Impossible d’enregistrer les modifications du profil.';
        this.isSubmitting = false;
      }
    });
  }

  annuler(): void {
    if (!this.currentUser) return;
    this.remplirFormulaire(this.currentUser);
    this.avatarMessage = '';
    this.avatarPreviewUrl = null;
    this.libererApercuAvatar();
    this.errorMessage = '';
    this.successMessage = '';
  }

  private apresEnregistrement(agent: AgentStructureResponseDto): void {
    const updatedUser: Utilisateur = {
      ...this.currentUser!,
      nom: agent.nom,
      prenom: agent.prenom,
      telephone: agent.telephone,
      email: agent.email,
      matriculeAgent: agent.matriculeAgent,
      idStructure: agent.idStructure,
      nomStructure: agent.nomStructure,
      estResponsable: agent.estResponsable,
      role: agent.role,
      estActif: agent.estActif
    };

    this.currentUser = updatedUser;
    this.authService.mettreAJourUtilisateur(updatedUser);
    this.remplirFormulaire(updatedUser);
    this.successMessage = 'Vos informations ont été enregistrées.';
    this.isSubmitting = false;
  }

  private remplirFormulaire(user: Utilisateur): void {
    this.profileForm.patchValue({
      nom: user.nom || '',
      prenom: user.prenom || '',
      telephone: user.telephone || '',
      email: user.email || '',
      matriculeAgent: user.matriculeAgent || ''
    });
  }

  private remplirFormulaireDepuisAgent(agent: AgentStructureResponseDto): void {
    this.currentUser = {
      ...this.currentUser!,
      nom: agent.nom,
      prenom: agent.prenom,
      telephone: agent.telephone,
      email: agent.email,
      matriculeAgent: agent.matriculeAgent,
      idStructure: agent.idStructure,
      nomStructure: agent.nomStructure,
      estResponsable: agent.estResponsable,
      role: agent.role,
      estActif: agent.estActif
    };
    this.authService.mettreAJourUtilisateur(this.currentUser);
    this.remplirFormulaire(this.currentUser);
  }

  private libererApercuAvatar(): void {
    if (this.avatarObjectUrl) URL.revokeObjectURL(this.avatarObjectUrl);
    this.avatarObjectUrl = null;
  }
}
