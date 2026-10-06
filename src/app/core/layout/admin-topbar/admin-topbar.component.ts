import { Component, EventEmitter, HostBinding, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';
import { Utilisateur } from '../../../core/models/utilisateur.model';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.css'
})
export class AdminTopbarComponent implements OnInit {

  private readonly authService = inject(AuthService);

  @Output()
  searchChange = new EventEmitter<string>();

  @Input()
  structureMode = false;

  @HostBinding('class.structure-mode')
  get isStructureMode(): boolean {
    return this.structureMode;
  }

  currentUser: Utilisateur | null = null;

  searchTerm = '';

  ngOnInit(): void {
    this.currentUser =
      this.authService.currentUserValue;
  }

  onSearch(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    this.searchTerm = input.value;

    this.searchChange.emit(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchChange.emit('');
  }

  get fullName(): string {
    if (!this.currentUser) {
      return 'Administrateur';
    }

    return `${this.currentUser.prenom} ${this.currentUser.nom}`;
  }

  get initials(): string {
    if (!this.currentUser) {
      return 'AD';
    }

    const prenomInitial =
      this.currentUser.prenom?.charAt(0) || '';

    const nomInitial =
      this.currentUser.nom?.charAt(0) || '';

    return `${prenomInitial}${nomInitial}`.toUpperCase();
  }

  get roleLabel(): string {
    switch (this.currentUser?.role) {
      case 'ADMIN':
        return 'Administrateur';

      case 'STRUCTURE':
        return this.currentUser.estResponsable
          ? 'Responsable de structure'
          : 'Agent de structure';

      case 'CITOYEN':
        return 'Citoyen';

      default:
        return 'Utilisateur';
    }
  }
}