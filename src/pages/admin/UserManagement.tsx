import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../core/storage'
import adminStore, { AdminUser } from '../../stores/adminStore'

const UserManagement: React.FC = () => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const users = adminStore((state) => state.users)
  const loading = adminStore((state) => state.loading)
  const error = adminStore((state) => state.error)
  const loadUsers = adminStore((state) => state.loadUsers)
  const deleteUser = adminStore((state) => state.deleteUser)

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const handleDeleteConfirm = async () => {
    if (selectedUserId) {
      try {
        await deleteUser(selectedUserId)
        setShowConfirmDelete(false)
        await loadUsers()
      } catch {
        // Error is handled by the store state
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" data-testid="user-management-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg"
        data-testid="user-management-error"
      >
        {error}
      </div>
    )
  }

  return (
    <div className="p-6" data-testid="user-management-root">
      <div className="overflow-x-auto" data-testid="user-management-table-wrapper">
        <table className="min-w-full divide-y divide-gray-200" data-testid="user-management-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user: AdminUser) => (
              <tr key={user.id} data-testid={`user-management-row-${user.id}`}>
                <td
                  className="px-6 py-4 whitespace-nowrap"
                  data-testid={`user-management-name-${user.id}`}
                >
                  {user.name}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap"
                  data-testid={`user-management-email-${user.id}`}
                >
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'editor'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                    data-testid={`user-management-role-${user.id}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap"
                  data-testid={`user-management-created-${user.id}`}
                >
                  {formatDate(user.createdAt, { year: 'numeric', month: 'long', day: '2-digit' })}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap space-x-2"
                  data-testid={`user-management-actions-${user.id}`}
                >
                  <Link
                    to={`/admin/users/${user.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900"
                    data-testid={`user-management-edit-${user.id}`}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedUserId(user.id)
                      setShowConfirmDelete(true)
                    }}
                    className="text-red-600 hover:text-red-900"
                    data-testid={`user-management-delete-${user.id}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showConfirmDelete && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          data-testid="user-management-delete-modal"
        >
          <div className="bg-white p-6 rounded-lg" data-testid="user-management-delete-dialog">
            <p className="mb-4" data-testid="user-management-delete-message">
              Are you sure you want to delete this user?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 border rounded-lg"
                data-testid="user-management-delete-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                data-testid="user-management-delete-confirm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
