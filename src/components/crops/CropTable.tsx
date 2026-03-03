import { Crop } from '../../types';
import CropActions from './CropActions';
import Capsule, { getCapsuleColor } from '../ui/Capsule';
import { formatWeekRanges } from '../../utils/weekUtils';

interface CropTableProps {
  crops: Crop[];
  onEdit: (crop: Crop) => void;
  onCopy: (crop: Crop) => void;
  onDelete: (crop: Crop) => void;
  onRestoreDefault?: (crop: Crop) => void;
}

export default function CropTable({
  crops,
  onEdit,
  onCopy,
  onDelete,
  onRestoreDefault,
}: CropTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Culture
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Méthode
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Semis → Plantation
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Plantation → Récolte
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Période semis
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Période plantation
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {crops.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                Aucune culture
              </td>
            </tr>
          ) : (
            crops.map((crop) => (
              <tr key={crop.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{crop.emoji || '🌱'}</span>
                    <div className="text-sm font-medium text-gray-900">
                      {crop.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Capsule
                    value={crop.type}
                    color={getCapsuleColor('type')}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {crop.plantingMethod === 'serre' || crop.plantingMethod === 'both' ? (
                      <Capsule
                        value="En serre"
                        color={getCapsuleColor('serre')}
                      />
                    ) : null}
                    {crop.plantingMethod === 'plein_champ' || crop.plantingMethod === 'both' ? (
                      <Capsule
                        value="Plein champ"
                        color={getCapsuleColor('plein_champ')}
                      />
                    ) : null}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {crop.weeksBetweenSowingAndPlanting} sem.
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {crop.weeksBetweenPlantingAndHarvest} sem.
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatWeekRanges(crop.sowingWeeks)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatWeekRanges(crop.plantingWeeks)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <CropActions
                    crop={crop}
                    onEdit={onEdit}
                    onCopy={onCopy}
                    onDelete={onDelete}
                    onRestoreDefault={onRestoreDefault}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
