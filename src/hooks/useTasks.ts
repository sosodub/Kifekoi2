import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Task {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'done';
  assigned_member_id: string | null;
  created_at: string;
  emoji?: string;
  points?: number;
  frequency_count?: number | null;
  frequency_unit?: 'day' | 'week' | 'month' | 'year' | 'unique' | null;
  last_recreated_at?: string | null;
  household_members?: {
    id: string;
    name: string;
    emoji: string | null;
  } | null;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  member_id: string;
  done_by_user_id: string | null;
  done_at: string;
  household_members?: {
    id: string;
    name: string;
    emoji: string | null;
  };
}

interface UseTasksResult {
  tasks: Task[];
  completions: TaskCompletion[];
  isLoading: boolean;
  error: string | null;
  createTask: (data: {
    title: string;
    description?: string;
    assignedMemberId?: string;
    emoji?: string;
    points?: number;
    frequencyCount?: number;
    frequencyUnit?: 'day' | 'week' | 'month' | 'year';
  }) => Promise<Task>;
  updateTask: (taskId: string, data: {
    title?: string;
    description?: string;
    status?: 'pending' | 'done';
    assignedMemberId?: string;
  }) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, memberId: string, points: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTasks(householdId: string | null | undefined): UseTasksResult {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!householdId || !user) {
      setTasks([]);
      setCompletions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*, household_members(*)')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      setTasks(tasksData || []);

      const { data: completionsData, error: completionsError } = await supabase
        .from('task_completions')
        .select('*, household_members(*), tasks!inner(*)')
        .eq('tasks.household_id', householdId)
        .order('done_at', { ascending: false });

      if (completionsError) {
        console.error('Error fetching completions:', completionsError);
        throw completionsError;
      }

      console.log('[useTasks] Fetched completions:', completionsData?.length || 0);
      setCompletions(completionsData || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [householdId, user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!householdId) return;

    const tasksChannel = supabase
      .channel(`tasks:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    const completionsChannel = supabase
      .channel(`task_completions:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_completions',
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(completionsChannel);
    };
  }, [householdId, fetchTasks]);

  const handleCreateTask = async (data: {
    title: string;
    description?: string;
    assignedMemberId?: string;
    emoji?: string;
    points?: number;
    frequencyCount?: number;
    frequencyUnit?: 'day' | 'week' | 'month' | 'year';
  }): Promise<Task> => {
    if (!householdId) {
      throw new Error('No household selected');
    }

    try {
      setError(null);

      const { data: task, error: createError } = await supabase
        .from('tasks')
        .insert({
          household_id: householdId,
          title: data.title,
          description: data.description || null,
          emoji: data.emoji || null,
          points: data.points || 4,
          assigned_member_id: data.assignedMemberId || null,
          frequency_count: data.frequencyCount || null,
          frequency_unit: data.frequencyUnit || null,
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchTasks();
      return task;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleUpdateTask = async (taskId: string, data: {
    title?: string;
    description?: string;
    status?: 'pending' | 'done';
    assignedMemberId?: string;
  }): Promise<void> => {
    try {
      setError(null);

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.assignedMemberId !== undefined) updateData.assigned_member_id = data.assignedMemberId;

      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (updateError) throw updateError;

      await fetchTasks();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) throw deleteError;

      await fetchTasks();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleCompleteTask = async (taskId: string, memberId: string, points: number = 1): Promise<void> => {
    try {
      setError(null);

      const { data: task, error: taskFetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskFetchError) throw taskFetchError;

      const { error: completionError } = await supabase
        .from('task_completions')
        .insert({
          task_id: taskId,
          member_id: memberId,
          done_by_user_id: user?.id || null,
          points_awarded: points,
        });

      if (completionError) throw completionError;

      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'done' })
        .eq('id', taskId);

      if (taskError) throw taskError;

      const { data: member, error: memberError } = await supabase
        .from('household_members')
        .select('points')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;

      const { error: pointsError } = await supabase
        .from('household_members')
        .update({ points: (member?.points || 0) + points })
        .eq('id', memberId);

      if (pointsError) throw pointsError;

      if (task.frequency_count && task.frequency_unit) {
        await supabase
          .from('tasks')
          .insert({
            household_id: task.household_id,
            title: task.title,
            description: task.description,
            emoji: task.emoji,
            points: task.points,
            assigned_member_id: task.assigned_member_id,
            frequency_count: task.frequency_count,
            frequency_unit: task.frequency_unit,
            last_recreated_at: new Date().toISOString(),
          });
      }

      await fetchTasks();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    tasks,
    completions,
    isLoading,
    error,
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    completeTask: handleCompleteTask,
    refresh: fetchTasks,
  };
}
