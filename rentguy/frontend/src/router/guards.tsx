import { useEffect } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type UserRole = 'admin' | 'user' | 'guest';

interface AuthState {
  token: string | null;
  role: UserRole;
  isLoading: boolean;
  error: string | null;
  login: (token: string, role: UserRole) => void;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
  validateRole: (requiredRole: UserRole) => boolean;
}

/**
 * Zustand store voor authenticatiebeheer
 */
export const useAuthStore = create<AuthState>()(
  immer((set, get) => ({
    token: localStorage.getItem('rentguy_token'),
    role: (localStorage.getItem('rentguy_role') as UserRole) || 'guest',
    isLoading: false,
    error: null,

    login: (token: string, role: UserRole) => {
      localStorage.setItem('rentguy_token', token);
      localStorage.setItem('rentguy_role', role);
      set({ token, role, error: null });
    },

    logout: () => {
      localStorage.removeItem('rentguy_token');
      localStorage.removeItem('rentguy_role');
      set({ token: null, role: 'guest', error: null });
    },

    checkAuthStatus: async () => {
      set({ isLoading: true, error: null });
      try {
        // Simuleer API call voor token validatie
        const token = get().token;
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!token || token !== localStorage.getItem('rentguy_token')) {
          get().logout();
        }
      } catch (error) {
        set({ error: 'Fout bij authenticatiecontrole' });
        get().logout();
      } finally {
        set({ isLoading: false });
      }
    },

    validateRole: (requiredRole: UserRole) => {
      const currentRole = get().role;
      return currentRole === requiredRole || currentRole === 'admin';
    }
  }))
);

/**
 * Hook voor routebeveiliging
 * @param requiredRole Benodigde rol voor toegang
 * @returns Object met toegangsstatus en laadstatus
 */
export const useAuthGuard = (requiredRole?: UserRole) => {
  const { token, role, isLoading, error, checkAuthStatus, validateRole } = useAuthStore();

  useEffect(() => {
    if (token && !error) {
      checkAuthStatus();
    }
  }, []);

  const isAuthenticated = !!token && !error;
  const isAuthorized = requiredRole ? validateRole(requiredRole) : true;

  return {
    allowed: isAuthenticated && isAuthorized,
    isLoading: isLoading || (!error && !!token),
    error,
    role,
    requiredRole
  };
};

/**
 * Laadspinner component met toegankelijke markup
 */
export const AuthSpinner = () => (
  <div className="flex h-screen items-center justify-center" role="status" aria-live="polite">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
    <span className="sr-only">Beveiligingscontrole...</span>
  </div>
);

/**
 * Toegangsgeweigerd component
 */
export const AccessDenied = ({ requiredRole }: { requiredRole?: UserRole }) => (
  <div className="p-8 text-center" role="alert" aria-live="assertive">
    <h1 className="text-2xl font-bold mb-4">Toegang geweigerd</h1>
    <p className="text-gray-600">
      {requiredRole 
        ? `U heeft geen rechten voor deze pagina (Benodigde rol: ${requiredRole})`
        : 'U moet ingelogd zijn om deze pagina te bekijken'}
    </p>
  </div>
);

/* Testscenario's:
1. Niet ingelogde gebruiker toegang tot beschermde route:
   - Moet redirecten naar login
2. Ingelogde gebruiker met onvoldoende rechten:
   - Toont toegang geweigerd
3. Admin gebruiker toegang tot admin route:
   - Toegang verleend
4. Token vervalt tijdens sessie:
   - Automatische logout en redirect
5. Netwerkfout tijdens auth check:
   - Toont foutmelding en logout
*/