// crewTypes.ts

export enum CrewRole {
  DJ = 'DJ',
  TECHNICIAN = 'TECHNICIAN',
  DRIVER = 'DRIVER',
  SETUP_CREW = 'SETUP_CREW',
}

export enum ShiftStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TimeApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface CrewMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: CrewRole;
  skills: string[];
  availability: string[];
  rate: number;
}

export interface Shift {
  id: string;
  projectId: string;
  crewMemberId: string;
  date: string;
  startTime: string;
  endTime: string;
  role: CrewRole;
  status: ShiftStatus;
}

export interface TimeApproval {
  id: string;
  shiftId: string;
  submittedHours: number;
  actualHours: number;
  status: TimeApprovalStatus;
  notes?: string;
}

// Optional: Type guards for runtime validation
export function isCrewMember(obj: any): obj is CrewMember {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}

export function isValidShiftStatus(status: string): status is ShiftStatus {
  return Object.values(ShiftStatus).includes(status as ShiftStatus);
}
