export type HistoryTabType = 'date' | 'task';

interface HistoryTabsProps {
  activeTab: HistoryTabType;
  onTabChange: (tab: HistoryTabType) => void;
}

export default function HistoryTabs({ activeTab, onTabChange }: HistoryTabsProps) {
  const tabs: { id: HistoryTabType; label: string }[] = [
    { id: 'date', label: 'Par date' },
    { id: 'task', label: 'Par tâche' },
  ];

  return (
    <div className="bg-white rounded-xl p-1 shadow-sm mb-4 flex gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === tab.id
              ? 'bg-k-green-dark text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
