import { CrewMember, CrewRole } from '../types/crewTypes';
import { useCrewStore } from '../stores/crewStore';
import { z } from 'zod';
import { APIError } from '../errors';

const CrewSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  email: z.string().email('Ongeldig e-mailadres'),
  phone: z.string().regex(/^\+?[0-9]{9,13}$/, 'Ongeldig telefoonnummer'),
  role: z.nativeEnum(CrewRole),
  hourlyRate: z.number().min(15, 'Uurtarief moet minimaal €15 zijn'),
});

export const validateCrewMember = (member: Partial<CrewMember>) => {
  try {
    CrewSchema.parse(member);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message);
    }
    throw new Error('Ongeldige bemanningsgegevens');
  }
};

export const createCrewMember = async (memberData: Partial<CrewMember>): Promise<CrewMember> => {
  const store = useCrewStore.getState();
  
  try {
    validateCrewMember(memberData);
    
    // Check duplicate contact info
    const exists = store.crewMembers.some(m => 
      m.email === memberData.email || m.phone === memberData.phone
    );
    
    if (exists) {
      throw new Error('Bemanningslid met deze contactgegevens bestaat al');
    }

    const newMember: CrewMember = {
      ...memberData as CrewMember,
      id: `crew-${Date.now()}`,
      available: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.addCrewMember(newMember);
    return newMember;
  } catch (error) {
    throw new APIError(
      `Bemanningslid toevoegen mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
      'CREW_CREATE_FAILED'
    );
  }
};

export const updateCrewAvailability = async (memberId: string, available: boolean): Promise<CrewMember> => {
  const store = useCrewStore.getState();
  const member = store.crewMembers.find(m => m.id === memberId);
  
  if (!member) {
    throw new APIError('Bemanningslid niet gevonden', 'CREW_NOT_FOUND');
  }

  try {
    const updated = { ...member, available, updatedAt: new Date() };
    store.updateCrewMember(memberId, updated);
    return updated;
  } catch (error) {
    throw new APIError(
      `Beschikbaarheid update mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
      'AVAILABILITY_UPDATE_FAILED'
    );
  }
};

/* Testscenarios:
1. createCrewMember met ongeldig telefoonnummer → fout
2. createCrewMember met bestaande email → duplicaatfout
3. updateCrewAvailability voor niet-bestaand lid → not found
4. updateCrewAvailability succesvol → status wijzigt
*/