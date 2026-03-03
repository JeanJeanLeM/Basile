export type CropType = 
  | 'Légume-fruit'
  | 'Légume-feuille'
  | 'Légume-racine'
  | 'Légume-graine'
  | 'Aromatique'
  | 'Fleur comestible';

export type PlantingMethod = 'serre' | 'plein_champ' | 'both';

export interface Crop {
  id: string;
  name: string;
  type: CropType;
  imageUrl?: string;
  emoji?: string; // Fallback si pas d'image
  weeksBetweenSowingAndPlanting: number; // Semaines entre semis et plantation
  weeksBetweenPlantingAndHarvest: number; // Semaines entre plantation et récolte
  weeksBetweenHarvestAndDestruction?: number; // Semaines entre récolte et destruction (optionnel)
  sowingWeeks: number[]; // 1-52
  plantingWeeks: number[]; // 1-52
  plantingMethod: PlantingMethod; // 'serre' | 'plein_champ' | 'both'
  userId: string; // Propriétaire de la culture
  createdAt: string; // ISO date string
  updatedAt: string;
}
