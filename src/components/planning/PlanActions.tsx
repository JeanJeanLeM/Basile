import { MoreVertical, Edit, Copy, Trash2 } from 'lucide-react';
import { Plan } from '../../types';
import { useState } from 'react';

interface PlanActionsProps {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onCopy: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
}

export default function PlanActions({
  plan,
  onEdit,
  onCopy,
  onDelete,
}: PlanActionsProps) {
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
                onEdit(plan);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            <button
              onClick={() => {
                onCopy(plan);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copier
            </button>
            <button
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) {
                  onDelete(plan);
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
