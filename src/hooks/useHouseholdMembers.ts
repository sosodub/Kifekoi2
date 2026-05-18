import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { addChildMember, deleteMember, updateMember } from '@/db/households';

export interface HouseholdMember {
  id: string;
  household_id: string;
  name: string;
  emoji: string | null;
  user_id: string | null;
  role: 'owner' | 'adult' | 'child';
  points: number;
  created_at: string;
}

interface UseHouseholdMembersResult {
  members: HouseholdMember[];
  isLoading: boolean;
  error: string | null;
  addChildMember: (data: { name: string; emoji?: string }) => Promise<void>;
  updateMember: (memberId: string, data: { name?: string; emoji?: string }) => Promise<void>;
  deleteMember: (memberId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useHouseholdMembers(householdId: string | null | undefined): UseHouseholdMembersResult {
  const { user } = useAuth();
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!householdId || !user) {
      setMembers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setMembers(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching household members:', err);
    } finally {
      setIsLoading(false);
    }
  }, [householdId, user]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (!householdId) return;

    const channel = supabase
      .channel(`household_members:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_members',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, fetchMembers]);

  const handleAddChildMember = async (data: { name: string; emoji?: string }) => {
    if (!householdId) {
      throw new Error('No household selected');
    }

    try {
      setError(null);
      await addChildMember(householdId, data);
      await fetchMembers();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleUpdateMember = async (memberId: string, data: { name?: string; emoji?: string }) => {
    if (!householdId) {
      throw new Error('No household selected');
    }

    try {
      setError(null);
      await updateMember(householdId, memberId, data);
      await fetchMembers();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!householdId) {
      throw new Error('No household selected');
    }

    try {
      setError(null);
      await deleteMember(householdId, memberId);
      await fetchMembers();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    members,
    isLoading,
    error,
    addChildMember: handleAddChildMember,
    updateMember: handleUpdateMember,
    deleteMember: handleDeleteMember,
    refresh: fetchMembers,
  };
}
