import { supabase } from '@/services/supabase';

export interface CreateHouseholdData {
  name: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmoji?: string;
}

export interface JoinHouseholdData {
  inviteCode: string;
  memberName: string;
  memberEmoji?: string;
  role: 'adult' | 'child';
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createHousehold(data: CreateHouseholdData) {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  const inviteCode = generateInviteCode();

  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({
      name: data.name,
      invite_code: inviteCode,
      owner_id: user.data.user.id,
    })
    .select()
    .single();

  if (householdError) throw householdError;

  const { error: memberError } = await supabase
    .from('household_members')
    .insert({
      household_id: household.id,
      name: `${data.ownerFirstName} ${data.ownerLastName}`,
      emoji: data.ownerEmoji || null,
      user_id: user.data.user.id,
      role: 'owner',
    });

  if (memberError) throw memberError;

  return household;
}

export async function joinHousehold(data: JoinHouseholdData) {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('id')
    .eq('invite_code', data.inviteCode)
    .maybeSingle();

  if (householdError) throw householdError;
  if (!household) throw new Error('Invalid invite code');

  const { error: memberError } = await supabase
    .from('household_members')
    .insert({
      household_id: household.id,
      name: data.memberName,
      emoji: data.memberEmoji || null,
      user_id: user.data.user.id,
      role: data.role,
    });

  if (memberError) throw memberError;

  return household;
}

export async function joinHouseholdByCode(
  code: string,
  memberName: string
): Promise<{ householdId: string }> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Non authentifié');

  const cleanCode = code.trim().toUpperCase();
  console.log('[joinHouseholdByCode] Searching for household with code:', cleanCode);

  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('id, invite_code, name, owner_id')
    .eq('invite_code', cleanCode)
    .maybeSingle();

  if (householdError) {
    console.error('[joinHouseholdByCode] Error fetching household:', householdError);
    throw householdError;
  }

  if (!household) {
    console.log('[joinHouseholdByCode] No household found with code:', cleanCode);
    throw new Error('Code foyer invalide');
  }

  console.log('[joinHouseholdByCode] Household found:', household.id);

  const { data: existingMembership, error: membershipCheckError } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', household.id)
    .eq('user_id', user.data.user.id)
    .maybeSingle();

  if (membershipCheckError) {
    console.error('[joinHouseholdByCode] Error checking membership:', membershipCheckError);
    throw membershipCheckError;
  }

  if (existingMembership) {
    console.log('[joinHouseholdByCode] User already member of this household');
    return { householdId: household.id };
  }

  console.log('[joinHouseholdByCode] Adding user as member');

  const { error: insertError } = await supabase
    .from('household_members')
    .insert({
      household_id: household.id,
      user_id: user.data.user.id,
      name: memberName,
      role: 'adult',
      emoji: null,
    });

  if (insertError) {
    console.error('[joinHouseholdByCode] Error inserting member:', insertError);
    throw insertError;
  }

  console.log('[joinHouseholdByCode] Successfully joined household');
  return { householdId: household.id };
}

export async function getUserHouseholds() {
  const user = await supabase.auth.getUser();
  if (!user.data.user) return [];

  const { data, error } = await supabase
    .from('household_members')
    .select('household_id, households(*)')
    .eq('user_id', user.data.user.id);

  if (error) throw error;
  return data.map((item) => item.households);
}

