import { useState } from 'react';
import { Crop } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useCrops } from '../hooks/useCrops';
import { useToast } from '../hooks/useToast';
import CropGallery from '../components/crops/CropGallery';
import CropForm from '../components/crops/CropForm';
import Button from '../components/ui/Button';
import { ToastContainer } from '../components/ui/Toast';
import { UI_MESSAGES } from '../utils/constants';

export default function CropsPage() {
  const { user } = useAuth();
  const { crops, loading, createCrop, updateCrop, deleteCrop, copyCrop } =
    useCrops();
  const { toasts, showToast, removeToast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | undefined>();

  const handleAdd = () => {
    setEditingCrop(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (crop: Crop) => {
    setEditingCrop(crop);
    setIsFormOpen(true);
  };

  const handleSubmit = async (
    cropData: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      if (editingCrop) {
        if (editingCrop.userId === 'system') {
          await createCrop(cropData);
          showToast('Une copie a été créée. Vos modifications ne concernent que votre version.', 'success');
        } else {
          await updateCrop(editingCrop.id, cropData);
          showToast('Culture modifiée avec succès', 'success');
        }
      } else {
        await createCrop(cropData);
        showToast('Culture ajoutée avec succès', 'success');
      }
      setIsFormOpen(false);
      setEditingCrop(undefined);
    } catch (error) {
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleCopy = async (crop: Crop) => {
    try {
      await copyCrop(crop);
      showToast('Culture copiée avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la copie', 'error');
    }
  };

  const handleDelete = async (crop: Crop) => {
    try {
      await deleteCrop(crop.id);
      showToast('Culture supprimée avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleRestoreDefault = async (crop: Crop) => {
    if (!confirm('Supprimer votre version de cette culture ? Si une valeur par défaut existe, elle sera affichée.')) return;
    try {
      await deleteCrop(crop.id);
      showToast('Culture réinitialisée : la valeur par défaut est affichée.', 'success');
    } catch (error) {
      showToast('Erreur lors de la réinitialisation', 'error');
    }
  };

  return (
    <div className="p-4 pl-[3.75rem] md:pl-6 md:p-6 min-w-0">
      <header className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold truncate">{UI_MESSAGES.CROPS_TITLE}</h1>
            <p className="text-gray-600 text-sm sm:text-base mt-0.5">{UI_MESSAGES.CROPS_DESCRIPTION}</p>
          </div>
          <Button onClick={handleAdd} className="shrink-0">{UI_MESSAGES.CROPS_ADD_BUTTON}</Button>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : (
        <CropGallery
          crops={crops}
          onEdit={handleEdit}
          onCopy={handleCopy}
          onDelete={handleDelete}
          onRestoreDefault={handleRestoreDefault}
        />
      )}

      <CropForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCrop(undefined);
        }}
        onSubmit={handleSubmit}
        userId={user?.uid ?? ''}
        initialData={editingCrop}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
