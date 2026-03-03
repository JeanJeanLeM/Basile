export type CapsuleColor = {
  bg: string;
  text: string;
  border: string;
};

interface CapsuleProps {
  label?: string;
  value: React.ReactNode;
  color?: string | CapsuleColor;
  className?: string;
}

// Palette de couleurs style Airtable
const COLOR_PALETTE = [
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
  { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
];

// Fonction pour obtenir une couleur basée sur une clé (pour la cohérence)
export function getCapsuleColor(key: string | number): typeof COLOR_PALETTE[0] {
  const index = typeof key === 'string' 
    ? key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : key;
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

export default function Capsule({
  label,
  value,
  color,
  className = '',
}: CapsuleProps) {
  const colorClasses = color || getCapsuleColor(label || String(value));

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      {label && (
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      )}
      <span
        className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium border ${
          typeof colorClasses === 'string'
            ? colorClasses
            : `${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`
        }`}
      >
        {value}
      </span>
    </div>
  );
}
