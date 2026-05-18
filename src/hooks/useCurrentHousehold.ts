import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { initHouseholdForNewUser } from '@/db/households';

interface Household {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

interface HouseholdMember {
  id: string;
  household_id: string;
  name: string;
  emoji: string | null;
  user_id: string | null;
  role: 'owner' | 'adult' | 'child';
  points: number;
  created_at: string;
}

interface CurrentHouseholdData {
  household: Household | null;
  members: HouseholdMember[];
  inviteCode: string | null;
  isOwner: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCurrentHousehold(): CurrentHouseholdData {
  const { user } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHouseholdData = async () => {
    if (!user) {
      setHousehold(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: membershipData, error: membershipError } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (membershipError) throw membershipError;

      if (!membershipData) {
        setError('Aucun foyer trouvé pour ce compte');
        setHousehold(null);
        setMembers([]);
        setLoading(false);
        return;
      }

      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .select('*')
        .eq('id', membershipData.household_id)
        .maybeSingle();

      if (householdError) throw householdError;

      if (!householdData) {
        setError('Foyer introuvable');
        setHousehold(null);
        setMembers([]);
        setLoading(false);
        return;
      }

      setHousehold(householdData);

      const { data: membersData, error: membersError } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', householdData.id)
        .order('created_at', { ascending: true });

      if (membersError) throw membersError;

      setMembers(membersData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseholdData();
  }, [user]);

  const isOwner = household ? household.owner_id === user?.id : false;
  const inviteCode = household ? household.invite_code : null;

  return {
    household,
    members,
    inviteCode,
    isOwner,
    loading,
    error,
    refresh: fetchHouseholdData,
  };
}
