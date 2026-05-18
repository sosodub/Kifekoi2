import { TaskInstance, TaskTemplate } from '@/models/task';

export interface InstancesByDate {
  date: string;
  instances: TaskInstance[];
}

export interface InstancesByTask {
  template: TaskTemplate;
  instances: TaskInstance[];
}

export const groupInstancesByDate = (instances: TaskInstance[]): InstancesByDate[] => {
  const completedInstances = instances.filter((inst) => inst.status === 'done');

  const grouped = completedInstances.reduce((acc, instance) => {
    const date = instance.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(instance);
    return acc;
  }, {} as Record<string, TaskInstance[]>);

  const result = Object.entries(grouped)
    .map(([date, instances]) => ({ date, instances }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return result;
};

export const groupInstancesByTask = (
  instances: TaskInstance[],
  templates: TaskTemplate[]
): InstancesByTask[] => {
  const completedInstances = instances.filter((inst) => inst.status === 'done');

  const grouped = completedInstances.reduce((acc, instance) => {
    const templateId = instance.templateId;
    if (!acc[templateId]) {
      acc[templateId] = [];
    }
    acc[templateId].push(instance);
    return acc;
  }, {} as Record<string, TaskInstance[]>);

  const result = Object.entries(grouped)
    .map(([templateId, instances]) => {
      const template = templates.find((t) => t.id === templateId);
      return template ? { template, instances } : null;
    })
    .filter((item): item is InstancesByTask => item !== null)
    .sort((a, b) => a.template.name.localeCompare(b.template.name));

  return result;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };
  return date.toLocaleDateString('fr-FR', options);
};
