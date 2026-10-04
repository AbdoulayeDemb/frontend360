import { EnumStatutAction } from './enums.model';
import { CitoyenResponseDto } from './citoyen.model';

// Interface principale pour la lecture d'une action citoyenne
export interface ActionCitoyenne {
    idAction: number;
    dateHeureRendezVous: string;
    lieuRassemblement: string;
    nombreParticipantsInscrits: number;
    statutAction: EnumStatutAction;

    // Relations optionnelles
    idSignalementOrigine?: number;
    codeTrackingSignalement?: string;
    participants?: CitoyenResponseDto[];
}

// DTO pour la création ou modification d'une action citoyenne (Request)
export interface ActionCitoyenneRequestDto {
    dateHeureRendezVous: string;
    lieuRassemblement: string;
    idSignalementOrigine?: number;
}

// DTO pour la réponse de l'API REST (Response)
export interface ActionCitoyenneResponseDto {
    idAction: number;
    dateHeureRendezVous: string;
    lieuRassemblement: string;
    nombreParticipantsInscrits: number;
    statutAction: EnumStatutAction;
    idSignalementOrigine?: number;
    codeTrackingSignalement?: string;
    estInscritParCitoyenConnecte?: boolean;
}