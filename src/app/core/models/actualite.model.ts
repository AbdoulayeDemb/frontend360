export interface Actualite {
    idActualite: number;
    titre: string;
    corpsTexte: string;
    communeCible?: string;
    estUrgent: boolean;
    datePublication: string;

    // Auteur de l'actualité
    idAdminAuteur?: number;
    nomAdminAuteur?: string;
}


// DTO envoyé au backend
// L'auteur est déterminé automatiquement
// par l'administrateur connecté.
export interface ActualiteRequestDto {
    titre: string;
    corpsTexte: string;
    communeCible?: string;
    estUrgent: boolean;
}


// DTO retourné par l'API
export interface ActualiteResponseDto {
    idActualite: number;
    titre: string;
    corpsTexte: string;
    communeCible?: string;
    estUrgent: boolean;
    datePublication: string;

    idAdminAuteur?: number;
    nomAdminAuteur?: string;
}