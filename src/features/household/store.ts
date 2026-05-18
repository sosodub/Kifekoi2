import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Household } from '@/models/household';

interface HouseholdStore {
  household: Household | null;
  setHousehold: (data: Household) => void;
  resetHousehold: () => void;
}

export const useHouseholdStore = create<HouseholdStore>()(
  persist(
    (set) => ({
      household: null,
      setHousehold: (data) => set({ household: data }),
      resetHousehold: () => set({ household: null }),
    }),
    {
      name: 'kifekoi-household',
    }
  )
);
