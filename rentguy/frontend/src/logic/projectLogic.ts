import { Project, ProjectStatus } from '../types/projectTypes';
import { useProjectStore } from '../stores/projectStore';
import { z } from 'zod';
import { APIError } from '../errors';

/**
 * Project validation schema using Zod
 */
const ProjectSchema = z.object({
  title: z.string().min(1, 'Titel is verplicht'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Klant is verplicht'),
  startDate: z.date(),
  endDate: z.date().optional(),
  budget: z.number().min(0, 'Budget mag niet negatief zijn').optional(),
});

/**
 * Validates project fields against business rules
 * @throws {Error} With validation message in Dutch
 */
const validateProjectFields = (project: Partial<Project>) => {
  try {
    ProjectSchema.parse(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message);
    }
    throw new Error('Ongeldige projectgegevens');
  }
};

/**
 * Creates a new project with validation and state management
 * @returns {Promise<Project>} The created project
 * @throws {APIError} If creation fails
 */
export const createProject = async (projectData: Partial<Project>): Promise<Project> => {
  const store = useProjectStore.getState();
  
  try {
    // Validate input
    validateProjectFields(projectData);
    
    // Check for duplicate title
    const exists = store.projects.find(p => p.title === projectData.title);
    if (exists) {
      throw new Error('Er bestaat al een project met deze titel');
    }

    // Generate mock ID for demonstration
    const newProject: Project = {
      ...projectData as Project,
      id: `proj-${Date.now()}`,
      status: ProjectStatus.NIEUW,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Simulate API call
    store.addProject(newProject);
    return newProject;
  } catch (error) {
    throw new APIError(
      'Project aanmaken mislukt: ' + (error instanceof Error ? error.message : 'Onbekende fout'),
      'PROJECT_CREATE_FAILED'
    );
  }
};

/**
 * Updates an existing project with validation
 * @throws {APIError} If update fails
 */
export const updateProject = async (projectId: string, updateData: Partial<Project>): Promise<Project> => {
  const store = useProjectStore.getState();
  
  try {
    validateProjectFields(updateData);
    
    const existing = store.projects.find(p => p.id === projectId);
    if (!existing) {
      throw new Error('Project niet gevonden');
    }

    const updatedProject = { ...existing, ...updateData, updatedAt: new Date() };
    store.updateProject(projectId, updatedProject);
    return updatedProject;
  } catch (error) {
    throw new APIError(
      `Project update mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
      'PROJECT_UPDATE_FAILED'
    );
  }
};

/**
 * Changes project status with validation
 * @throws {APIError} For invalid status transitions
 */
export const changeProjectStatus = async (projectId: string, newStatus: ProjectStatus): Promise<Project> => {
  const store = useProjectStore.getState();
  const project = store.projects.find(p => p.id === projectId);
  
  if (!project) {
    throw new APIError('Project niet gevonden', 'PROJECT_NOT_FOUND');
  }

  const allowedTransitions: Record<ProjectStatus, ProjectStatus[]> = {
    [ProjectStatus.NIEUW]: [ProjectStatus.ACTIEF, ProjectStatus.GEANNULEERD],
    [ProjectStatus.ACTIEF]: [ProjectStatus.AFGEROND, ProjectStatus.GEPAUZEERD],
    [ProjectStatus.GEPAUZEERD]: [ProjectStatus.ACTIEF, ProjectStatus.GEANNULEERD],
    [ProjectStatus.AFGEROND]: [],
    [ProjectStatus.GEANNULEERD]: [],
  };

  if (!allowedTransitions[project.status].includes(newStatus)) {
    throw new APIError('Ongeldige statusovergang', 'INVALID_STATUS_TRANSITION');
  }

  try {
    return await updateProject(projectId, { status: newStatus });
  } catch (error) {
    throw new APIError(
      `Status update mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
      'STATUS_UPDATE_FAILED'
    );
  }
};

/* Testscenarios:
1. createProject met lege titel → gooit fout
2. createProject met bestaande titel → duplicaatfout
3. updateProject met negatief budget → validatiefout
4. changeProjectStatus van Nieuw naar Geannuleerd → succes
5. changeProjectStatus van Afgerond naar Actief → fout
*/