import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
    ContenuEducatifRequestDto,
    ContenuEducatifResponseDto
} from '../models/contenu-educatif.model';

@Injectable({
    providedIn: 'root'
})
export class ContenuEducatifService {

    private readonly apiUrl = 'http://localhost:8080/api/contenus';

    constructor(private http: HttpClient) { }

    /**
     * Récupérer tous les contenus éducatifs
     */
    obtenirTousLesContenus(): Observable<ContenuEducatifResponseDto[]> {
        return this.http.get<ContenuEducatifResponseDto[]>(this.apiUrl);
    }

    /**
     * Récupérer un contenu éducatif par son identifiant
     */
    obtenirContenuParId(
        idContenu: number
    ): Observable<ContenuEducatifResponseDto> {
        return this.http.get<ContenuEducatifResponseDto>(
            `${this.apiUrl}/${idContenu}`
        );
    }

    /**
     * Créer un contenu éducatif
     *
     * L'auteur est déterminé automatiquement
     * par le backend à partir de l'administrateur connecté.
     */
    creerContenu(
        dto: ContenuEducatifRequestDto
    ): Observable<ContenuEducatifResponseDto> {
        return this.http.post<ContenuEducatifResponseDto>(
            this.apiUrl,
            dto
        );
    }

    /**
     * Modifier un contenu éducatif
     */
    modifierContenu(
        idContenu: number,
        dto: ContenuEducatifRequestDto
    ): Observable<ContenuEducatifResponseDto> {
        return this.http.put<ContenuEducatifResponseDto>(
            `${this.apiUrl}/${idContenu}`,
            dto
        );
    }

    /**
     * Supprimer un contenu éducatif
     */
    supprimerContenu(idContenu: number): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}/${idContenu}`
        );
    }
}