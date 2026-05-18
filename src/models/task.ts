export interface TaskTemplate {
  id: string;
  name: string;
  emoji: string;
  frequency: {
    times: number;
    period: 'jour' | 'semaine' | 'mois' | 'an' | 'unique';
  };
  points: number;
}

export interface TaskInstance {
  id: string;
  templateId: string;
  date: string;
  memberId?: string;
  status: 'todo' | 'done';
  completedAt?: string;
  isFraud?: boolean;
  fraudMemberId?: string;
}
