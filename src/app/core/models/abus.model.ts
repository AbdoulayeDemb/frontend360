export type TypeAbus =
  | 'FAUSSE_INFORMATION'
  | 'FAUSSE_LOCALISATION'
  | 'PHOTO_NON_CORRESPONDANTE'
  | 'AUTRE';

export type NiveauGraviteAbus = 'FAIBLE' | 'MOYEN' | 'ELEVE';
export type StatutAbus = 'A_VERIFIER' | 'CONFIRME';

export interface AbusRequestDto {
  idSignalement: number;
  typeAbus: TypeAbus;
  typeAbusPersonnalise?: string;
  niveauGravite: NiveauGraviteAbus;
  justification: string;
}

export interface AbusResponseDto extends AbusRequestDto {
  idAbus: number;
  codeTrackingUnique: string;
  citoyenNomComplet?: string;
  categorie?: string;
  typeAbusPersonnalise?: string;
  statut: StatutAbus;
  pieceJointeUrl?: string;
  dateClassement: string;
  nomStructure?: string;
}
