import { useState, useEffect } from 'react';

/**
 * Hook pour charger les données CSV du plan de culture
 * Les données peuvent être chargées depuis un fichier local ou depuis Firestore
 */
export function useWeekData() {
  const [csvData, setCsvData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCSVData = async () => {
      try {
        // Essayer de charger depuis le fichier CSV dans public
        // En production, ces données devraient être en base de données
        const response = await fetch('/plan-culture.csv');
        if (response.ok) {
          const text = await response.text();
          setCsvData(text);
        } else {
          // Si le fichier n'est pas trouvé, on peut charger depuis Firestore
          // ou utiliser des données par défaut
          console.warn('Fichier CSV non trouvé, utilisation des données par défaut');
          setCsvData(null);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données CSV:', error);
        setCsvData(null);
      } finally {
        setLoading(false);
      }
    };

    loadCSVData();
  }, []);

  return { csvData, loading };
}
