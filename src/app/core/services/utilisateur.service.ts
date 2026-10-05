import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
    Utilisateur,
    AdminUtilisateurCreateDto,
    AdminUtilisateurUpdateDto
} from '../models/utilisateur.model';

@Injectable({
    providedIn: 'root'
})
export class UtilisateurService {

    private readonly apiUrl =
        'http://localhost:8080/api/admin/utilisateurs';

    constructor(private http: HttpClient) { }

    // Récupérer tous les utilisateurs
    obtenirTousLesUtilisateurs(): Observable<Utilisateur[]> {
        return this.http.get<Utilisateur[]>(this.apiUrl);
    }

    // Récupérer un utilisateur par son ID
    obtenirUtilisateurParId(idUtilisateur: number): Observable<Utilisateur> {
        return this.http.get<Utilisateur>(
            `${this.apiUrl}/${idUtilisateur}`
        );
    }

    // Ajouter un nouvel utilisateur
    creerUtilisateur(
        dto: AdminUtilisateurCreateDto
    ): Observable<Utilisateur> {
        return this.http.post<Utilisateur>(
            this.apiUrl,
            dto
        );
    }

    // Modifier un utilisateur
    modifierUtilisateur(
        idUtilisateur: number,
        dto: AdminUtilisateurUpdateDto
    ): Observable<Utilisateur> {
        return this.http.put<Utilisateur>(
            `${this.apiUrl}/${idUtilisateur}`,
            dto
        );
    }

    // Activer ou désactiver un compte
    changerStatutCompte(
        idUtilisateur: number,
        estActif: boolean
    ): Observable<Utilisateur> {
        return this.http.patch<Utilisateur>(
            `${this.apiUrl}/${idUtilisateur}/statut`,
            null,
            {
                params: {
                    estActif: String(estActif)
                }
            }
        );
    }
}