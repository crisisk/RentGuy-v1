import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';

/**
 * Gebruikersdata interface
 */
interface User {
  id: string;
  naam: string;
  email: string;
  telefoon?: string;
  voorkeuren?: Record<string, unknown>;
}

/**
 * User state interface
 */
interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * User actions interface
 */
interface UserActions {
  fetchUser: (userId: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  clearUser: () => void;
}

/**
 * Gecombineerde user store interface
 */
type UserStore = UserState & UserActions;

/**
 * Custom storage met error handling
 */
const storage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.error('User storage get error:', error);
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error('User storage set error:', error);
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('User storage remove error:', error);
    }
  },
};

/**
 * User store met persistentie
 */
export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      fetchUser: async (userId) => {
        try {
          set({ isLoading: true, error: null });
          
          // Simuleer API call
          await new Promise((resolve) => setTimeout(resolve, 1000));
          
          set({
            user: {
              id: userId,
              naam: 'Test Gebruiker',
              email: 'test@example.com',
              telefoon: '0612345678'
            },
            isLoading: false
          });
        } catch (error) {
          set({
            error: 'Fout bij ophalen gebruikersgegevens',
            isLoading: false
          });
        }
      },
      updateUser: async (userData) => {
        try {
          set({ isLoading: true });
          
          // Simuleer API call
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          set((state) => ({
            user: state.user ? { ...state.user, ...userData } : null,
            isLoading: false
          }));
        } catch (error) {
          set({
            error: 'Update mislukt',
            isLoading: false
          });
        }
      },
      clearUser: () => {
        set({ user: null, error: null });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        user: state.user
      }),
    }
  )
);

/* Testscenario's:
1. Gebruiker ophalen:
   - Roep fetchUser aan met geldig ID
   - Verifieer user data wordt correct geladen
   - Verifieer persistentie

2. Gebruiker updaten:
   - Update deel van de gebruikersdata
   - Verifieer merge van oude en nieuwe data

3. Lege gebruiker:
   - Roep clearUser aan
   - Verifieer state wordt gereset

4. Dubbele updates:
   - Start meerdere update calls tegelijk
   - Verifieer consistente state

5. Offline modus:
   - Simuleer network error
   - Verifieer error handling
*/