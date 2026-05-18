import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Member } from '@/models/member';

interface MembersStore {
  members: Member[];
  addMember: (name: string, avatarEmoji?: string) => void;
  updateMember: (member: Member) => void;
  removeMember: (id: string) => void;
  addPoints: (memberId: string, points: number) => void;
  resetMembers: () => void;
}

export const useMembersStore = create<MembersStore>()(
  persist(
    (set) => ({
      members: [],
      addMember: (name, avatarEmoji) => {
        const newMember: Member = {
          id: crypto.randomUUID(),
          name,
          avatarEmoji,
          pointsTotal: 0,
        };
        set((state) => ({ members: [...state.members, newMember] }));
      },
      updateMember: (member) => {
        set((state) => ({
          members: state.members.map((m) => (m.id === member.id ? member : m)),
        }));
      },
      removeMember: (id) => {
        set((state) => ({
          members: state.members.filter((m) => m.id !== id),
        }));
      },
      addPoints: (memberId, points) => {
        set((state) => ({
          members: state.members.map((m) =>
            m.id === memberId ? { ...m, pointsTotal: m.pointsTotal + points } : m
          ),
        }));
      },

      resetMembers: () => {
        set({ members: [] });
      },
    }),
    {
      name: 'kifekoi-members',
    }
  )
);
