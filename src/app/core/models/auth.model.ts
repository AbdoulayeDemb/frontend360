import { EnumRole } from './enums.model';

export interface LoginRequestDto {
    telephone: string;
    motDePasse: string;
}

export interface AuthResponseDto {
    token: string;
    type: string;

    idUtilisateur: number;
    nom: string;
    prenom: string;
    telephone: string;
    email?: string;

    role: EnumRole;
    estActif: boolean;

    quartier?: string;
    idStructure?: number;
    estResponsable?: boolean;
}

export interface APIResponse<T> {
    success: boolean;
    message: string;
    data: T;
    date: string;
}