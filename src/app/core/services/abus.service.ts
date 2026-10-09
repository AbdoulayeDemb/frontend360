import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { AbusRequestDto, AbusResponseDto } from '../models/abus.model';

@Injectable({ providedIn: 'root' })
export class AbusService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/abus';
  private readonly apiOrigin = new URL(this.apiUrl).origin;

  obtenirLesAbus(): Observable<AbusResponseDto[]> {
    return this.http.get<AbusResponseDto[]>(this.apiUrl).pipe(
      map(abus => abus.map(item => this.resolvePieceJointe(item)))
    );
  }

  classerCommeAbus(dto: AbusRequestDto, pieceJointe: File | null): Observable<AbusResponseDto> {
    const formData = new FormData();
    formData.append('abus', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    if (pieceJointe) {
      formData.append('pieceJointe', pieceJointe);
    }
    return this.http.post<AbusResponseDto>(this.apiUrl, formData).pipe(
      map(abus => this.resolvePieceJointe(abus))
    );
  }

  changerStatut(idAbus: number, statut: 'CONFIRME'): Observable<AbusResponseDto> {
    return this.http.patch<AbusResponseDto>(`${this.apiUrl}/${idAbus}/statut`, null, {
      params: { statut }
    }).pipe(map(abus => this.resolvePieceJointe(abus)));
  }

  telechargerPieceJointe(idAbus: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${idAbus}/piece-jointe`, { responseType: 'blob' });
  }

  private resolvePieceJointe(abus: AbusResponseDto): AbusResponseDto {
    const path = abus.pieceJointeUrl?.trim();
    return path
      ? { ...abus, pieceJointeUrl: new URL(path, `${this.apiOrigin}/`).toString() }
      : abus;
  }
}
