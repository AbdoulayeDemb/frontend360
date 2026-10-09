import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  AgentStructureRequestDto,
  AgentStructureUpdateDto
} from '../../../core/models/agent-structure.model';
import { AgentService } from '../../../core/services/agent.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-structure-agent-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './structure-agent-form.component.html',
  styleUrl: './structure-agent-form.component.css'
})
export class StructureAgentFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly agentService = inject(AgentService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly structureId = this.authService.getIdStructure();
  readonly structureName = this.authService.currentUserValue?.nomStructure || 'Votre structure';

  readonly agentForm = this.formBuilder.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    telephone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    matriculeAgent: ['', Validators.required],
    motDePasse: ['', [Validators.required, Validators.minLength(6)]]
  });

  isSubmitting = false;
  isLoading = false;
  isEditMode = false;
  isAgentLoaded = false;
  private agentId: number | null = null;
  errorMessage = '';

  ngOnInit(): void {
    const idParameter = this.route.snapshot.paramMap.get('id');
    if (idParameter === null) return;

    this.isEditMode = true;
    const id = Number(idParameter);
    if (!Number.isInteger(id) || id < 1) {
      this.errorMessage = 'Identifiant d’agent invalide.';
      return;
    }

    if (!this.authService.currentUserValue?.estResponsable) {
      this.errorMessage = 'Seul le responsable de la structure peut modifier un agent.';
      return;
    }

    this.agentId = id;
    this.agentForm.controls.motDePasse.setValidators([Validators.minLength(6)]);
    this.agentForm.controls.motDePasse.updateValueAndValidity();
    this.isLoading = true;
    this.agentService.obtenirAgentParId(id).subscribe({
      next: agent => {
        if (this.structureId === null || agent.idStructure !== this.structureId || agent.estResponsable) {
          this.errorMessage = 'Cet agent ne peut pas être modifié depuis votre structure.';
          this.isLoading = false;
          return;
        }
        this.agentForm.patchValue({
          nom: agent.nom,
          prenom: agent.prenom,
          telephone: agent.telephone,
          email: agent.email || '',
          matriculeAgent: agent.matriculeAgent
        });
        this.isAgentLoaded = true;
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement de l’agent à modifier :', error);
        this.errorMessage = error.error?.message || 'Impossible de charger cet agent.';
        this.isLoading = false;
      }
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.agentForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  enregistrer(): void {
    this.errorMessage = '';

    if (this.agentForm.invalid) {
      this.agentForm.markAllAsTouched();
      return;
    }

    if (this.structureId === null) {
      this.errorMessage = 'Aucune structure n’est associée à ce compte.';
      return;
    }

    const value = this.agentForm.getRawValue();
    if (this.isEditMode && this.agentId !== null) {
      const dto: AgentStructureUpdateDto = {
        nom: value.nom.trim(),
        prenom: value.prenom.trim(),
        telephone: value.telephone.trim(),
        email: value.email.trim(),
        matriculeAgent: value.matriculeAgent.trim(),
        ...(value.motDePasse.trim() ? { motDePasse: value.motDePasse.trim() } : {})
      };
      this.isSubmitting = true;
      this.agentService.modifierAgent(this.agentId, dto).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/structure/agents']);
        },
        error: error => {
          console.error('Erreur lors de la modification de l’agent :', error);
          this.errorMessage = error.status === 403
            ? 'Votre compte n’est pas autorisé à modifier cet agent.'
            : error.error?.message || 'Impossible de modifier cet agent.';
          this.isSubmitting = false;
        }
      });
      return;
    }

    const dto: AgentStructureRequestDto = {
      nom: value.nom.trim(),
      prenom: value.prenom.trim(),
      telephone: value.telephone.trim(),
      email: value.email.trim(),
      motDePasse: value.motDePasse,
      matriculeAgent: value.matriculeAgent.trim(),
      estResponsable: false,
      idStructure: this.structureId
    };

    this.isSubmitting = true;
    this.agentService.creerAgent(this.structureId, dto).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/structure/agents']);
      },
      error: error => {
        console.error('Erreur lors de la création de l’agent :', error);
        this.errorMessage = error.status === 403
          ? 'Votre compte n’est pas autorisé à créer un agent. Vérifiez les droits de l’API.'
          : error.error?.message || 'Impossible de créer cet agent.';
        this.isSubmitting = false;
      }
    });
  }

  retourListe(): void {
    this.router.navigate(['/structure/agents']);
  }
}