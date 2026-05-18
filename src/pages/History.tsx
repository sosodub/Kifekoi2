import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import SectionTitle from '@/components/SectionTitle';
import HistoryTabs, { HistoryTabType } from '@/components/HistoryTabs';
import { TabType } from '@/components/TabBar';
import { useCurrentHousehold } from '@/hooks/useCurrentHousehold';
import { useTasks } from '@/hooks/useTasks';
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers';
import { supabase } from '@/services/supabase';

export default function History() {
  const navigate = useNavigate();
  const { household } = useCurrentHousehold();
  const { tasks, completions, isLoading, createTask, updateTask, deleteTask } = useTasks(household?.id);
  const { members } = useHouseholdMembers(household?.id);
  const [historyView, setHistoryView] = useState<HistoryTabType>('date');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const handleTabChange = (tab: TabType) => {
    if (tab === 'dashboard') {
      navigate('/dashboard');
    } else if (tab === 'podium') {
      navigate('/podium');
    }
  };

  const getMemberName = (memberId?: string) => {
    if (!memberId) return 'Inconnu';
    return members.find((m) => m.id === memberId)?.name || 'Inconnu';
  };

  const handleDuplicate = async (completion: typeof completions[0]) => {
    const task = tasks.find((t) => t.id === completion.task_id);
    if (!task) return;

    try {
      await createTask({
        title: task.title,
        description: task.description || undefined,
        emoji: task.emoji,
        points: task.points,
        assignedMemberId: task.assigned_member_id || undefined,
      });
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error duplicating task:', error);
      alert('Erreur lors de la duplication de la tâche');
    }
  };

  const handleCancel = async (completion: typeof completions[0]) => {
    try {
      const { error: deleteError } = await supabase
        .from('task_completions')
        .delete()
        .eq('id', completion.id);

      if (deleteError) throw deleteError;

      await updateTask(completion.task_id, { status: 'pending' });
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error canceling task:', error);
      alert('Erreur lors de l\'annulation de la tâche');
    }
  };

  const handleFraud = async (completion: typeof completions[0]) => {
    try {
      const { error: deleteError } = await supabase
        .from('task_completions')
        .delete()
        .eq('id', completion.id);

      if (deleteError) throw deleteError;

      await updateTask(completion.task_id, { status: 'pending' });
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error reporting fraud:', error);
      alert('Erreur lors du signalement de fraude');
    }
  };

  const handleDelete = async (completion: typeof completions[0]) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette tâche ?')) {
      return;
    }

    try {
      await deleteTask(completion.task_id);
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Erreur lors de la suppression de la tâche');
    }
  };

  const completedTasks = tasks.filter((task) => task.status === 'done');

  const groupByDate = () => {
    const grouped = completions.reduce((acc, completion) => {
      const date = completion.done_at.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(completion);
      return acc;
    }, {} as Record<string, typeof completions>);

    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({ date, completions: items }));
  };

  const groupByTask = () => {
    const grouped = completions.reduce((acc, completion) => {
      const task = tasks.find((t) => t.id === completion.task_id);
      if (!task) return acc;
      if (!acc[task.id]) acc[task.id] = { task, completions: [] };
      acc[task.id].completions.push(completion);
      return acc;
    }, {} as Record<string, { task: typeof tasks[0]; completions: typeof completions }>);

    return Object.values(grouped);
  };

  const byDate = groupByDate();
  const byTask = groupByTask();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Aujourd\'hui';
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';

    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const hasHistory = completions.length > 0;

  return (
    <MainLayout activeTab="history" onTabChange={handleTabChange}>
      <SectionTitle>Historique</SectionTitle>

      {isLoading ? (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <p className="text-gray-500">Chargement...</p>
        </div>
      ) : !hasHistory ? (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <p className="text-gray-500 mb-2">Aucune tâche complétée pour le moment</p>
          <p className="text-sm text-gray-400">Commencez à valider des tâches pour voir votre historique !</p>
        </div>
      ) : (
        <>
          <HistoryTabs activeTab={historyView} onTabChange={setHistoryView} />

          {historyView === 'date' ? (
            <div className="space-y-6">
              {byDate.map(({ date, completions: dateCompletions }) => (
                <div key={date}>
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">{formatDate(date)}</h3>
                  <div className="space-y-2">
                    {dateCompletions.map((completion) => {
                      const task = tasks.find((t) => t.id === completion.task_id);
                      if (!task) return null;

                      return (
                        <div
                          key={completion.id}
                          className="bg-k-green/10 border border-k-green/20 rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <span className="text-3xl">{task.emoji || '📋'}</span>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{task.title}</p>
                                <p className="text-sm text-gray-600">Fait par {getMemberName(completion.member_id)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-k-green-dark font-semibold text-sm">{task.points || 4} pts</span>
                              <span className="text-k-green-dark text-xl">✓</span>
                              <div className="relative" ref={openMenuId === completion.id ? menuRef : null}>
                                <button
                                  onClick={() => setOpenMenuId(openMenuId === completion.id ? null : completion.id)}
                                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                                  aria-label="Menu"
                                >
                                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="5" r="2" />
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="12" cy="19" r="2" />
                                  </svg>
                                </button>
                                {openMenuId === completion.id && (
                                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                    <button
                                      onClick={() => handleDuplicate(completion)}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                                    >
                                      Dupliquer
                                    </button>
                                    <button
                                      onClick={() => handleCancel(completion)}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                                    >
                                      Annuler
                                    </button>
                                    <button
                                      onClick={() => handleFraud(completion)}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors text-red-600"
                                    >
                                      Fraude
                                    </button>
                                    <button
                                      onClick={() => handleDelete(completion)}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors text-red-600 font-semibold"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {byTask.map(({ task, completions: taskCompletions }) => (
                <div key={task.id}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{task.emoji || '📋'}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                  </div>
                  <div className="space-y-2">
                    {taskCompletions.map((completion) => (
                      <div
                        key={completion.id}
                        className="bg-k-green/10 border border-k-green/20 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{formatDate(completion.done_at.split('T')[0])}</p>
                            <p className="text-sm text-gray-600">Par {getMemberName(completion.member_id)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-k-green-dark font-semibold text-sm">{task.points || 4} pts</span>
                            <span className="text-k-green-dark text-xl">✓</span>
                            <div className="relative" ref={openMenuId === completion.id ? menuRef : null}>
                              <button
                                onClick={() => setOpenMenuId(openMenuId === completion.id ? null : completion.id)}
                                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                                aria-label="Menu"
                              >
                                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="5" r="2" />
                                  <circle cx="12" cy="12" r="2" />
                                  <circle cx="12" cy="19" r="2" />
                                </svg>
                              </button>
                              {openMenuId === completion.id && (
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                  <button
                                    onClick={() => handleDuplicate(completion)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                                  >
                                    Dupliquer
                                  </button>
                                  <button
                                    onClick={() => handleCancel(completion)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                                  >
                                    Annuler
                                  </button>
                                  <button
                                    onClick={() => handleFraud(completion)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors text-red-600"
                                  >
                                    Fraude
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
}
