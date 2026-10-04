import { EnumStatut, EnumTypeUrgence } from './enums.model';
import { AgentStructureResponseDto } from './agent-structure.model'; // Correction chemin d'import
import { PreuveResolutionResponseDto } from './preuve-resolution.model';

export interface Signalement {
    idSignalement: number;
    codeTrackingUnique: string;
    typeUrgence: EnumTypeUrgence;
    statut: EnumStatut;
    photoAvantUrl?: string;
    audioUrl?: string;
    description: string;
    repereVisuel?: string;
    dateHeureAlerte: string;
    latitude: number;
    longitude: number;

    idCitoyen: number;
    nomCitoyen?: string;
    prenomCitoyen?: string;
    telephoneCitoyen?: string;

    idCategorie: number;
    nomCategorie?: string;

    idStructureAssignee?: number;
    nomStructureAssignee?: string;
    agentAssigne?: AgentStructureResponseDto;

    preuveResolution?: PreuveResolutionResponseDto;
}

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

export interface AssignationSignalementDto {
    idSignalement: number;
    idAgentAssigne: number;
}

export interface ChangementStatutDto {
    idSignalement: number;
    statut: EnumStatut;
    motif?: string;
}