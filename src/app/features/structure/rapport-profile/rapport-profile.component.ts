import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-rapport-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rapport-profile.component.html',
  styleUrl: './rapport-profile.component.css'
})
export class RapportProfileComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUserValue;
  readonly structureName = this.currentUser?.nomStructure || 'Votre structure';
  readonly isResponsable = this.currentUser?.estResponsable ?? false;
}
