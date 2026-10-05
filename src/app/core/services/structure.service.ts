import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
    StructureCompetente,
    StructureCompetenteResponseDto
} from '../models/structure-competente.model';

@Injectable({
    providedIn: 'root'
})
export class StructureService {

    private readonly apiUrl = 'http://localhost:8080/api/structures';

    constructor(private http: HttpClient) { }

    obtenirToutesLesStructures(): Observable<StructureCompetenteResponseDto[]> {
        return this.http.get<StructureCompetenteResponseDto[]>(this.apiUrl);
    }

    obtenirStructureParId(idStructure: number): Observable<StructureCompetenteResponseDto> {
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
}