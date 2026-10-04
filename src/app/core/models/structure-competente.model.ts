import { EnumTypeStructure } from './enums.model';
import { AgentStructureResponseDto } from './agent-structure.model'; // Correction chemin d'import

export interface StructureCompetente {
    idStructure: number;
    nomStructure: string;
    quartier?: string;
    typeStructure: EnumTypeStructure;
    telephoneUrgence?: string;
    zoneCouvertureGPS?: any;
    agents?: AgentStructureResponseDto[];
    nombreAgents?: number;
    nombreSignalementsActifs?: number;
}

export interface StructureCompetenteRequestDto {
    nomStructure: string;
    quartier?: string;
    typeStructure: EnumTypeStructure;
    telephoneUrgence?: string;
    zoneCouvertureGPS?: any;
}

export interface StructureCompetenteResponseDto {
    idStructure: number;
    nomStructure: string;
    quartier?: string;
    typeStructure: EnumTypeStructure;
    telephoneUrgence?: string;
    zoneCouvertureGPS?: any;
    nombreAgents?: number;
    nombreSignalementsActifs?: number;
}