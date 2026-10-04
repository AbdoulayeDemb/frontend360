import { EnumTypeStructure } from './enums.model';
import { Signalement } from './signalement.model';

export interface Categorie {
    idCategorie: number;
    nom: string;
    typeStructureCible?: EnumTypeStructure;
    signalements?: Signalement[];
}

export interface CategorieRequestDto {
    nom: string;
    typeStructureCible?: EnumTypeStructure;
}

export interface CategorieResponseDto {
    idCategorie: number;
    nom: string;
    typeStructureCible?: EnumTypeStructure;
    nombreSignalementsAssocies?: number;
}