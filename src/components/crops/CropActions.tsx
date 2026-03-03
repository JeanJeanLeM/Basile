import { MoreVertical, Edit, Copy, Trash2, RotateCcw } from 'lucide-react';
import { Crop } from '../../types';
import { useState } from 'react';

interface CropActionsProps {
  crop: Crop;
  onEdit: (crop: Crop) => void;
  onCopy: (crop: Crop) => void;
  onDelete: (crop: Crop) => void;
  onRestoreDefault?: (crop: Crop) => void;
}

export default function CropActions({
  crop,
  onEdit,
  onCopy,
  onDelete,
  onRestoreDefault,
}: CropActionsProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 rounded hover:bg-gray-100"
      >
        <MoreVertical className="w-5 h-5 text-gray-500" />
      </button>
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <button
              onClick={() => {
                onEdit(crop);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            <button
              onClick={() => {
                onCopy(crop);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copier
            </button>
            {crop.userId !== 'system' && onRestoreDefault && (
              <button
                onClick={() => {
                  onRestoreDefault(crop);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-amber-700"
              >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser par défaut
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir supprimer cette culture ?')) {
                  onDelete(crop);
                }
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );
}
