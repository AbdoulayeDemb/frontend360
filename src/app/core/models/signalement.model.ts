import { EnumStatut, EnumTypeUrgence } from './enums.model';
import { AgentStructureResponseDto } from './agent-structure.model';
import { PreuveResolutionResponseDto } from './preuve-resolution.model';

/**
 * Modèle Angular d'un signalement.
 *
 * Les noms utilisés ici correspondent aux données
 * transformées par SignalementService.
 */
export interface Signalement {
    idSignalement: number;
    codeTrackingUnique: string;

    typeUrgence: EnumTypeUrgence;
    statut: EnumStatut;

    description: string;

    photoAvantUrl?: string;
    audioUrl?: string;
    repereVisuel?: string;

    dateHeureAlerte: string;

    latitude: number;
    longitude: number;

    // Citoyen
    idCitoyen: number;
    citoyenNomComplet?: string;

    // Catégorie
    idCategorie: number;
    nomCategorie?: string;

    // Structure assignée
    idStructureAssignee?: number;
    nomStructureAssignee?: string;

    // Informations complémentaires
    agentAssigne?: AgentStructureResponseDto;
    preuveResolution?: PreuveResolutionResponseDto;
}


/**
 * DTO utilisé pour créer un signalement.
 *
 * Correspond au SignalementRequestDto du backend.
 */
export interface SignalementCreateDto {
    typeUrgence: EnumTypeUrgence;
    description: string;

    latitude: number;
    longitude: number;

    repereVisuel?: string;

    idCategorie: number;
    idCitoyen: number;

    photoAvantUrl?: string;
    audioUrl?: string;
}


/**
 * DTO utilisé pour assigner un signalement à un agent.
 *
 * Correspond au AssignationSignalementRequestDto du backend.
 *
 * Le backend attend uniquement :
 * {
 *     "idAgent": 123
 * }
 */
export interface AssignationSignalementDto {
    idAgent: number;
}


/**
 * DTO pratique côté Angular pour représenter
 * un changement de statut.
 *
 * Attention :
 * le backend actuel reçoit réellement le statut
 * comme paramètre query :
 *
 * PATCH /api/signalements/{id}/statut?statut=RESOLU
 *
 * Cette interface n'est donc pas directement envoyée
 * par SignalementService.changeStatut().
 */
export interface ChangementStatutDto {
    statut: EnumStatut;
}