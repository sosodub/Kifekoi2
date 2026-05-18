import { useState } from 'react';
import KButton from './KButton';
import { useTasks } from '@/hooks/useTasks';
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers';
import { useCurrentHousehold } from '@/hooks/useCurrentHousehold';

interface AddTaskModalProps {
  onClose: () => void;
  householdId?: string;
}

const EMOJI_OPTIONS = ['🧹', '🧺', '🗑️', '🍽️', '🧼', '👕', '🐕', '🚗', '🌱', '📚', '🛒', '🧽'];
const POINTS_OPTIONS = [2, 4, 5];

export default function AddTaskModal({ onClose, householdId }: AddTaskModalProps) {
  const { household } = useCurrentHousehold();
  const effectiveHouseholdId = householdId || household?.id;
  const { createTask } = useTasks(effectiveHouseholdId);
  const { members } = useHouseholdMembers(effectiveHouseholdId);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [points, setPoints] = useState(4);
  const [assignedMemberId, setAssignedMemberId] = useState<string>('');
  const [frequencyCount, setFrequencyCount] = useState<number>(1);
  const [frequencyUnit, setFrequencyUnit] = useState<'day' | 'week' | 'month' | 'year' | 'unique'>('unique');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await createTask({
        title: name.trim(),
        emoji,
        points,
        assignedMemberId: assignedMemberId || undefined,
        frequencyCount: frequencyUnit === 'unique' ? undefined : frequencyCount,
        frequencyUnit: frequencyUnit === 'unique' ? undefined : frequencyUnit,
      });
      onClose();
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la création de la tâche');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Ajouter une tâche</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom de la tâche</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Passer l'aspirateur"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-k-green-dark"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Emoji</label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map((emojiOption) => (
                <button
                  key={emojiOption}
                  type="button"
                  onClick={() => setEmoji(emojiOption)}
                  className={`text-2xl p-2 rounded-lg border-2 transition-colors ${
                    emoji === emojiOption
                      ? 'border-k-green-dark bg-k-green/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {emojiOption}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Attribuer à</label>
            <select
              value={assignedMemberId}
              onChange={(e) => setAssignedMemberId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-k-green-dark"
            >
              <option value="">Personne (optionnel)</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.emoji || '👤'} {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Points</label>
            <div className="flex gap-2">
              {POINTS_OPTIONS.map((pointOption) => (
                <button
                  key={pointOption}
                  type="button"
                  onClick={() => setPoints(pointOption)}
                  className={`flex-1 py-2 rounded-lg border-2 font-semibold transition-colors ${
                    points === pointOption
                      ? 'border-k-green-dark bg-k-green-dark text-white'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {pointOption}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fréquence</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                value={frequencyCount}
                onChange={(e) => setFrequencyCount(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={frequencyUnit === 'unique'}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-k-green-dark disabled:bg-gray-100 disabled:text-gray-400"
              />
              <span className="text-sm text-gray-600">fois par</span>
              <select
                value={frequencyUnit}
                onChange={(e) => setFrequencyUnit(e.target.value as any)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-k-green-dark"
              >
                <option value="unique">Unique</option>
                <option value="day">Jour</option>
                <option value="week">Semaine</option>
                <option value="month">Mois</option>
                <option value="year">An</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl font-semibold border-2 border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <KButton className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Création...' : 'Créer'}
            </KButton>
          </div>
        </form>
      </div>
    </div>
  );
}
