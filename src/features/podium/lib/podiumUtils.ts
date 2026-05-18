import { TaskInstance, TaskTemplate } from '@/models/task';
import { Member } from '@/models/member';

export type PeriodType = 'week' | 'month' | 'year' | 'all';

export interface MemberScore {
  memberId: string;
  memberName: string;
  avatarEmoji?: string;
  points: number;
}

const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStartOfMonth = (date: Date): Date => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStartOfYear = (date: Date): Date => {
  const d = new Date(date);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const filterInstancesByPeriod = (
  instances: TaskInstance[],
  period: PeriodType
): TaskInstance[] => {
  if (period === 'all') {
    return instances.filter((inst) => inst.status === 'done');
  }

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = getStartOfWeek(now);
      break;
    case 'month':
      startDate = getStartOfMonth(now);
      break;
    case 'year':
      startDate = getStartOfYear(now);
      break;
    default:
      return instances.filter((inst) => inst.status === 'done');
  }

  return instances.filter((inst) => {
    if (inst.status !== 'done') return false;
    const instDate = new Date(inst.date);
    return instDate >= startDate && instDate <= now;
  });
};

export const computeScores = (
  members: Member[],
  instances: TaskInstance[],
  templates: TaskTemplate[]
): MemberScore[] => {
  const completedInstances = instances.filter((inst) => inst.status === 'done');

  const scoreMap = new Map<string, number>();

  completedInstances.forEach((instance) => {
    if (!instance.memberId) return;

    const template = templates.find((t) => t.id === instance.templateId);
    if (!template) return;

    const currentScore = scoreMap.get(instance.memberId) || 0;
    scoreMap.set(instance.memberId, currentScore + template.points);
  });

  const scores: MemberScore[] = members.map((member) => ({
    memberId: member.id,
    memberName: member.name,
    avatarEmoji: member.avatarEmoji,
    points: scoreMap.get(member.id) || 0,
  }));

  scores.sort((a, b) => b.points - a.points);

  return scores;
};

export const getPeriodLabel = (period: PeriodType): string => {
  switch (period) {
    case 'week':
      return 'Cette semaine';
    case 'month':
      return 'Ce mois-ci';
    case 'year':
      return 'Cette année';
    case 'all':
      return 'Depuis le début';
    default:
      return '';
  }
};

export const getPeriodDateRange = (period: PeriodType): string => {
  if (period === 'all') {
    return 'Tous les temps';
  }

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = getStartOfWeek(now);
      break;
    case 'month':
      startDate = getStartOfMonth(now);
      break;
    case 'year':
      startDate = getStartOfYear(now);
      break;
    default:
      return '';
  }

  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const start = startDate.toLocaleDateString('fr-FR', options);
  const end = now.toLocaleDateString('fr-FR', options);

  return `Du ${start} au ${end}`;
};
