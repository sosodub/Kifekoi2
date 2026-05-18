import { PeriodType } from '@/features/podium/lib/podiumUtils';

interface PeriodSelectorProps {
  activePeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
}

export default function PeriodSelector({ activePeriod, onPeriodChange }: PeriodSelectorProps) {
  const periods: { id: PeriodType; label: string }[] = [
    { id: 'week', label: 'Semaine' },
    { id: 'month', label: 'Mois' },
    { id: 'year', label: 'Année' },
    { id: 'all', label: 'Total' },
  ];

  return (
    <div className="bg-white rounded-xl p-1 shadow-sm mb-4 flex gap-1">
      {periods.map((period) => (
        <button
          key={period.id}
          onClick={() => onPeriodChange(period.id)}
          className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${
            activePeriod === period.id
              ? 'bg-k-green-dark text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
