import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { PreuveResolutionResponseDto } from '../models/preuve-resolution.model';

@Injectable({
  providedIn: 'root'
})
export class PreuveService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/preuves';
  private readonly apiOrigin = new URL(this.apiUrl).origin;

  obtenirToutesLesPreuves(): Observable<PreuveResolutionResponseDto[]> {
    return this.http.get<PreuveResolutionResponseDto[]>(this.apiUrl).pipe(
      map(preuves => preuves.map(preuve => ({
        ...preuve,
        photoApresUrl: this.resolvePhotoUrl(preuve.photoApresUrl)
      })))
    );
  }

  private resolvePhotoUrl(photoUrl?: string): string | undefined {
    const path = photoUrl?.trim();
    return path ? new URL(path, `${this.apiOrigin}/`).toString() : undefined;
  }
}