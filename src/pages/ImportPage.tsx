import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { updateSystemCropsFromCSV, parseNewCulturesCSV } from '../utils/importCrops';
import Button from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ui/Toast';

export default function ImportPage() {
  const { user, getToken } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [csvContent, setCsvContent] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = async () => {
    if (!user) {
      showToast('Vous devez être connecté pour mettre à jour les données de base', 'error');
      return;
    }

    if (!csvContent) {
      showToast('Veuillez d\'abord charger le fichier CSV des légumes', 'error');
      return;
    }

    // Demander confirmation car on va remplacer les données de base
    const confirmed = window.confirm(
      'ATTENTION : Cette opération va remplacer les données de base de l\'application (cultures système) par les nouvelles données.\n\nLes cultures que vous avez créées personnellement ne seront PAS affectées.\n\nÊtes-vous sûr de vouloir continuer ?'
    );
    
    if (!confirmed) return;

    setLoading(true);
    try {
      const token = await getToken();
      const result = await updateSystemCropsFromCSV(csvContent, token);
      showToast(
        `Mise à jour réussie : ${result.deleted} culture(s) système supprimée(s), ${result.imported} culture(s) importée(s)${result.errors > 0 ? `, ${result.errors} erreur(s)` : ''}.`,
        result.errors > 0 ? 'warning' : 'success'
      );
      setCsvContent('');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      showToast('Erreur lors de la mise à jour des données de base', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (!csvContent) {
      showToast('Veuillez d\'abord charger un fichier CSV', 'error');
      return;
    }

    const crops = parseNewCulturesCSV(csvContent);
    console.log('Aperçu des cultures:', crops);
    showToast(`${crops.length} cultures détectées. Voir la console pour les détails.`, 'info');
  };

  return (
    <div className="p-4 pl-[3.75rem] md:pl-6 md:p-6 min-w-0">
      <header className="mb-6">
        <h1 className="text-xl sm:text-3xl font-bold mb-2 truncate">Mise à jour des données de base</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Remplace les cultures de base de l'application par les nouvelles données depuis le CSV (Basile - cultures.csv)
        </p>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note :</strong> Cette opération remplace uniquement les <strong>cultures système</strong> (données de base). 
            Vos cultures personnelles ne seront <strong>pas affectées</strong>.
          </p>
        </div>
      </header>

      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            Vous devez être connecté pour importer des données.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fichier CSV des légumes (obligatoire)
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-primary-50 file:text-primary-700
              hover:file:bg-primary-100"
            disabled={loading || !user}
          />
          {csvContent && (
            <p className="text-sm text-green-600 mt-2">✓ Fichier chargé</p>
          )}
        </div>

        {csvContent && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              {parseNewCulturesCSV(csvContent).length} cultures détectées.
            </p>
            <div className="flex gap-2">
              <Button onClick={handlePreview} variant="secondary" disabled={loading}>
                Aperçu
              </Button>
              <Button onClick={handleImport} disabled={loading}>
                {loading ? 'Mise à jour en cours...' : 'Mettre à jour les données de base'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
