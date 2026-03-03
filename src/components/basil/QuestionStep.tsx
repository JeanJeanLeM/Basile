import { ReactNode } from 'react';

interface QuestionStepProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function QuestionStep({
  title,
  description,
  children,
}: QuestionStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        {description && <p className="text-gray-600">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}
