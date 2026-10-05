import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
    StructureCompetenteResponseDto,
    StructureCompetenteRequestDto
} from '../models/structure-competente.model';

@Injectable({
    providedIn: 'root'
})
export class StructureService {

    private readonly apiUrl = 'http://localhost:8080/api/structures';

    constructor(private http: HttpClient) { }

    obtenirToutesLesStructures(): Observable<StructureCompetenteResponseDto[]> {
        return this.http.get<StructureCompetenteResponseDto[]>(
            this.apiUrl
        );
    }

    obtenirStructureParId(
        idStructure: number
    ): Observable<StructureCompetenteResponseDto> {
        return this.http.get<StructureCompetenteResponseDto>(
            `${this.apiUrl}/${idStructure}`
        );
    }

    obtenirStructuresParType(
        typeStructure: string
    ): Observable<StructureCompetenteResponseDto[]> {
        return this.http.get<StructureCompetenteResponseDto[]>(
            `${this.apiUrl}/type/${typeStructure}`
        );
    }

    creerStructure(
        dto: StructureCompetenteRequestDto
    ): Observable<StructureCompetenteResponseDto> {
        return this.http.post<StructureCompetenteResponseDto>(
            this.apiUrl,
            dto
        );
    }

    modifierStructure(
        idStructure: number,
        dto: StructureCompetenteRequestDto
    ): Observable<StructureCompetenteResponseDto> {
        return this.http.put<StructureCompetenteResponseDto>(
            `${this.apiUrl}/${idStructure}`,
            dto
        );
    }

    supprimerStructure(
        idStructure: number
    ): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}/${idStructure}`
        );
    }
}