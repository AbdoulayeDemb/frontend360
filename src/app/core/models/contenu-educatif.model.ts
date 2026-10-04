import { EnumThematique, EnumFormat } from './enums.model';

export interface ContenuEducatif {
    idContenu: number;
    titre: string;
    theme: EnumThematique;
    format: EnumFormat;
    mediaUrl: string;
    datePublication: string;
    idAuteur: number;
    nomAuteur?: string;
    prenomAuteur?: string;
}

export interface ContenuEducatifRequestDto {
    titre: string;
    theme: EnumThematique;
    format: EnumFormat;
    mediaUrl: string;
    idAuteur: number;
}

export interface ContenuEducatifResponseDto {
    idContenu: number;
    titre: string;
    theme: EnumThematique;
    format: EnumFormat;
    mediaUrl: string;
    datePublication: string;
    idAuteur: number;
    nomCompletAuteur?: string;
}