export interface Actualite {
    idActualite: number;
    titre: string;
    corpsTexte: string;
    communeCible?: string;
    estUrgent: boolean;
    datePublication: string;

    // Image hébergée sur Supabase
    imageUrl?: string | null;

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

    // URL publique de l'image Supabase
    imageUrl?: string | null;
}

// DTO retourné par l'API
export interface ActualiteResponseDto {
    idActualite: number;
    titre: string;
    corpsTexte: string;
    communeCible?: string;
    estUrgent: boolean;
    datePublication: string;

    // URL publique de l'image Supabase
    imageUrl?: string | null;

    // Auteur de l'actualité
    idAdminAuteur?: number;
    nomAdminAuteur?: string;
}