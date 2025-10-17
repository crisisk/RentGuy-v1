import { useEffect, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import crewStore from '@/stores/crewStore';
import { CrewMember, AvailabilityStatus } from '@/types/crew';
import { Combobox, Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon, PlusIcon } from '@heroicons/react/20/solid';
import { Spinner } from '@/components/common/Spinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { Modal } from '@/components/common/Modal';
import { format, parseISO } from 'date-fns';

interface AssignmentForm {
  shiftDate: string;
  shiftType: 'day' | 'night';
  selectedMemberId: string | null;
}

const CrewManagement: React.FC = observer(() => {
  const { crewMembers, isLoading, error, loadCrew, assignToShift } = crewStore;
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityStatus>('available');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>({
    shiftDate: format(new Date(), 'yyyy-MM-dd'),
    shiftType: 'day',
    selectedMemberId: null,
  });

  // Load crew data on component mount
  useEffect(() => {
    loadCrew();
  }, [loadCrew]);

  // Filter crew members based on selected criteria
  const filteredMembers = useCallback(() => {
    return crewMembers.filter(member => {
      const skillMatch = selectedSkills.length === 0 || 
        selectedSkills.every(skill => member.skills.includes(skill));
      const availabilityMatch = member.availability.status === availabilityFilter;
      return skillMatch && availabilityMatch;
    });
  }, [crewMembers, selectedSkills, availabilityFilter]);

  // Available skills from all crew members
  const allSkills = Array.from(new Set(crewMembers.flatMap(member => member.skills)));

  const handleAssignmentSubmit = async () => {
    if (assignmentForm.selectedMemberId) {
      await assignToShift(
        assignmentForm.selectedMemberId,
        parseISO(assignmentForm.shiftDate),
        assignmentForm.shiftType
      );
      setIsModalOpen(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center"><Spinner size="lg" /></div>;
  if (error) return <ErrorAlert message={error} className="m-4" />;

  return (
    <div className="p-4 space-y-6">
      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Listbox
          as="div"
          value={availabilityFilter}
          onChange={setAvailabilityFilter}
          className="relative"
        >
          <Listbox.Button className="w-full p-2 border rounded-md">
            {availabilityFilter}
            <ChevronUpDownIcon className="w-5 h-5 float-right" />
          </Listbox.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Listbox.Options className="absolute w-full mt-1 bg-white border rounded-md shadow-lg">
              {Object.values(AvailabilityStatus).map(status => (
                <Listbox.Option
                  key={status}
                  value={status}
                  className={({ active }) => `p-2 cursor-pointer ${active ? 'bg-blue-50' : ''}`}
                >
                  {status}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </Listbox>

        <Combobox
          as="div"
          value={selectedSkills}
          onChange={setSelectedSkills}
          multiple
          className="relative"
        >
          <Combobox.Input
            placeholder="Select skills..."
            className="w-full p-2 border rounded-md"
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="w-5 h-5" />
          </Combobox.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Combobox.Options className="absolute w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {allSkills.map(skill => (
                <Combobox.Option
                  key={skill}
                  value={skill}
                  className={({ active }) => `p-2 cursor-pointer ${active ? 'bg-blue-50' : ''}`}
                >
                  {({ selected }) => (
                    <div className="flex items-center">
                      {selected && <CheckIcon className="w-5 h-5 mr-2 text-blue-600" />}
                      {skill}
                    </div>
                  )}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          </Transition>
        </Combobox>
      </div>

      {/* Crew Data Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Role', 'Skills', 'Availability', 'Rate', ''].map((header, idx) => (
                <th
                  key={idx}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMembers().map(member => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">{member.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{member.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {member.skills.map(skill => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    member.availability.status === 'available'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {member.availability.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">${member.rate}/hr</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => {
                      setAssignmentForm(f => ({ ...f, selectedMemberId: member.id }));
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assignment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign to Shift"
        actions={[
          { label: 'Cancel', onClick: () => setIsModalOpen(false), variant: 'secondary' },
          { label: 'Assign', onClick: handleAssignmentSubmit },
        ]}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Shift Date</label>
            <input
              type="date"
              value={assignmentForm.shiftDate}
              onChange={e => setAssignmentForm(f => ({ ...f, shiftDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Shift Type</label>
            <select
              value={assignmentForm.shiftType}
              onChange={e => setAssignmentForm(f => ({
                ...f,
                shiftType: e.target.value as 'day' | 'night'
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="day">Day Shift</option>
              <option value="night">Night Shift</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
});

export default CrewManagement;
