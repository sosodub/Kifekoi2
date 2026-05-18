import { supabase } from '@/services/supabase';

export interface CreateTaskData {
  householdId: string;
  title: string;
  description?: string;
  emoji?: string;
  points?: number;
  assignedMemberId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'pending' | 'done';
  assignedMemberId?: string;
}

export async function createTask(data: CreateTaskData) {
  const user = await supabase.auth.getUser();

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      household_id: data.householdId,
      title: data.title,
      description: data.description || null,
      emoji: data.emoji || null,
      points: data.points || 4,
      assigned_member_id: data.assignedMemberId || null,
      created_by_user_id: user.data.user?.id || null,
    })
    .select()
    .single();

  if (error) throw error;
  return task;
}

export async function getHouseholdTasks(householdId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, household_members(*)')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateTask(taskId: string, data: UpdateTaskData) {
  const { data: task, error } = await supabase
    .from('tasks')
    .update(data)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return task;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

export async function completeTask(taskId: string, memberId: string, pointsAwarded: number = 1) {
  console.log('[completeTask] Starting completion for task:', taskId, 'member:', memberId);
  const user = await supabase.auth.getUser();

  const { data: completion, error: completionError } = await supabase
    .from('task_completions')
    .insert({
      task_id: taskId,
      member_id: memberId,
      done_by_user_id: user.data.user?.id || null,
      points_awarded: pointsAwarded,
    })
    .select()
    .single();

  if (completionError) {
    console.error('[completeTask] Error creating completion:', completionError);
    throw completionError;
  }

  console.log('[completeTask] Completion created, updating task status');
  const { error: taskError } = await supabase
    .from('tasks')
    .update({ status: 'done' })
    .eq('id', taskId);

  if (taskError) {
    console.error('[completeTask] Error updating task:', taskError);
    throw taskError;
  }

  console.log('[completeTask] Updating member points');
  const { data: member, error: memberError } = await supabase
    .from('household_members')
    .select('points')
    .eq('id', memberId)
    .single();

  if (memberError) {
    console.error('[completeTask] Error fetching member:', memberError);
    throw memberError;
  }

  const newPoints = (member?.points || 0) + pointsAwarded;
  const { error: pointsError } = await supabase
    .from('household_members')
    .update({ points: newPoints })
    .eq('id', memberId);

  if (pointsError) {
    console.error('[completeTask] Error updating points:', pointsError);
    throw pointsError;
  }

  console.log('[completeTask] Task completed successfully, new points:', newPoints);
  return completion;
}

export async function getTaskCompletions(householdId: string) {
  const { data, error } = await supabase
    .from('task_completions')
    .select('*, tasks(*), household_members(*)')
    .eq('tasks.household_id', householdId)
    .order('done_at', { ascending: false });

  if (error) throw error;
  return data;
}
