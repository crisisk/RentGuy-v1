import { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectStore } from '@/stores/projectStore';
import { Project } from '@/types/project';
import { observer } from 'mobx-react-lite';
import { Loader } from '@/components/ui/Loader';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { Timeline } from '@/components/Timeline';
import { DataTable } from '@/components/DataTable';
import { Textarea } from '@/components/ui/Textarea';

const ProjectDetails: FC = observer(() => {
  const { projectId } = useParams<{ projectId: string }>();
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        const data = await projectStore.fetchProject(projectId!);
        setProject(data);
        setNotes(data.notes);
      } catch (err) {
        setError('Failed to load project details');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const handleSaveNotes = async () => {
    try {
      await projectStore.updateProjectNotes(projectId!, notes);
      setEditMode(false);
    } catch (err) {
      setError('Failed to save notes');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive" title="Error" message={error} />
      </div>
    );
  }

  if (!project) {
    return <div className="container mx-auto p-4">Project not found</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-gray-500 mt-2">
            {format(new Date(project.startDate), 'MMM dd, yyyy')} -{' '}
            {format(new Date(project.endDate), 'MMM dd, yyyy')}
          </p>
        </div>
        <Button variant={editMode ? 'destructive' : 'outline'} onClick={() => setEditMode(!editMode)}>
          {editMode ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">Project Timeline</h2>
            <Timeline events={project.timeline} />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 flex justify-between items-center">
              Notes
              {editMode && (
                <Button size="sm" onClick={handleSaveNotes}>
                  Save Notes
                </Button>
              )}
            </h2>
            {editMode ? (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[200px]"
              />
            ) : (
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                {project.notes || 'No notes available'}
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">Crew Assignments</h2>
            <DataTable
              columns={[
                { header: 'Name', accessor: 'name' },
                { header: 'Role', accessor: 'role' },
                { header: 'Hours', accessor: 'hours' },
              ]}
              data={project.crewAssignments}
            />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Equipment List</h2>
            <DataTable
              columns={[
                { header: 'Equipment', accessor: 'name' },
                { header: 'Quantity', accessor: 'quantity' },
                { header: 'Status', accessor: 'status' },
              ]}
              data={project.equipmentList}
            />
          </section>
        </div>
      </div>
    </div>
  );
});

export default ProjectDetails;
