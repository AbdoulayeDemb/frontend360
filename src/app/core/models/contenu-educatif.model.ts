import { EnumThematique, EnumFormat } from './enums.model';

export interface ContenuEducatif {
    idContenu: number;
    titre: string;
    theme: EnumThematique;
    format: EnumFormat;
    mediaUrl: string;
    datePublication: string;

    auteurId?: number;
    nomAuteur?: string;
}

export interface ContenuEducatifRequestDto {
    titre: string;
    theme: EnumThematique;
    format: EnumFormat;
    mediaUrl: string;
}

export interface ContenuEducatifResponseDto {
    idContenu: number;
    titre: string;
    theme: EnumThematique;
    format: EnumFormat;
    mediaUrl: string;
    datePublication: string;

    auteurId?: number;
    nomAuteur?: string;
}