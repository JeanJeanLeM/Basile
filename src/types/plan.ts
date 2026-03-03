export interface Plan {
  id: string;
  cropId: string;
  cropName: string; // Denormalisé pour performance
  quantity: number;
  plantingWeek: number; // Semaine de plantation (1-52)
  sowingWeek: number; // Semaine de semis (calculée, 1-52)
  notes?: string;
  sowingDone: boolean;
  plantingDone: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  
  // Durées personnalisées (optionnel - si absent, utilise les valeurs de la culture)
  customNurseryWeeks?: number; // Semaines entre semis et plantation
  customCultureWeeks?: number; // Semaines entre plantation et récolte
  customHarvestWeeks?: number; // Durée de la récolte
}
