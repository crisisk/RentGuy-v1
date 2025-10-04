import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authSlice } from './slices/authSlice';
import { onboardingSlice } from './slices/onboardingSlice';
import { equipmentSlice } from './slices/equipmentSlice';
import { settingsSlice } from './slices/settingsSlice';
import { errorSlice } from './slices/errorSlice';
import { persistenceMiddleware } from './middleware/persistence';
import { loggingMiddleware } from './middleware/logging';

// Main store configuration with multiple slices
const useStore = create()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get, api) => ({
          // Authentication slice
          ...authSlice(set, get, api),
          
          // Onboarding wizard slice
          ...onboardingSlice(set, get, api),
          
          // Equipment catalog slice
          ...equipmentSlice(set, get, api),
          
          // Application settings slice
          ...settingsSlice(set, get, api),
          
          // Error handling slice
          ...errorSlice(set, get, api),
          
          // Global actions
          resetStore: () => {
            set((state) => {
              // Reset all slices to initial state
              Object.keys(state).forEach(key => {
                if (typeof state[key] === 'object' && state[key] !== null) {
                  if (key.includes('initial') || key.includes('default')) {
                    return; // Skip initial state objects
                  }
                  // Reset to initial values
                  if (key === 'auth') {
                    state[key] = authSlice.getInitialState();
                  } else if (key === 'onboarding') {
                    state[key] = onboardingSlice.getInitialState();
                  } else if (key === 'equipment') {
                    state[key] = equipmentSlice.getInitialState();
                  } else if (key === 'settings') {
                    state[key] = settingsSlice.getInitialState();
                  } else if (key === 'errors') {
                    state[key] = errorSlice.getInitialState();
                  }
                }
              });
            });
          },
          
          // Hydration status
          _hasHydrated: false,
          setHasHydrated: (hasHydrated) => {
            set((state) => {
              state._hasHydrated = hasHydrated;
            });
          },
          
          // Store metadata
          _version: '1.0.0',
          _lastUpdated: Date.now(),
          
          // Update timestamp on any state change
          updateTimestamp: () => {
            set((state) => {
              state._lastUpdated = Date.now();
            });
          }
        }))
      ),
      {
        name: 'rentguy-store',
        version: 1,
        
        // Persistence configuration
        partialize: (state) => ({
          // Only persist specific parts of the state
          auth: {
            user: state.auth?.user,
            isAuthenticated: state.auth?.isAuthenticated,
            token: state.auth?.token,
          },
          onboarding: {
            currentStep: state.onboarding?.currentStep,
            completedSteps: state.onboarding?.completedSteps,
            formData: state.onboarding?.formData,
          },
          settings: state.settings,
          _version: state._version,
          _lastUpdated: state._lastUpdated,
        }),
        
        // Migration function for version updates
        migrate: (persistedState, version) => {
          if (version === 0) {
            // Migration from version 0 to 1
            return {
              ...persistedState,
              _version: '1.0.0',
              _lastUpdated: Date.now(),
            };
          }
          return persistedState;
        },
        
        // Custom storage configuration
        storage: {
          getItem: (name) => {
            try {
              const item = localStorage.getItem(name);
              return item ? JSON.parse(item) : null;
            } catch (error) {
              console.error('Error parsing stored state:', error);
              return null;
            }
          },
          setItem: (name, value) => {
            try {
              localStorage.setItem(name, JSON.stringify(value));
            } catch (error) {
              console.error('Error storing state:', error);
            }
          },
          removeItem: (name) => {
            try {
              localStorage.removeItem(name);
            } catch (error) {
              console.error('Error removing stored state:', error);
            }
          },
        },
        
        // Hydration callback
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.setHasHydrated(true);
            console.log('Store hydrated successfully');
          }
        },
      }
    ),
    {
      name: 'RentGuy Store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Store selectors for optimized access
export const useAuth = () => useStore((state) => state.auth);
export const useOnboarding = () => useStore((state) => state.onboarding);
export const useEquipment = () => useStore((state) => state.equipment);
export const useSettings = () => useStore((state) => state.settings);
export const useErrors = () => useStore((state) => state.errors);

// Computed selectors
export const useIsOnboardingComplete = () => 
  useStore((state) => state.onboarding?.completedSteps?.length >= 6);

export const useAuthenticatedUser = () => 
  useStore((state) => state.auth?.isAuthenticated ? state.auth.user : null);

export const useHasErrors = () => 
  useStore((state) => state.errors?.items?.length > 0);

export const useStoreMetadata = () => 
  useStore((state) => ({
    version: state._version,
    lastUpdated: state._lastUpdated,
    hasHydrated: state._hasHydrated,
  }));

// Action selectors
export const useAuthActions = () => useStore((state) => ({
  login: state.login,
  logout: state.logout,
  updateUser: state.updateUser,
  refreshToken: state.refreshToken,
}));

export const useOnboardingActions = () => useStore((state) => ({
  setCurrentStep: state.setCurrentStep,
  completeStep: state.completeStep,
  updateFormData: state.updateFormData,
  resetOnboarding: state.resetOnboarding,
}));

export const useEquipmentActions = () => useStore((state) => ({
  setEquipment: state.setEquipment,
  addEquipment: state.addEquipment,
  updateEquipment: state.updateEquipment,
  removeEquipment: state.removeEquipment,
  setSelectedEquipment: state.setSelectedEquipment,
}));

export const useErrorActions = () => useStore((state) => ({
  addError: state.addError,
  removeError: state.removeError,
  clearErrors: state.clearErrors,
}));

// Store utilities
export const getStoreState = () => useStore.getState();
export const subscribeToStore = (selector, callback) => useStore.subscribe(selector, callback);

// Performance monitoring
if (process.env.NODE_ENV === 'development') {
  // Subscribe to all state changes for debugging
  useStore.subscribe(
    (state) => state,
    (state, prevState) => {
      console.log('Store updated:', {
        timestamp: new Date().toISOString(),
        changes: Object.keys(state).filter(key => state[key] !== prevState[key]),
        state: state,
      });
    }
  );
}

export default useStore;
