import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterModule],
  host: {
    '[class.structure-sidebar]': 'isStructure'
  },
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent {
  private readonly authService = inject(AuthService);

  get isStructure(): boolean {
    return this.authService.isStructure();
  }

  logout(): void {
    this.authService.logout();
  }
}
