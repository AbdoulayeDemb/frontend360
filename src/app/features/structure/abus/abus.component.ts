import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AbusResponseDto, StatutAbus, TypeAbus, NiveauGraviteAbus } from '../../../core/models/abus.model';
import { AbusService } from '../../../core/services/abus.service';
import { AuthService } from '../../../core/services/auth.service';

type FiltreAbus = 'TOUS' | 'A_VERIFIER' | 'CONFIRME';

@Component({
  selector: 'app-structure-abus',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './abus.component.html',
  styleUrl: './abus.component.css'
})
export class AbusComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly abusService = inject(AbusService);
  private readonly router = inject(Router);

  readonly pageSize = 6;
  abus: AbusResponseDto[] = [];
  filtre: FiltreAbus = 'TOUS';
  recherche = '';
  pageActuelle = 1;
  abusOuvert: number | null = null;
  confirmationEnCours: number | null = null;
  isLoading = false;
  errorMessage = '';
  actionMessage = '';

  get isResponsable(): boolean {
    return this.authService.isResponsableStructure();
  }

  ngOnInit(): void {
    this.chargerAbus();
  }

  chargerAbus(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.abusService.obtenirLesAbus().subscribe({
      next: abus => {
        this.abus = abus;
        this.appliquerPagination();
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement des abus :', error);
        this.errorMessage = 'Impossible de charger les abus. Réessayez.';
        this.isLoading = false;
      }
    });
  }

  get abusFiltres(): AbusResponseDto[] {
    const terme = this.recherche.trim().toLocaleLowerCase('fr');
    return this.abus.filter(item => {
      const correspondStatut = this.filtre === 'TOUS' || item.statut === this.filtre;
      const texte = [
        item.codeTrackingUnique, item.citoyenNomComplet, item.categorie,
        item.justification, this.labelType(item.typeAbus, item.typeAbusPersonnalise), item.nomStructure
      ].join(' ').toLocaleLowerCase('fr');
      return correspondStatut && (!terme || texte.includes(terme));
    });
  }

  get abusVisibles(): AbusResponseDto[] {
    const debut = (this.pageActuelle - 1) * this.pageSize;
    return this.abusFiltres.slice(debut, debut + this.pageSize);
  }

  get nombrePages(): number {
    return Math.max(1, Math.ceil(this.abusFiltres.length / this.pageSize));
  }

  get pages(): number[] {
    return Array.from({ length: this.nombrePages }, (_, index) => index + 1);
  }

  get nombreAverifier(): number {
    return this.abus.filter(item => item.statut === 'A_VERIFIER').length;
  }

  get nombreConfirmes(): number {
    return this.abus.filter(item => item.statut === 'CONFIRME').length;
  }

  setFiltre(filtre: FiltreAbus): void {
    this.filtre = filtre;
    this.pageActuelle = 1;
  }

  rechercher(event: Event): void {
    this.recherche = (event.target as HTMLInputElement).value;
    this.pageActuelle = 1;
  }

  changerPage(page: number): void {
    this.pageActuelle = Math.max(1, Math.min(page, this.nombrePages));
  }

  basculerDetails(idAbus: number): void {
    this.abusOuvert = this.abusOuvert === idAbus ? null : idAbus;
  }

  voirSignalement(item: AbusResponseDto): void {
    void this.router.navigate(['/structure/signalements', item.idSignalement]);
  }

  ouvrirPieceJointe(event: Event, idAbus: number): void {
    event.preventDefault();
    this.abusService.telechargerPieceJointe(idAbus).subscribe({
      next: fichier => {
        if (this.pieceJointeObjectUrl) URL.revokeObjectURL(this.pieceJointeObjectUrl);
        const objectUrl = URL.createObjectURL(fichier);
        this.pieceJointeObjectUrl = objectUrl;
        window.open(objectUrl, '_blank', 'noopener');
        window.setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
          if (this.pieceJointeObjectUrl === objectUrl) this.pieceJointeObjectUrl = '';
        }, 60_000);
      },
      error: error => {
        console.error('Erreur lors de l’ouverture de la pièce justificative :', error);
        this.errorMessage = 'Impossible d’ouvrir cette pièce justificative.';
      }
    });
  }

  confirmer(item: AbusResponseDto): void {
    if (!this.isResponsable || item.statut !== 'A_VERIFIER' || this.confirmationEnCours !== null) return;
    if (!window.confirm(`Confirmer le classement abusif du signalement ${item.codeTrackingUnique} ?`)) return;

    this.confirmationEnCours = item.idAbus;
    this.errorMessage = '';
    this.actionMessage = '';
    this.abusService.changerStatut(item.idAbus, 'CONFIRME').subscribe({
      next: abusMisAJour => {
        const index = this.abus.findIndex(abus => abus.idAbus === abusMisAJour.idAbus);
        if (index !== -1) this.abus[index] = abusMisAJour;
        this.actionMessage = `L’abus ${item.codeTrackingUnique} est confirmé.`;
        this.confirmationEnCours = null;
      },
      error: error => {
        console.error('Erreur lors de la confirmation de l’abus :', error);
        this.errorMessage = 'La confirmation de cet abus a échoué. Réessayez.';
        this.confirmationEnCours = null;
      }
    });
  }

  nombreParStatut(statut: FiltreAbus): number {
    if (statut === 'TOUS') return this.abus.length;
    return this.abus.filter(item => item.statut === statut).length;
  }

  labelStatut(statut: StatutAbus): string {
    return statut === 'CONFIRME' ? 'Confirmé' : 'À vérifier';
  }

  classeStatut(statut: StatutAbus): string {
    return statut === 'CONFIRME' ? 'status-confirmed' : 'status-pending';
  }

  labelType(type: TypeAbus, typePersonnalise?: string): string {
    if (type === 'AUTRE' && typePersonnalise?.trim()) return typePersonnalise;
    const labels: Record<TypeAbus, string> = {
      FAUSSE_INFORMATION: 'Fausse information',
      FAUSSE_LOCALISATION: 'Fausse localisation',
      PHOTO_NON_CORRESPONDANTE: 'Photo non correspondante',
      AUTRE: 'Autre'
    };
    return labels[type];
  }

  labelGravite(niveau: NiveauGraviteAbus): string {
    const labels: Record<NiveauGraviteAbus, string> = {
      FAIBLE: 'Faible',
      MOYEN: 'Moyen',
      ELEVE: 'Élevé'
    };
    return labels[niveau];
  }

  formatDate(date: string): string {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private pieceJointeObjectUrl = '';

  private appliquerPagination(): void {
    this.pageActuelle = Math.min(this.pageActuelle, this.nombrePages);
  }
}
