import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { EnumStatut } from '../../../core/models/enums.model';
import { PreuveResolutionResponseDto } from '../../../core/models/preuve-resolution.model';
import { Signalement } from '../../../core/models/signalement.model';
import { AuthService } from '../../../core/services/auth.service';
import { PreuveService } from '../../../core/services/preuve.service';
import { SignalementService } from '../../../core/services/signalement.service';

interface PreuveAvecSignalement {
  preuve: PreuveResolutionResponseDto;
  signalement?: Signalement;
}

type FiltrePreuves = 'toutes' | 'a-confirmer' | 'confirmees';

@Component({
  selector: 'app-structure-preuves',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './structure-preuves.component.html',
  styleUrl: './structure-preuves.component.css'
})
export class StructurePreuvesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly preuveService = inject(PreuveService);
  private readonly signalementService = inject(SignalementService);

  readonly EnumStatut = EnumStatut;
  readonly taillePage = 3;
  preuves: PreuveAvecSignalement[] = [];
  filtre: FiltrePreuves = 'toutes';
  pageActuelle = 1;
  isLoading = false;
  confirmationEnCours: number | null = null;
  errorMessage = '';
  actionMessage = '';

  ngOnInit(): void {
    this.loadPreuves();
  }

  loadPreuves(): void {
    const idStructure = this.authService.getIdStructure();
    if (idStructure === null) {
      this.errorMessage = 'Aucune structure n’est associée à ce compte.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    forkJoin({
      preuves: this.preuveService.obtenirToutesLesPreuves(),
      signalements: this.signalementService.getByStructure(idStructure)
    }).subscribe({
      next: ({ preuves, signalements }) => {
        const signalementsParId = new Map(
          signalements.map(signalement => [signalement.idSignalement, signalement])
        );
        this.preuves = preuves
          .map(preuve => ({
            preuve,
            signalement: preuve.idSignalement === undefined
              ? undefined
              : signalementsParId.get(preuve.idSignalement)
          }))
          .sort((first, second) =>
            new Date(second.preuve.dateResolution).getTime() -
            new Date(first.preuve.dateResolution).getTime()
          );
        this.pageActuelle = 1;
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement des preuves de résolution :', error);
        this.errorMessage = 'Impossible de charger les preuves de résolution. Réessayez.';
        this.isLoading = false;
      }
    });
  }

  get preuvesVisibles(): PreuveAvecSignalement[] {
    if (this.filtre === 'a-confirmer') {
      return this.preuves.filter(item => item.signalement?.statut !== EnumStatut.RESOLU);
    }
    if (this.filtre === 'confirmees') {
      return this.preuves.filter(item => item.signalement?.statut === EnumStatut.RESOLU);
    }
    return this.preuves;
  }

  get preuvesPage(): PreuveAvecSignalement[] {
    const debut = (this.pageActuelle - 1) * this.taillePage;
    return this.preuvesVisibles.slice(debut, debut + this.taillePage);
  }

  get nombrePages(): number {
    return Math.ceil(this.preuvesVisibles.length / this.taillePage);
  }

  get pages(): number[] {
    return Array.from({ length: this.nombrePages }, (_, index) => index + 1);
  }

  get debutAffichage(): number {
    return this.preuvesVisibles.length === 0
      ? 0
      : (this.pageActuelle - 1) * this.taillePage + 1;
  }

  get finAffichage(): number {
    return Math.min(this.pageActuelle * this.taillePage, this.preuvesVisibles.length);
  }

  changerFiltre(filtre: FiltrePreuves): void {
    this.filtre = filtre;
    this.pageActuelle = 1;
  }

  allerALaPage(page: number): void {
    this.pageActuelle = Math.max(1, Math.min(page, this.nombrePages));
  }

  get nombreAConfirmer(): number {
    return this.preuves.filter(item => item.signalement?.statut !== EnumStatut.RESOLU).length;
  }

  get nombreConfirmees(): number {
    return this.preuves.filter(item => item.signalement?.statut === EnumStatut.RESOLU).length;
  }

  confirmerResolution(item: PreuveAvecSignalement): void {
    const signalement = item.signalement;
    if (!signalement || signalement.statut === EnumStatut.RESOLU || this.confirmationEnCours !== null) {
      return;
    }
    if (!window.confirm(`Confirmer la résolution du signalement ${signalement.codeTrackingUnique} ?`)) {
      return;
    }

    this.confirmationEnCours = item.preuve.idPreuve;
    this.errorMessage = '';
    this.actionMessage = '';
    this.signalementService.changeStatut(signalement.idSignalement, EnumStatut.RESOLU).subscribe({
      next: signalementMisAJour => {
        item.signalement = signalementMisAJour;
        this.pageActuelle = Math.min(this.pageActuelle, Math.max(1, this.nombrePages));
        this.actionMessage = `La résolution du signalement ${signalement.codeTrackingUnique} est confirmée.`;
        this.confirmationEnCours = null;
      },
      error: error => {
        console.error('Erreur lors de la confirmation de la résolution :', error);
        this.errorMessage = 'La confirmation a échoué. Le signalement n’a pas été marqué comme résolu.';
        this.confirmationEnCours = null;
      }
    });
  }

  formatDate(date: string): string {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
  }

  nomAgent(preuve: PreuveResolutionResponseDto): string {
    const nomComplet = [preuve.prenomAgent, preuve.nomAgent]
      .filter((part): part is string => Boolean(part?.trim()))
      .join(' ');
    return nomComplet || 'Agent non renseigné';
  }
}
