
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
    Notification,
    NotificationCountResponse,
    MarquerToutesLuesResponse
} from '../models/notification.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private readonly http = inject(HttpClient);

    private readonly apiUrl = 'http://localhost:8080/api/notifications';

    /**
     * Récupérer toutes les notifications de l'utilisateur connecté.
     * GET /api/notifications/mes
     */
    getMesNotifications(): Observable<Notification[]> {
        return this.http.get<Notification[]>(`${this.apiUrl}/mes`);
    }

    /**
     * Récupérer uniquement les notifications non lues.
     * GET /api/notifications/non-lues
     */
    getMesNotificationsNonLues(): Observable<Notification[]> {
        return this.http.get<Notification[]>(`${this.apiUrl}/non-lues`);
    }

    /**
     * Compter les notifications non lues.
     * GET /api/notifications/non-lues/count
     */
    compterNonLues(): Observable<NotificationCountResponse> {
        return this.http.get<NotificationCountResponse>(
            `${this.apiUrl}/non-lues/count`
        );
    }

    /**
     * Marquer une notification comme lue.
     * PATCH /api/notifications/{id}/lue
     */
    marquerCommeLue(idNotification: number): Observable<Notification> {
        return this.http.patch<Notification>(
            `${this.apiUrl}/${idNotification}/lue`,
            {}
        );
    }

    /**
     * Marquer toutes les notifications comme lues.
     * PATCH /api/notifications/tout-lu
     */
    marquerToutesCommeLues(): Observable<MarquerToutesLuesResponse> {
        return this.http.patch<MarquerToutesLuesResponse>(
            `${this.apiUrl}/tout-lu`,
            {}
        );
    }
}
