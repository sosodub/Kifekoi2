import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TaskTemplate, TaskInstance } from '@/models/task';

interface TasksStore {
  taskTemplates: TaskTemplate[];
  taskInstances: TaskInstance[];
  addTemplate: (template: Omit<TaskTemplate, 'id'>) => string;
  createInstanceForToday: (templateId: string) => void;
  markInstanceDone: (instanceId: string, memberId: string) => void;
  markInstanceTodo: (instanceId: string) => void;
  markInstanceFraud: (instanceId: string, fraudMemberId?: string) => void;
  deleteInstance: (instanceId: string) => void;
  duplicateInstance: (instanceId: string) => void;
  getInstancesForDate: (date: string) => TaskInstance[];
  getTemplateById: (templateId: string) => TaskTemplate | undefined;
  resetTasks: () => void;
}

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const useTasksStore = create<TasksStore>()(
  persist(
    (set, get) => ({
      taskTemplates: [],
      taskInstances: [],

      addTemplate: (template) => {
        const newTemplate: TaskTemplate = {
          id: crypto.randomUUID(),
          ...template,
        };
        set((state) => ({
          taskTemplates: [...state.taskTemplates, newTemplate],
        }));
        return newTemplate.id;
      },

      createInstanceForToday: (templateId) => {
        const today = formatDate(new Date());
        const existingInstance = get().taskInstances.find(
          (inst) => inst.templateId === templateId && inst.date === today
        );

        if (!existingInstance) {
          const newInstance: TaskInstance = {
            id: crypto.randomUUID(),
            templateId,
            date: today,
            status: 'todo',
          };
          set((state) => ({
            taskInstances: [...state.taskInstances, newInstance],
          }));
        }
      },

      markInstanceDone: (instanceId, memberId) => {
        set((state) => ({
          taskInstances: state.taskInstances.map((inst) =>
            inst.id === instanceId
              ? {
                  ...inst,
                  status: 'done' as const,
                  memberId,
                  completedAt: new Date().toISOString(),
                }
              : inst
          ),
        }));
      },

      markInstanceTodo: (instanceId) => {
        set((state) => ({
          taskInstances: state.taskInstances.map((inst) =>
            inst.id === instanceId
              ? {
                  ...inst,
                  status: 'todo' as const,
                  memberId: undefined,
                  completedAt: undefined,
                }
              : inst
          ),
        }));
      },

      markInstanceFraud: (instanceId, fraudMemberId) => {
        set((state) => ({
          taskInstances: state.taskInstances.map((inst) =>
            inst.id === instanceId
              ? {
                  ...inst,
                  isFraud: true,
                  fraudMemberId,
                }
              : inst
          ),
        }));
      },

      deleteInstance: (instanceId) => {
        set((state) => ({
          taskInstances: state.taskInstances.filter((inst) => inst.id !== instanceId),
        }));
      },

      duplicateInstance: (instanceId) => {
        const instance = get().taskInstances.find((inst) => inst.id === instanceId);
        if (!instance) return;

        const today = formatDate(new Date());
        const newInstance: TaskInstance = {
          id: crypto.randomUUID(),
          templateId: instance.templateId,
          date: today,
          status: 'todo',
        };
        set((state) => ({
          taskInstances: [...state.taskInstances, newInstance],
        }));
      },

      getInstancesForDate: (date) => {
        return get().taskInstances.filter((inst) => inst.date === date);
      },

      getTemplateById: (templateId) => {
        return get().taskTemplates.find((tpl) => tpl.id === templateId);
      },

      resetTasks: () => {
        set({ taskTemplates: [], taskInstances: [] });
      }
    }),
    {
      name: 'kifekoi-tasks',
    }
  )
);
