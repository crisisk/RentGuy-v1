import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';

/**
 * Authenticatie state interface
 */
interface AuthState {
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Authenticatie actions interface
 */
interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Gecombineerde auth store interface
 */
type AuthStore = AuthState & AuthActions;

/**
 * Initiale auth state
 */
const initialState: AuthState = {
  token: null,
  isLoggedIn: false,
  isLoading: false,
  error: null,
};

/**
 * Custom storage object voor error handling
 */
const storage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error('LocalStorage set error:', error);
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('LocalStorage remove error:', error);
    }
  },
};

/**
 * Authenticatie store met persistentie
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          
          // Simuleer API call
          await new Promise((resolve, reject) => setTimeout(() => {
            if (email === 'test@example.com' && password === 'wachtwoord') {
              resolve(true);
            } else {
              reject(new Error('Ongeldige inloggegevens'));
            }
          }, 1000));

          set({ 
            token: 'dummy-jwt-token',
            isLoggedIn: true,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Inloggen mislukt',
            isLoading: false 
          });
        }
      },
      logout: () => {
        set({ ...initialState });
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        token: state.token,
        isLoggedIn: state.isLoggedIn
      }),
    }
  )
);

/* Testscenario's:
1. Succesvol inloggen:
   - Start met initialState
   - Roep login aan met correcte credentials
   - Verifieer token en isLoggedIn worden geüpdatet
   - Verifieer persistentie na refresh

2. Mislukt inloggen:
   - Roep login aan met foute credentials
   - Verifieer error message wordt gezet

3. Logout:
   - Na succesvolle login, roep logout aan
   - Verifieer state wordt gereset

4. Concurrente requests:
   - Start meerdere login calls tegelijk
   - Verifieer alleen laatste request telt

5. Network error:
   - Simuleer storage error
   - Verifieer error handling
*/