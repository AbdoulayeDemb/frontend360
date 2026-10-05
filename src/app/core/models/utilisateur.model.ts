import { EnumRole } from './enums.model';

export interface Utilisateur {
    idUtilisateur: number;

    nom: string;

    prenom: string;

    telephone: string;

    email?: string;

    estActif: boolean;

    role: EnumRole;

    dateCreation?: string;

    // Informations spécifiques selon le rôle
    quartier?: string;

    matriculeAgent?: string;

    idStructure?: number;

    nomStructure?: string;

    estResponsable?: boolean;
}

export interface ProfilUpdateDto {
    nom: string;

    prenom: string;

    telephone: string;

    email?: string;
}

export interface ChangementMotDePasseDto {
    ancienMotDePasse: string;

    nouveauMotDePasse: string;
}

export interface AdminUtilisateurCreateDto {
    nom: string;
    prenom: string;
    telephone: string;
    email?: string;
    motDePasse: string;
    role: EnumRole;

    matriculeAgent?: string;
    idStructure?: number;
    estResponsable?: boolean;
}

export interface AdminUtilisateurUpdateDto {
    nom: string;
    prenom: string;
    telephone: string;
    email?: string;
    role: EnumRole;

    matriculeAgent?: string;
    idStructure?: number;
    estResponsable?: boolean;
}