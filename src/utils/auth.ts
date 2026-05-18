import { useHouseholdStore } from '@/features/household/store';
import { useMembersStore } from '@/features/members/store';
import { useTasksStore } from '@/features/tasks/store';

export function clearAllStores() {
  console.log('[clearAllStores] Clearing all Zustand stores and localStorage');

  useHouseholdStore.getState().resetHousehold();
  useMembersStore.getState().resetMembers();
  useTasksStore.getState().resetTasks();

  const storageKeys = ['kifekoi-household', 'kifekoi-members', 'kifekoi-tasks'];
  storageKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log('[clearAllStores] All stores cleared successfully');
}
