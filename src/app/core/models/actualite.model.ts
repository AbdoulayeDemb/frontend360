// Interface principale de lecture (Actualité)
export interface Actualite {
    idActualite: number;
    titre: string;
    corpsTexte: string;
    communeCible?: string;
    estUrgent: boolean;
    datePublication: string;

    // Relation Auteur (Admin)
    idAuteur: number;
    nomAuteur?: string;
    prenomAuteur?: string;
}

// DTO pour la création ou modification d'une actualité (Request)
export interface ActualiteRequestDto {
    titre: string;
    corpsTexte: string;
    communeCible?: string;
    estUrgent?: boolean;
    idAuteur: number;
}

// DTO de réponse API (Response)
export interface ActualiteResponseDto {
    idActualite: number;
    titre: string;
    corpsTexte: string;
    communeCible?: string;
    estUrgent: boolean;
    datePublication: string;
    idAuteur: number;
    nomCompletAuteur?: string;
}