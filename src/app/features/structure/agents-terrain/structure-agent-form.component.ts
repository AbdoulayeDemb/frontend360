import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AgentStructureRequestDto } from '../../../core/models/agent-structure.model';
import { AgentService } from '../../../core/services/agent.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-structure-agent-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './structure-agent-form.component.html',
  styleUrl: './structure-agent-form.component.css'
})
export class StructureAgentFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly agentService = inject(AgentService);
  private readonly authService = inject(AuthService);
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
  errorMessage = '';

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