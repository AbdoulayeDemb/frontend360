import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
    Actualite,
    ActualiteRequestDto,
    ActualiteResponseDto
} from '../models/actualite.model';

@Injectable({
    providedIn: 'root'
})
export class ActualiteService {

    private readonly apiUrl =
        'http://localhost:8080/api/actualites';

    constructor(
        private http: HttpClient
    ) { }

    obtenirToutesLesActualites():
        Observable<ActualiteResponseDto[]> {

        return this.http.get<ActualiteResponseDto[]>(
            this.apiUrl
        );
    }

    obtenirActualiteParId(
        idActualite: number
    ): Observable<ActualiteResponseDto> {

        return this.http.get<ActualiteResponseDto>(
            `${this.apiUrl}/${idActualite}`
        );
    }

    creerActualite(
        dto: ActualiteRequestDto
    ): Observable<ActualiteResponseDto> {

        return this.http.post<ActualiteResponseDto>(
            this.apiUrl,
            dto
        );
    }

    modifierActualite(
        idActualite: number,
        dto: ActualiteRequestDto
    ): Observable<ActualiteResponseDto> {

        return this.http.put<ActualiteResponseDto>(
            `${this.apiUrl}/${idActualite}`,
            dto
        );
    }

    supprimerActualite(
        idActualite: number
    ): Observable<void> {

        return this.http.delete<void>(
            `${this.apiUrl}/${idActualite}`
        );
    }
}