import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

/**
 * Notificatie type
 */
type NotificationType = 'success' | 'error' | 'info' | 'waarschuwing';

/**
 * Notificatie interface
 */
interface Notification {
  id: string;
  type: NotificationType;
  titel: string;
  bericht: string;
  datum: Date;
  timeout?: number;
}

/**
 * Notification state interface
 */
interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'datum'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

/**
 * Custom storage voor notificaties
 */
const storage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.error('Notification storage get error:', error);
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error('Notification storage set error:', error);
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Notification storage remove error:', error);
    }
  },
};

/**
 * Notification store met persistentie en auto-verwijdering
 */
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: uuidv4(),
          datum: new Date(),
          timeout: notification.timeout || 5000,
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-verwijdering na timeout
        setTimeout(() => {
          get().removeNotification(newNotification.id);
        }, newNotification.timeout);
      },
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(
            (notification) => notification.id !== id
          ),
        }));
      },
      clearNotifications: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        notifications: state.notifications
      }),
    }
  )
);

/* Testscenario's:
1. Notificatie toevoegen:
   - Voeg nieuwe notificatie toe
   - Verifieer ID en datum worden gezet
   - Verifieer auto-verwijdering na timeout

2. Notificatie verwijderen:
   - Voeg notificatie toe en verwijder direct
   - Verifieer staat correct wordt geüpdatet

3. Persistentie:
   - Voeg notificaties toe en verifieer na reload
   - Verifieer datum wordt correct geparsed

4. Bulk notificaties:
   - Voeg meerdere notificaties snel achter elkaar toe
   - Verifieer alle worden correct weergegeven

5. Cleanup:
   - Test clearNotifications reset de state
*/