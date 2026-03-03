import { useState, useMemo } from 'react';
import { Crop } from '../../types';
import CropCard from './CropCard';
import CropTable from './CropTable';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Pagination from '../ui/Pagination';
import { Grid, List } from 'lucide-react';

interface CropGalleryProps {
  crops: Crop[];
  onEdit: (crop: Crop) => void;
  onCopy: (crop: Crop) => void;
  onDelete: (crop: Crop) => void;
  onRestoreDefault?: (crop: Crop) => void;
}

export default function CropGallery({
  crops,
  onEdit,
  onCopy,
  onDelete,
  onRestoreDefault,
}: CropGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'type'>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [isTableView, setIsTableView] = useState(false);
  const itemsPerPage = 12;

  const filteredAndSorted = useMemo(() => {
    // Filtrer par recherche textuelle
    let filtered = crops.filter(
      (crop) =>
        crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crop.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Trier
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return a.type.localeCompare(b.type);
      }
    });

    return filtered;
  }, [crops, searchTerm, sortBy]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginatedCrops = filteredAndSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Rechercher une culture..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'type')}
            options={[
              { value: 'name', label: 'Trier par nom' },
              { value: 'type', label: 'Trier par type' },
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTableView(false)}
            className={`p-2 rounded-lg transition-all ${
              !isTableView
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Vue cartes"
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsTableView(true)}
            className={`p-2 rounded-lg transition-all ${
              isTableView
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Vue liste"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Aucune culture trouvée</p>
        </div>
      ) : (
        <>
          {isTableView ? (
            <CropTable
              crops={paginatedCrops}
              onEdit={onEdit}
              onCopy={onCopy}
              onDelete={onDelete}
              onRestoreDefault={onRestoreDefault}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedCrops.map((crop) => (
                <CropCard
                  key={crop.id}
                  crop={crop}
                  onEdit={onEdit}
                  onCopy={onCopy}
                  onDelete={onDelete}
                  onRestoreDefault={onRestoreDefault}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}
