export type TabType = 'dashboard' | 'history' | 'podium';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'dashboard', label: 'Tableau de bord' },
    { id: 'history', label: 'Historique' },
    { id: 'podium', label: 'Podium' },
  ];

  return (
    <div className="bg-white flex px-2 py-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === tab.id
              ? 'text-k-green-dark border-k-green-dark font-bold'
              : 'text-gray-500 border-transparent'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
