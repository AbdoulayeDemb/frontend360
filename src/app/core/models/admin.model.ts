import { Utilisateur } from './utilisateur.model';
import { ContenuEducatif } from './contenu-educatif.model';
import { EnumRole } from './enums.model';

// Interface principale (Admin hérite de Utilisateur)
export interface Admin extends Utilisateur {
    // Relations optionnelles selon le mapping DTO du backend
    actualitesPubliees?: any[];
    contenusEducatifsPublies?: ContenuEducatif[];
}

// DTO pour la création d'un Administrateur (Request)
export interface AdminRequestDto {
    nom: string;
    prenom: string;
    telephone: string;
    email?: string;
    motDePasse: string;
}

// DTO pour la réponse API (Response)
export interface AdminResponseDto {
    idUtilisateur: number;
    nom: string;
    prenom: string;
    telephone: string;
    email?: string;
    role: EnumRole;
    estActif: boolean;
    dateCreation: string;
    nombreContenusPublies?: number;
}