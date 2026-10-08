import { EnumTypePreuve } from './enums.model';

export interface PreuveResolution {
    idPreuve: number;
    typePreuve: EnumTypePreuve;
    photoApresUrl?: string;
    rapportTexte?: string;
    dateResolution: string;
    idSignalement?: number;
    codeTrackingUnique?: string;
}

export interface PreuveResolutionRequestDto {
    typePreuve: EnumTypePreuve;
    photoApresUrl?: string;
    rapportTexte?: string;
    idSignalement: number;
}

export interface PreuveResolutionResponseDto {
    idPreuve: number;
    typePreuve: EnumTypePreuve;
    photoApresUrl?: string;
    rapportTexte?: string;
    dateResolution: string;
    idSignalement?: number;
    codeTrackingUnique?: string;
    nomAgent?: string;
    prenomAgent?: string;
    telephoneAgent?: string;
    matriculeAgent?: string;
}