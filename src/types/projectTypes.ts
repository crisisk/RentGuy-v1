export enum ProjectType {
  WEDDING = "WEDDING",
  CORPORATE = "CORPORATE",
  PRIVATE = "PRIVATE",
  FESTIVAL = "FESTIVAL",
}

export enum ProjectStatus {
  QUOTE = "QUOTE",
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum EventType {
  CEREMONY = "CEREMONY",
  COCKTAIL = "COCKTAIL",
  DINNER = "DINNER",
  PARTY = "PARTY",
  BREAKDOWN = "BREAKDOWN",
}

export interface Project {
  id: string;
  name: string;
  customerId: string;
  type: ProjectType;
  date: string;
  venue: Venue;
  status: ProjectStatus;
  equipment: Equipment[];
  crew: string[];
  budget: number;
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  projectId: string;
  type: EventType;
  date: string;
  time: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface Venue {
  name: string;
  address: string;
  city: string;
  contactPerson: string;
  phone: string;
  notes?: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  quantity: number;
  status: string;
}
