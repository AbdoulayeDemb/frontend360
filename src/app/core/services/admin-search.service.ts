import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AdminSearchService {

    private readonly searchSubject =
        new BehaviorSubject<string>('');

    readonly search$: Observable<string> =
        this.searchSubject.asObservable();


    // =========================================================
    // MODIFIER LA RECHERCHE
    // =========================================================

    setSearchTerm(searchTerm: string): void {

        this.searchSubject.next(
            searchTerm.trim().toLowerCase()
        );
    }


    // =========================================================
    // RÉCUPÉRER LA RECHERCHE ACTUELLE
    // =========================================================

    getSearchTerm(): string {
        return this.searchSubject.value;
    }


    // =========================================================
    // EFFACER LA RECHERCHE
    // =========================================================

    clearSearch(): void {
        this.searchSubject.next('');
    }
}