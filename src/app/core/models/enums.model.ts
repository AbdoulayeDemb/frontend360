// Rôles utilisateurs du système
export enum EnumRole {
    CITOYEN = 'CITOYEN',
    ADMIN = 'ADMIN',
    STRUCTURE = 'STRUCTURE'
}

// Format des médias
export enum EnumFormat {
    AUDIO = 'AUDIO',
    VIDEO = 'VIDEO',
    IMAGE = 'IMAGE'
}

// Statut des signalements
export enum EnumStatut {
    DECLARE = 'DECLARE',
    EN_COURS = 'EN_COURS',
    RESOLU = 'RESOLU',
    REJETE = 'REJETE'
}

// Statut des actions planifiées
export enum EnumStatutAction {
    PLANIFIEE = 'PLANIFIEE',
    EN_COURS = 'EN_COURS',
    TERMINEE = 'TERMINEE',
    ANNULEE = 'ANNULEE'
}

// Thématiques des interventions / sensibilisations
export enum EnumThematique {
    ASSAINISSEMENT = 'ASSAINISSEMENT',
    RECYCLAGE = 'RECYCLAGE',
    SECOURISME = 'SECOURISME',
    CITOYENNETE = 'CITOYENNETE'
}

// Types de preuve de résolution
export enum EnumTypePreuve {
    PHOTO_APRES = 'PHOTO_APRES',
    RAPPORT_AGENT = 'RAPPORT_AGENT'
}

// Types de structures compétentes
export enum EnumTypeStructure {
    MAIRIE = 'MAIRIE',
    EDM_SA = 'EDM_SA',
    SAPEURS_POMPIERS = 'SAPEURS_POMPIERS',
    SOMAGEP = 'SOMAGEP',
    GIE = 'GIE',
    POLICE = 'POLICE'
}

// Niveaux d'urgence des signalements
export enum EnumTypeUrgence {
    FAIBLE = 'FAIBLE',
    MOYENNE = 'MOYENNE',
    ELEVEE = 'ELEVEE',
    CRITIQUE = 'CRITIQUE'
}