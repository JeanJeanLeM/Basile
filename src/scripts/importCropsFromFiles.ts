/**
 * Script d'import direct des cultures depuis les fichiers CSV
 * 
 * Usage:
 * 1. Placez les fichiers CSV dans le dossier public/
 * 2. Exécutez ce script depuis la console du navigateur ou créez une page dédiée
 */

import { importCropsToFirestore } from '../utils/importCrops';

/**
 * Importe les cultures depuis les fichiers CSV locaux
 * À appeler depuis la console du navigateur après avoir chargé les fichiers
 * @param userId - ID utilisateur ou 'guest'
 * @param token - JWT optionnel pour utilisateur connecté
 */
export async function importFromLocalFiles(userId: string, token?: string) {
  try {
    // Charger le fichier des légumes
    const legumesResponse = await fetch('/Plan de culture - Légumes.csv');
    const legumesContent = await legumesResponse.text();
    
    // Charger le fichier du plan (optionnel)
    let planContent: string | undefined;
    try {
      const planResponse = await fetch('/Plan de culture - Plan de culture (3).csv');
      planContent = await planResponse.text();
    } catch (error) {
      console.warn('Fichier plan non trouvé, import sans plan');
    }
    
    // Importer
    const result = await importCropsToFirestore(legumesContent, userId, planContent, token);
    
    console.log(`Import terminé: ${result.success} cultures importées, ${result.errors} erreurs`);
    return result;
  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    throw error;
  }
}
