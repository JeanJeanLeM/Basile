export interface UserPreferences {
  userId: string;
  hasGreenhouse: boolean;
  directSowing: boolean;
  yearLongCrops: string[]; // IDs des cultures à récolter toute l'année
  excludedCrops: string[]; // IDs des cultures à exclure
  excludedCropNames: string[]; // Noms normalisés des cultures à exclure (pour cohérence ID/nom)
  winterCultivation: 'yes' | 'little' | 'no';
  seasonExtension: 'early' | 'late' | 'both' | 'none';
  createdAt: string;
  updatedAt: string;
}
