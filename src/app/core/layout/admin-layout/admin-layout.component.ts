import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AdminTopbarComponent } from '../admin-topbar/admin-topbar.component';

import { AdminSearchService } from '../../../core/services/admin-search.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    AdminSidebarComponent,
    AdminTopbarComponent
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {

  private readonly adminSearchService =
    inject(AdminSearchService);

  private readonly authService =
    inject(AuthService);

  get isStructure(): boolean {
    return this.authService.isStructure();
  }


  // =========================================================
  // RECHERCHE GLOBALE
  // =========================================================

  onGlobalSearch(searchTerm: string): void {

    this.adminSearchService.setSearchTerm(
      searchTerm
    );
  }
}