import Card from './Card';

export interface BooleanFilter {
  id: string;
  label: string;
  value: boolean;
}

interface BooleanSelectorProps {
  filters: BooleanFilter[];
  onChange: (filters: BooleanFilter[]) => void;
  title?: string;
  variant?: 'list' | 'card';
  className?: string;
}

export default function BooleanSelector({
  filters,
  onChange,
  title,
  variant = 'card',
  className = '',
}: BooleanSelectorProps) {
  const handleToggle = (id: string) => {
    const updatedFilters = filters.map((filter) =>
      filter.id === id ? { ...filter, value: !filter.value } : filter
    );
    onChange(updatedFilters);
  };

  if (variant === 'list') {
    return (
      <div className={`space-y-2 ${className}`}>
        {title && (
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
        )}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleToggle(filter.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter.value
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Variant 'card'
  return (
    <Card className={`p-4 ${className}`}>
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleToggle(filter.id)}
            className={`p-3 rounded-lg text-sm font-medium transition-all text-center ${
              filter.value
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
