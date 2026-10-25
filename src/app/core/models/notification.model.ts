export type TypeNotification =
    | 'NOUVEAU_SIGNALEMENT'
    | 'CHANGEMENT_STATUT'
    | 'NOUVELLE_ACTUALITE'
    | 'ALERTE_URGENTE'
    | 'ATTRIBUTION_SIGNALEMENT'
    | 'NOUVEAU_CONTENU_EDUCATIF'
    | 'ABUS_SIGNALEMENT_DECLARE'
    | 'ABUS_SIGNALEMENT_CONFIRME';

export interface Notification {
    idNotification: number;
    type: TypeNotification;
    titre: string;
    message: string;
    estLue: boolean;
    dateCreation: string;
    referenceType: string | null;
    referenceId: number | null;
}

export interface NotificationCountResponse {
    count: number;
}

export interface MarquerToutesLuesResponse {
    message: string;
    nombreNotificationsModifiees: number;
}
