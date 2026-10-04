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