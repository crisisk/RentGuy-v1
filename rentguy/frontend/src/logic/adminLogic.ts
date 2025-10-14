import { User, UserRole } from '../types/adminTypes';
import { useAdminStore } from '../stores/adminStore';
import { z } from 'zod';
import { APIError } from '../errors';

const UserSchema = z.object({
  username: z.string().min(3, 'Gebruikersnaam moet minimaal 3 tekens zijn'),
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens zijn')
    .regex(/[A-Z]/, 'Moet minimaal 1 hoofdletter bevatten')
    .regex(/[0-9]/, 'Moet minimaal 1 cijfer bevatten'),
  role: z.nativeEnum(UserRole),
});

export const validateUser = (user: Partial<User>) => {
  try {
    UserSchema.parse(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message);
    }
    throw new Error('Ongeldige gebruikersgegevens');
  }
};

export const createUser = async (userData: Partial<User>): Promise<User> => {
  const store = useAdminStore.getState();
  
  try {
    validateUser(userData);
    
    const exists = store.users.some(u => 
      u.email === userData.email || u.username === userData.username
    );
    
    if (exists) {
      throw new Error('Gebruiker met deze gegevens bestaat al');
    }

    const newUser: User = {
      ...userData as User,
      id: `user-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true,
    };

    store.addUser(newUser);
    return newUser;
  } catch (error) {
    throw new APIError(
      `Gebruiker aanmaken mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
      'USER_CREATE_FAILED'
    );
  }
};

export const deactivateUser = async (userId: string): Promise<User> => {
  const store = useAdminStore.getState();
  const user = store.users.find(u => u.id === userId);
  
  if (!user) {
    throw new APIError('Gebruiker niet gevonden', 'USER_NOT_FOUND');
  }

  if (!user.active) {
    throw new APIError('Gebruiker is al gedeactiveerd', 'USER_ALREADY_INACTIVE');
  }

  try {
    const updated = { ...user, active: false, updatedAt: new Date() };
    store.updateUser(userId, updated);
    return updated;
  } catch (error) {
    throw new APIError(
      `Deactiveren mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
      'USER_DEACTIVATE_FAILED'
    );
  }
};

/* Testscenarios:
1. createUser met zwak wachtwoord → validatiefout
2. createUser met bestaande username → duplicaatfout
3. deactivateUser voor al gedeactiveerde gebruiker → fout
*/