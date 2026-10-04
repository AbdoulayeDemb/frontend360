import { Utilisateur } from './utilisateur.model';
import { StructureCompetenteResponseDto } from './structure-competente.model';
import { EnumRole } from './enums.model';

export interface AgentStructure extends Utilisateur {
    matriculeAgent: string;
    estResponsable: boolean;
    structure: StructureCompetenteResponseDto;
}

export interface AgentStructureRequestDto {
    nom: string;
    prenom: string;
    telephone: string;
    email?: string;
    motDePasse: string;
    matriculeAgent: string;
    estResponsable?: boolean;
    idStructure?: number;
}

export interface AgentStructureResponseDto {
    idUtilisateur: number;
    nom: string;
    prenom: string;
    telephone: string;
    email?: string;
    matriculeAgent: string;
    estResponsable: boolean;
    role: EnumRole;
    estActif: boolean;
    dateCreation: string;
    idStructure: number;
    nomStructure: string;
}