import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnInit,
  OnDestroy,
  Output,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  Subject,
  timer,
  takeUntil,
  finalize
} from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { Utilisateur } from '../../../core/models/utilisateur.model';

import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.css'
})
export class AdminTopbarComponent implements OnInit, OnDestroy {

  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  // Permet d'arrêter les abonnements à la destruction du composant.
  private readonly destroy$ = new Subject<void>();

  @Output()
  searchChange = new EventEmitter<string>();

  @Input()
  structureMode = false;

  @HostBinding('class.structure-mode')
  get isStructureMode(): boolean {
    return this.structureMode;
  }

  currentUser: Utilisateur | null = null;

  // ==========================================
  // RECHERCHE
  // ==========================================

  searchTerm = '';

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  notifications: Notification[] = [];

  nombreNotificationsNonLues = 0;

  notificationsOpen = false;

  chargementNotifications = false;

  erreurNotifications = '';

  private chargementEnCours = false;

  // Évite plusieurs requêtes de marquage simultanées
  // pour une même notification.
  private notificationsEnCoursDeLecture = new Set<number>();

  private marquageToutesEnCours = false;

  // ==========================================
  // INITIALISATION
  // ==========================================

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;

    // Chargement initial du compteur.
    this.chargerNombreNotificationsNonLues();

    // Actualisation automatique toutes les 15 secondes.
    timer(15000, 15000)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(() => {

        // Toujours actualiser le compteur.
        this.chargerNombreNotificationsNonLues();

        // Actualiser la liste uniquement si le panneau est ouvert.
        if (this.notificationsOpen) {
          this.chargerNotifications();
        }
      });
  }

  // ==========================================
  // RECHERCHE
  // ==========================================

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm = input.value;

    this.searchChange.emit(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';

    this.searchChange.emit('');
  }

  // ==========================================
  // PROFIL UTILISATEUR
  // ==========================================

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

  // ==========================================
  // OUVERTURE / FERMETURE DU PANNEAU
  // ==========================================

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;

    if (this.notificationsOpen) {
      this.chargerNotifications();
    }
  }

  // ==========================================
  // CHARGER LE NOMBRE DE NOTIFICATIONS NON LUES
  // ==========================================

  chargerNombreNotificationsNonLues(): void {
    this.notificationService
      .compterNonLues()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.nombreNotificationsNonLues = response.count ?? 0;
        },

        error: (error) => {
          console.error(
            'Erreur lors du chargement du nombre de notifications :',
            error
          );
        }
      });
  }

  // ==========================================
  // CHARGER LES NOTIFICATIONS
  // ==========================================

  chargerNotifications(): void {
    // Empêcher plusieurs chargements simultanés.
    if (this.chargementEnCours) {
      return;
    }

    this.chargementEnCours = true;
    this.chargementNotifications = true;
    this.erreurNotifications = '';

    this.notificationService
      .getMesNotifications()
      .pipe(
        takeUntil(this.destroy$),

        finalize(() => {
          this.chargementNotifications = false;
          this.chargementEnCours = false;
        })
      )
      .subscribe({
        next: (notifications) => {
          this.notifications = [...notifications].sort(
            (a, b) =>
              new Date(b.dateCreation).getTime() -
              new Date(a.dateCreation).getTime()
          );

          // Synchroniser le compteur avec la liste récupérée.
          this.nombreNotificationsNonLues =
            this.notifications.filter(
              notification => !notification.estLue
            ).length;
        },

        error: (error) => {
          console.error(
            'Erreur lors du chargement des notifications :',
            error
          );

          this.erreurNotifications =
            'Impossible de charger les notifications. ' +
            'Vérifiez votre connexion puis réessayez.';
        }
      });
  }

  // ==========================================
  // MARQUER UNE NOTIFICATION COMME LUE
  // ==========================================

  cliquerNotification(notification: Notification): void {
    // Fermer le panneau au clic.
    this.notificationsOpen = false;

    // Rien à faire si la notification est déjà lue.
    if (notification.estLue) {
      return;
    }

    // Éviter les requêtes répétées pour la même notification.
    if (
      this.notificationsEnCoursDeLecture.has(
        notification.idNotification
      )
    ) {
      return;
    }

    this.notificationsEnCoursDeLecture.add(
      notification.idNotification
    );

    this.notificationService
      .marquerCommeLue(notification.idNotification)
      .pipe(
        takeUntil(this.destroy$),

        finalize(() => {
          this.notificationsEnCoursDeLecture.delete(
            notification.idNotification
          );
        })
      )
      .subscribe({
        next: () => {
          this.notifications = this.notifications.map(item =>
            item.idNotification === notification.idNotification
              ? { ...item, estLue: true }
              : item
          );

          this.nombreNotificationsNonLues = Math.max(
            0,
            this.nombreNotificationsNonLues - 1
          );
        },

        error: (error) => {
          console.error(
            'Erreur lors du marquage de la notification :',
            error
          );
        }
      });
  }

  // ==========================================
  // MARQUER TOUTES LES NOTIFICATIONS COMME LUES
  // ==========================================

  marquerToutesCommeLues(): void {
    if (
      this.nombreNotificationsNonLues === 0 ||
      this.marquageToutesEnCours
    ) {
      return;
    }

    this.marquageToutesEnCours = true;

    this.notificationService
      .marquerToutesCommeLues()
      .pipe(
        takeUntil(this.destroy$),

        finalize(() => {
          this.marquageToutesEnCours = false;
        })
      )
      .subscribe({
        next: () => {
          this.notifications = this.notifications.map(
            notification => ({
              ...notification,
              estLue: true
            })
          );

          this.nombreNotificationsNonLues = 0;
          this.erreurNotifications = '';
        },

        error: (error) => {
          console.error(
            'Erreur lors du marquage de toutes les notifications :',
            error
          );

          this.erreurNotifications =
            'Impossible de marquer toutes les notifications comme lues.';
        }
      });
  }

  // ==========================================
  // ICÔNES SELON LE TYPE DE NOTIFICATION
  // ==========================================

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'NOUVEAU_SIGNALEMENT':
        return 'bi bi-exclamation-triangle';

      case 'ABUS_SIGNALEMENT_DECLARE':
        return 'bi bi-shield-exclamation';

      case 'ABUS_SIGNALEMENT_CONFIRME':
        return 'bi bi-shield-check';

      case 'CHANGEMENT_STATUT':
        return 'bi bi-arrow-repeat';

      case 'NOUVELLE_ACTUALITE':
        return 'bi bi-newspaper';

      case 'ALERTE_URGENTE':
        return 'bi bi-exclamation-octagon';

      case 'ATTRIBUTION_SIGNALEMENT':
        return 'bi bi-person-check';

      case 'NOUVEAU_CONTENU_EDUCATIF':
        return 'bi bi-book';

      default:
        return 'bi bi-bell';
    }
  }

  // ==========================================
  // FORMATER LA DATE
  // ==========================================

  formaterDateNotification(date: string): string {
    if (!date) {
      return '';
    }

    const dateNotification = new Date(date);

    if (Number.isNaN(dateNotification.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(dateNotification);
  }

  // ==========================================
  // NETTOYAGE À LA DESTRUCTION DU COMPOSANT
  // ==========================================

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
