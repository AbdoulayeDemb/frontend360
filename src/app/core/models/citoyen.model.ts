import { Utilisateur } from './utilisateur.model';
import { Signalement } from './signalement.model';

export interface Citoyen extends Utilisateur {
    quartier: string;
    pointScore: number;
    nombreSignalementsInvalides: number;
    badgesCiviques: string[];
    signalements?: Signalement[];
}

export interface CitoyenRequestDto {
    nom: string;
    prenom: string;
    telephone: string;
    email?: string;
    motDePasse: string;
    quartier: string;
}

export interface CitoyenResponseDto {
    idUtilisateur: number;
    nom: string;
    prenom: string;
    telephone: string;
    email?: string;
    quartier: string;
    pointScore: number;
    nombreSignalementsInvalides: number;
    badgesCiviques: string[];
    role: string;
    estActif: boolean;
    dateCreation: string;
}