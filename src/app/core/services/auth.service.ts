import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
    BehaviorSubject,
    Observable,
    tap,
    catchError,
    throwError
} from 'rxjs';

import {
    LoginRequestDto,
    AuthResponseDto,
    APIResponse
} from '../models/auth.model';

import { EnumRole } from '../models/enums.model';
import { Utilisateur } from '../models/utilisateur.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly API_URL = 'http://localhost:8080/api/auth';

    private readonly TOKEN_KEY = 'alert360_token';
    private readonly USER_KEY = 'alert360_user';

    private currentUserSubject =
        new BehaviorSubject<Utilisateur | null>(
            this.getUserFromStorage()
        );

    public currentUser$ =
        this.currentUserSubject.asObservable();

    public currentUserSignal =
        signal<Utilisateur | null>(
            this.getUserFromStorage()
        );

    public isAuthenticatedSignal =
        computed(() => !!this.currentUserSignal());

    constructor(
        private readonly http: HttpClient,
        private readonly router: Router
    ) { }

    login(
        credentials: LoginRequestDto
    ): Observable<APIResponse<AuthResponseDto>> {

        return this.http
            .post<APIResponse<AuthResponseDto>>(
                `${this.API_URL}/login`,
                credentials
            )
            .pipe(
                tap((response) => {

                    if (!response.success || !response.data) {
                        throw new Error(
                            response.message ||
                            'Échec de la connexion.'
                        );
                    }

                    const authData = response.data;

                    const user: Utilisateur = {
                        idUtilisateur: authData.idUtilisateur,
                        nom: authData.nom,
                        prenom: authData.prenom,
                        telephone: authData.telephone,
                        email: authData.email,
                        role: authData.role,
                        estActif: authData.estActif,
                        quartier: authData.quartier,
                        idStructure: authData.idStructure,
                        estResponsable: authData.estResponsable
                    };

                    this.saveSession(
                        authData.token,
                        user
                    );
                }),

                catchError((error) => {

                    console.error(
                        'Erreur lors de la connexion :',
                        error
                    );

                    return throwError(() => error);
                })
            );
    }

    logout(): void {

        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);

        this.currentUserSubject.next(null);
        this.currentUserSignal.set(null);

        this.router.navigate(['/auth/login']);
    }

    private saveSession(
        token: string,
        user: Utilisateur
    ): void {

        localStorage.setItem(
            this.TOKEN_KEY,
            token
        );

        localStorage.setItem(
            this.USER_KEY,
            JSON.stringify(user)
        );

        this.currentUserSubject.next(user);
        this.currentUserSignal.set(user);
    }

    public get currentUserValue(): Utilisateur | null {
        return this.currentUserSubject.value;
    }

    public getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    public isLoggedIn(): boolean {

        return !!this.getToken() &&
            !!this.currentUserValue;
    }

    public hasRole(role: EnumRole): boolean {

        const user = this.currentUserValue;

        return !!user && user.role === role;
    }

    public isAdmin(): boolean {
        return this.hasRole(EnumRole.ADMIN);
    }

    public isStructure(): boolean {
        return this.hasRole(EnumRole.STRUCTURE);
    }

    public isCitoyen(): boolean {
        return this.hasRole(EnumRole.CITOYEN);
    }

    public isResponsableStructure(): boolean {

        const user = this.currentUserValue;

        return !!user &&
            user.role === EnumRole.STRUCTURE &&
            user.estResponsable === true;
    }

    public getIdStructure(): number | null {

        const user = this.currentUserValue;

        return user?.idStructure ?? null;
    }

    private getUserFromStorage(): Utilisateur | null {

        const userJson =
            localStorage.getItem(this.USER_KEY);

        if (!userJson) {
            return null;
        }

        try {

            return JSON.parse(userJson) as Utilisateur;

        } catch (error) {

            console.error(
                'Erreur lors de la récupération de l’utilisateur depuis le stockage :',
                error
            );

            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.USER_KEY);

            return null;
        }
    }
}