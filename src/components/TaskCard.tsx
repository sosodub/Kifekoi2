interface TaskCardProps {
  emoji: string;
  name: string;
  assignee?: string;
  points: number;
  status?: 'pending' | 'done';
  isFraud?: boolean;
  completedBy?: string;
  completedAt?: string;
  onValidate?: () => void;
}

export default function TaskCard({ emoji, name, assignee, points, status = 'pending', isFraud, completedBy, completedAt, onValidate }: TaskCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between mb-2">
      <div className="flex items-center gap-4 flex-1">
        <span className="text-3xl">{emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{name}</p>
            {isFraud && <span className="text-xl">😡</span>}
          </div>
          {status === 'done' && completedBy && (
            <p className="text-sm text-gray-500">
              Fait par {completedBy}
              {completedAt && ` • ${formatDate(completedAt)}`}
            </p>
          )}
          {status === 'pending' && assignee && (
            <p className="text-sm text-gray-500">Attribué à {assignee}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-k-green-dark font-semibold text-sm">{points} pts</span>
        {status === 'done' ? (
          <span className="text-k-green-dark text-xl">✓</span>
        ) : onValidate ? (
          <button
            onClick={onValidate}
            className="w-8 h-8 bg-k-green-dark text-white rounded-lg font-bold hover:bg-k-green-dark/90 transition-colors"
          >
            K
          </button>
        ) : null}
      </div>
    </div>
  );
}
