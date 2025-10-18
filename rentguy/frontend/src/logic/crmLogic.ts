import { Client, ClientCategory } from '../types/crmTypes';
import { useCRMStore } from '../stores/crmStore';
import { z } from 'zod';
import { APIError } from '../errors';

const ClientSchema = z.object({
  companyName: z.string().min(1, 'Bedrijfsnaam is verplicht'),
  contactName: z.string().min(1, 'Contactpersoon is verplicht'),
  email: z.string().email('Ongeldig e-mailadres'),
  phone: z.string().regex(/^\+?[0-9]{9,13}$/, 'Ongeldig telefoonnummer'),
  category: z.nativeEnum(ClientCategory),
});

export const validateClient = (client: Partial<Client>) => {
  try {
    ClientSchema.parse(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message);
    }
    throw new Error('Ongeldige klantgegevens');
  }
};

export const addClient = async (clientData: Partial<Client>): Promise<Client> => {
  const store = useCRMStore.getState();
  
  try {
    validateClient(clientData);
    
    const exists = store.clients.some(c => 
      c.email === clientData.email || c.phone === clientData.phone
    );
    
    if (exists) {
      throw new Error('Klant met deze contactgegevens bestaat al');
    }

    const newClient: Client = {
      ...clientData as Client,
      id: `client-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      projects: [],
    };

    store.addClient(newClient);
    return newClient;
  } catch (error) {
    throw new APIError(
      `Klant toevoegen mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
      'CLIENT_CREATE_FAILED'
    );
  }
};

export const updateClientCategory = async (clientId: string, category: ClientCategory): Promise<Client> => {
  const store = useCRMStore.getState();
  const client = store.clients.find(c => c.id === clientId);
  
  if (!client) {
    throw new APIError('Klant niet gevonden', 'CLIENT_NOT_FOUND');
  }

  try {
    const updated = { ...client, category, updatedAt: new Date() };
    store.updateClient(clientId, updated);
    return updated;
  } catch (error) {
    throw new APIError(
      `Categorie update mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
      'CATEGORY_UPDATE_FAILED'
    );
  }
};

/* Testscenarios:
1. addClient met ongeldige email → validatiefout
2. addClient met bestaande telefoonnummer → duplicaatfout
3. updateClientCategory voor niet-bestaande klant → not found
*/