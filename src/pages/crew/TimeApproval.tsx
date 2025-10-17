// TimeApproval.tsx
import { useState, useEffect } from 'react';
import { crewStore } from 'src/stores/crewStore';
import { uiStore } from 'src/stores/uiStore';
import { TimeApproval } from 'src/stores/types'; // Assuming this type exists in store types
import { LoadingSpinner } from 'src/components/common/LoadingSpinner'; // Assuming a generic loading component
import { ExclamationCircleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export const TimeApproval = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<TimeApproval[]>([]);

  // Fetch initial data
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        setIsLoading(true);
        const data = await crewStore.loadTimeApprovals();
        setSubmissions(data);
      } catch (err) {
        setError('Failed to load time submissions');
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmissions();
  }, []);

  const handleApprovalAction = async (submissionId: string, isApproval: boolean) => {
    try {
      setIsLoading(true);
      if (isApproval) {
        await crewStore.approveTimeEntry(submissionId);
      } else {
        await crewStore.rejectTimeEntry(submissionId);
      }
      // Refresh submissions list after action
      const updatedData = await crewStore.loadTimeApprovals();
      setSubmissions(updatedData);
      uiStore.addNotification({
        type: 'success',
        message: `Time entry ${isApproval ? 'approved' : 'rejected'} successfully`,
      });
    } catch (err) {
      uiStore.addNotification({
        type: 'error',
        message: `Failed to ${isApproval ? 'approve' : 'reject'} time entry`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderHoursDifference = (difference: number) => (
    <span className={`font-medium ${difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
      {difference > 0 ? '+' : ''}{difference}h
    </span>
  );

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg flex items-center gap-3">
        <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pending Time Approvals</h1>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          {submissions.length === 0 ? (
            <div className="p-6 text-gray-500 text-center">No pending submissions</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crew Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours Worked</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            className="h-8 w-8 rounded-full"
                            src={submission.user.avatar}
                            alt={submission.user.name}
                          />
                          <div className="ml-3">
                            <div className="font-medium">{submission.user.name}</div>
                            <div className="text-sm text-gray-500">{submission.user.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(submission.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.hoursWorked}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {renderHoursDifference(submission.hoursDifference)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        <button
                          onClick={() => handleApprovalAction(submission.id, true)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          disabled={isLoading}
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApprovalAction(submission.id, false)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                          disabled={isLoading}
                        >
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
