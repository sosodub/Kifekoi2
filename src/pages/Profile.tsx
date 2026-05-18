import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import SectionTitle from '@/components/SectionTitle';
import KButton from '@/components/KButton';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentHousehold } from '@/hooks/useCurrentHousehold';
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers';
import { regenerateInviteCode, joinHouseholdByCode } from '@/db/households';
import { TabType } from '@/components/TabBar';
import { supabase } from '@/services/supabase';

export function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { household, inviteCode, isOwner, refresh, loading: householdLoading, error: householdError } = useCurrentHousehold();
  const { members, isLoading: membersLoading, addChildMember, updateMember: handleUpdateMember, deleteMember: handleDeleteMember } = useHouseholdMembers(household?.id);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [updatingMember, setUpdatingMember] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [repairCode, setRepairCode] = useState('');
  const [repairing, setRepairing] = useState(false);
  const [repairError, setRepairError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ firstName: string; lastName: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();

      if (data && !error) {
        setUserProfile({ firstName: data.first_name, lastName: data.last_name });
      }
    };

    fetchProfile();
  }, [user]);

  const handleTabChange = (tab: TabType) => {
    if (tab === 'dashboard') {
      navigate('/dashboard');
    } else if (tab === 'history') {
      navigate('/history');
    } else if (tab === 'podium') {
      navigate('/podium');
    }
  };

  const handleAddMember = async () => {
    if (!name.trim()) return;

    setAddingMember(true);
    try {
      await addChildMember({
        name: name.trim(),
        emoji: emoji.trim() || undefined,
      });
      setName('');
      setEmoji('');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'ajout du membre');
    } finally {
      setAddingMember(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleCopyInviteCode = async () => {
    if (inviteCode) {
      try {
        await navigator.clipboard.writeText(inviteCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (error) {
        console.error('Copy error:', error);
      }
    }
  };

  const handleRegenerateCode = async () => {
    if (!household) return;

    setRegenerating(true);
    try {
      await regenerateInviteCode(household.id);
      await refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setRegenerating(false);
    }
  };

  const handleRepairAccount = async () => {
    if (!user || !repairCode.trim() || !userProfile) return;

    setRepairing(true);
    setRepairError(null);
    try {
      const memberName = `${userProfile.firstName} ${userProfile.lastName}`;
      await joinHouseholdByCode(repairCode, memberName);

      await refresh();
      setRepairCode('');
    } catch (error: any) {
      setRepairError(error.message || 'Erreur lors du rattachement au foyer');
    } finally {
      setRepairing(false);
    }
  };

  return (
    <MainLayout onTabChange={handleTabChange}>
      <div className="space-y-6">
        <SectionTitle>Mon foyer</SectionTitle>

        {householdError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-600 mb-3">{householdError}</p>
            {householdError.includes('Aucun foyer trouvé') && (
              <div className="space-y-3 mt-4 pt-4 border-t border-red-200">
                <p className="text-sm text-gray-700 font-medium">
                  Rejoindre un foyer existant :
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Code foyer"
                    value={repairCode}
                    onChange={(e) => setRepairCode(e.target.value)}
                    disabled={repairing}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-k-orange disabled:opacity-50"
                  />
                  <KButton
                    onClick={handleRepairAccount}
                    disabled={repairing || !repairCode.trim()}
                    className="whitespace-nowrap"
                  >
                    {repairing ? 'Rattachement...' : 'Rejoindre'}
                  </KButton>
                </div>
                {repairError && (
                  <p className="text-sm text-red-600">{repairError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {householdLoading && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">Chargement...</p>
          </div>
        )}

        {!householdLoading && household && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Informations du foyer</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Nom du foyer</p>
                <p className="font-medium">{household.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Code d'invitation</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 px-4 py-2 rounded-lg font-mono text-lg font-semibold text-k-orange">
                    {inviteCode}
                  </div>
                  <KButton
                    variant="secondary"
                    onClick={handleCopyInviteCode}
                    className="whitespace-nowrap"
                  >
                    {copySuccess ? '✓ Copié' : 'Copier'}
                  </KButton>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Partagez ce code pour inviter des membres dans votre foyer
                </p>
              </div>
              {isOwner && (
                <div className="pt-2">
                  <KButton
                    variant="secondary"
                    onClick={handleRegenerateCode}
                    disabled={regenerating}
                    className="w-full"
                  >
                    {regenerating ? 'Génération...' : 'Régénérer le code'}
                  </KButton>
                </div>
              )}
            </div>
          </div>
        )}

        {!householdLoading && household && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Membres du foyer</h3>

            {membersLoading ? (
              <p className="text-gray-500 text-sm mb-4">Chargement...</p>
            ) : members.length === 0 ? (
              <p className="text-gray-500 text-sm mb-4">Aucun membre pour le moment</p>
            ) : (
            <div className="space-y-3 mb-6">
              {members.map((member) => {
                const isCurrentUser = member.user_id === user?.id;
                const displayName = member.name;
                const displayEmoji = member.emoji || '👤';
                const isEditing = editingMemberId === member.id;

                return (
                  <div
                    key={member.id}
                    className="p-3 bg-gray-50 rounded-xl"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Nom"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={updatingMember}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-k-orange disabled:opacity-50"
                        />
                        <input
                          type="text"
                          placeholder="Emoji (optionnel)"
                          value={editEmoji}
                          onChange={(e) => setEditEmoji(e.target.value)}
                          maxLength={2}
                          disabled={updatingMember}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-k-orange disabled:opacity-50"
                        />
                        <div className="flex gap-2">
                          <KButton
                            onClick={async () => {
                              if (!editName.trim()) return;
                              setUpdatingMember(true);
                              try {
                                await handleUpdateMember(member.id, {
                                  name: editName.trim(),
                                  emoji: editEmoji.trim() || undefined,
                                });
                                setEditingMemberId(null);
                                setEditName('');
                                setEditEmoji('');
                              } catch (error: any) {
                                alert(error.message || 'Erreur lors de la modification');
                              } finally {
                                setUpdatingMember(false);
                              }
                            }}
                            disabled={updatingMember || !editName.trim()}
                            className="flex-1"
                          >
                            {updatingMember ? 'Sauvegarde...' : 'Sauvegarder'}
                          </KButton>
                          <KButton
                            variant="secondary"
                            onClick={() => {
                              setEditingMemberId(null);
                              setEditName('');
                              setEditEmoji('');
                            }}
                            disabled={updatingMember}
                            className="flex-1"
                          >
                            Annuler
                          </KButton>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{displayEmoji}</span>
                            <div>
                              <p className="font-medium">{displayName}</p>
                              <p className="text-sm text-gray-500">{member.points} pts</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => {
                                setEditingMemberId(member.id);
                                setEditName(member.name);
                                setEditEmoji(member.emoji || '');
                              }}
                              disabled={editingMemberId !== null || deletingMemberId !== null}
                              className="text-k-orange hover:text-k-orange-dark text-sm font-medium disabled:opacity-50"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={async () => {
                                if (deletingMemberId) return;
                                if (!confirm(`Supprimer ${displayName} ?`)) return;

                                setDeletingMemberId(member.id);
                                try {
                                  await handleDeleteMember(member.id);
                                } catch (error: any) {
                                  alert(error.message || 'Erreur lors de la suppression');
                                } finally {
                                  setDeletingMemberId(null);
                                }
                              }}
                              disabled={deletingMemberId === member.id || editingMemberId !== null}
                              className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                            >
                              {deletingMemberId === member.id ? 'Suppression...' : 'Supprimer'}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Ajouter un membre</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={addingMember || !household}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <input
                  type="text"
                  placeholder="Emoji (optionnel)"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  maxLength={2}
                  disabled={addingMember || !household}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <KButton onClick={handleAddMember} disabled={addingMember || !household}>
                  {addingMember ? 'Ajout...' : 'Ajouter'}
                </KButton>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Compte</h3>
          <KButton
            variant="secondary"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full"
          >
            {loggingOut ? 'Déconnexion...' : 'Se déconnecter'}
          </KButton>
        </div>
      </div>
    </MainLayout>
  );
}