export async function getHouseholdMembers(householdId: string) {
  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function initHouseholdForNewUser(
  userId: string,
  optionalInviteCode: string | null | undefined,
  pseudo?: string
): Promise<{ householdId: string; error?: string }> {
  try {
    console.log('[initHouseholdForNewUser] Starting for user:', userId, 'with code:', optionalInviteCode);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('[initHouseholdForNewUser] Profile error:', profileError);
      throw new Error('Profil utilisateur introuvable');
    }

    if (!profile) {
      console.error('[initHouseholdForNewUser] No profile found for user:', userId);
      throw new Error('Profil utilisateur introuvable');
    }

    console.log('[initHouseholdForNewUser] Profile found:', profile);

    const { data: existingMembership, error: membershipError } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError) {
      console.error('[initHouseholdForNewUser] Membership check error:', membershipError);
      throw membershipError;
    }

    if (existingMembership) {
      console.log('[initHouseholdForNewUser] User already has household:', existingMembership.household_id);
      return { householdId: existingMembership.household_id };
    }

    console.log('[initHouseholdForNewUser] No existing membership, creating new household');

    const memberName = pseudo && pseudo.trim() ? pseudo.trim() : `${profile.first_name} ${profile.last_name}`;
    console.log('[initHouseholdForNewUser] Member name:', memberName);

    if (optionalInviteCode && optionalInviteCode.trim()) {
      const inviteCode = optionalInviteCode.trim().toUpperCase();
      console.log('[initHouseholdForNewUser] Joining existing household with code:', inviteCode);

      const { data, error: rpcError } = await supabase
        .rpc('join_household_by_code', {
          p_invite_code: inviteCode,
          p_member_name: memberName,
          p_member_emoji: null,
        });

      if (rpcError) {
        console.error('[initHouseholdForNewUser] RPC error:', rpcError);
        throw rpcError;
      }

      if (!data || data.length === 0) {
        console.error('[initHouseholdForNewUser] No data returned from RPC');
        return { householdId: '', error: 'Erreur lors du rattachement au foyer' };
      }

      const result = data[0];
      console.log('[initHouseholdForNewUser] RPC result:', result);

      if (result.error_message) {
        return { householdId: '', error: result.error_message };
      }

      return { householdId: result.household_id };
    } else {
      console.log('[initHouseholdForNewUser] Creating new household');
      const householdName = `Foyer ${profile.last_name}`;
      const inviteCode = generateInviteCode();
      console.log('[initHouseholdForNewUser] Generated code:', inviteCode);

      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          name: householdName,
          invite_code: inviteCode,
          owner_id: userId,
        })
        .select()
        .single();

      if (householdError) {
        console.error('[initHouseholdForNewUser] Household creation error:', householdError);
        throw householdError;
      }

      console.log('[initHouseholdForNewUser] Household created:', household.id);

      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          name: memberName,
          emoji: null,
          user_id: userId,
          role: 'owner',
        });

      if (memberError) {
        console.error('[initHouseholdForNewUser] Member creation error:', memberError);
        throw memberError;
      }

      console.log('[initHouseholdForNewUser] Member created successfully');
      return { householdId: household.id };
    }
  } catch (error: any) {
    console.error('[initHouseholdForNewUser] Fatal error:', error);
    throw new Error(error.message || 'Erreur lors de l\'initialisation du foyer');
  }
}

export async function regenerateInviteCode(householdId: string): Promise<string> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Non authentifié');

  const { data: membership, error: membershipError } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.data.user.id)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership || membership.role !== 'owner') {
    throw new Error('Seul le propriétaire peut régénérer le code');
  }

  const newInviteCode = generateInviteCode();

  const { error: updateError } = await supabase
    .from('households')
    .update({ invite_code: newInviteCode })
    .eq('id', householdId);

  if (updateError) throw updateError;

  return newInviteCode;
}

export async function addChildMember(
  householdId: string,
  data: { name: string; emoji?: string }
): Promise<void> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Non authentifié');

  const { data: membership, error: membershipError } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.data.user.id)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership || !['owner', 'adult'].includes(membership.role)) {
    throw new Error('Seuls les adultes peuvent ajouter des membres');
  }

  const { error: insertError } = await supabase
    .from('household_members')
    .insert({
      household_id: householdId,
      name: data.name,
      emoji: data.emoji || null,
      user_id: null,
      role: 'child',
    });

  if (insertError) throw insertError;
}

export async function updateMember(
  householdId: string,
  memberId: string,
  data: { name?: string; emoji?: string }
): Promise<void> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Non authentifié');

  const { data: currentMembership, error: currentMembershipError } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.data.user.id)
    .maybeSingle();

  if (currentMembershipError) throw currentMembershipError;
  if (!currentMembership || !['owner', 'adult'].includes(currentMembership.role)) {
    throw new Error('Seuls les adultes peuvent modifier des membres');
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.emoji !== undefined) updateData.emoji = data.emoji || null;

  const { error: updateError } = await supabase
    .from('household_members')
    .update(updateData)
    .eq('id', memberId)
    .eq('household_id', householdId);

  if (updateError) throw updateError;
}

export async function deleteMember(
  householdId: string,
  memberId: string
): Promise<void> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Non authentifié');

  const { data: currentMembership, error: currentMembershipError } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.data.user.id)
    .maybeSingle();

  if (currentMembershipError) throw currentMembershipError;
  if (!currentMembership || !['owner', 'adult'].includes(currentMembership.role)) {
    throw new Error('Seuls les adultes peuvent supprimer des membres');
  }

  const { data: memberToDelete, error: memberError } = await supabase
    .from('household_members')
    .select('role, user_id')
    .eq('id', memberId)
    .eq('household_id', householdId)
    .maybeSingle();

  if (memberError) throw memberError;
  if (!memberToDelete) throw new Error('Membre introuvable');

  if (memberToDelete.role === 'owner') {
    const { data: owners, error: ownersError } = await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', householdId)
      .eq('role', 'owner');

    if (ownersError) throw ownersError;
    if (owners && owners.length <= 1) {
      throw new Error('Impossible de supprimer le dernier propriétaire du foyer');
    }
  }

  if (currentMembership.role !== 'owner' && memberToDelete.role === 'adult' && memberToDelete.user_id !== null) {
    throw new Error('Seul un propriétaire peut supprimer un autre adulte');
  }

  const { error: deleteError } = await supabase
    .from('household_members')
    .delete()
    .eq('id', memberId);

  if (deleteError) throw deleteError;
}
