import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import TaskCard from '@/components/TaskCard';
import SectionTitle from '@/components/SectionTitle';
import MemberSelector from '@/components/MemberSelector';
import AddTaskModal from '@/components/AddTaskModal';
import { TabType } from '@/components/TabBar';
import { useCurrentHousehold } from '@/hooks/useCurrentHousehold';
import { useTasks } from '@/hooks/useTasks';
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers';

export default function Dashboard() {
  const navigate = useNavigate();
  const { household } = useCurrentHousehold();
  const { tasks, isLoading: tasksLoading, completeTask } = useTasks(household?.id);
  const { members } = useHouseholdMembers(household?.id);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [validatingTaskId, setValidatingTaskId] = useState<string | null>(null);

  const handleTabChange = (tab: TabType) => {
    if (tab === 'history') {
      navigate('/history');
    } else if (tab === 'podium') {
      navigate('/podium');
    }
  };

  const pendingTasks = tasks.filter((task) => task.status === 'pending');

  const handleValidateClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleMemberSelect = async (memberId: string) => {
    if (!selectedTaskId) return;

    const task = tasks.find((t) => t.id === selectedTaskId);
    if (!task) return;

    setValidatingTaskId(selectedTaskId);
    try {
      await completeTask(selectedTaskId, memberId, task.points || 4);
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la validation');
    } finally {
      setValidatingTaskId(null);
      setSelectedTaskId(null);
    }
  };

  const getMemberName = (memberId?: string | null) => {
    if (!memberId) return undefined;
    const member = members.find((m) => m.id === memberId);
    return member ? member.name : undefined;
  };

  return (
    <MainLayout activeTab="dashboard" onTabChange={handleTabChange} onAddTask={() => setShowAddTaskModal(true)}>
      <SectionTitle>Tâches en cours</SectionTitle>

      {tasksLoading ? (
        <div className="bg-white rounded-xl p-4 shadow-sm text-center text-gray-500">
          Chargement...
        </div>
      ) : pendingTasks.length === 0 ? (
        <div className="bg-white rounded-xl p-4 shadow-sm text-center text-gray-500">
          Aucune tâche pour aujourd'hui. Utilisez le bouton + pour en ajouter !
        </div>
      ) : (
        pendingTasks.map((task) => {
          const assignedMember = task.assigned_member_id ? getMemberName(task.assigned_member_id) : undefined;

          return (
            <TaskCard
              key={task.id}
              emoji={task.emoji || '📋'}
              name={task.title}
              assignee={assignedMember}
              points={task.points || 4}
              status="pending"
              onValidate={() => handleValidateClick(task.id)}
            />
          );
        })
      )}

      <SectionTitle>Les 7 derniers jours</SectionTitle>
      <div className="bg-white rounded-xl p-4 shadow-sm min-h-[100px]">
      </div>

      {selectedTaskId && !validatingTaskId && (
        <MemberSelector
          onSelect={handleMemberSelect}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {showAddTaskModal && (
        <AddTaskModal onClose={() => setShowAddTaskModal(false)} householdId={household?.id} />
      )}
    </MainLayout>
  );
}
