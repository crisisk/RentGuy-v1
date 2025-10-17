// UserManagement.tsx
import React, { useEffect, useState } from 'react';
import { adminStore } from '@/stores/adminStore';
import { User, UserRole } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FiEdit, FiTrash2, FiUserPlus } from 'react-icons/fi';
import { format } from 'date-fns';

const UserManagement: React.FC = () => {
  const { users, loading, error, loadUsers } = adminStore();
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  
  // Load users on component mount
  useEffect(() => {
    if (users.length === 0) {
      loadUsers().catch((err) => console.error('Failed to load users:', err));
    }
    setLocalUsers(users);
  }, [users, loadUsers]);

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'MANAGER':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleEditUser = (userId: string) => {
    // Implement edit logic
    console.log('Edit user:', userId);
  };

  const handleDeleteUser = (userId: string) => {
    // Implement delete logic
    console.log('Delete user:', userId);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error Loading Users</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">User Management</h1>
        <Button>
          <FiUserPlus className="mr-2" />
          Create User
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <Table className="border-collapse w-full">
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="py-4 px-6">Name</TableHead>
              <TableHead className="py-4 px-6">Email</TableHead>
              <TableHead className="py-4 px-6">Role</TableHead>
              <TableHead className="py-4 px-6">Last Login</TableHead>
              <TableHead className="py-4 px-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-gray-50">
                <TableCell className="py-4 px-6 font-medium">{user.name}</TableCell>
                <TableCell className="py-4 px-6">{user.email}</TableCell>
                <TableCell className="py-4 px-6">
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 px-6">
                  {user.lastLogin ? 
                    format(new Date(user.lastLogin), 'PPpp') : 
                    'Never logged in'}
                </TableCell>
                <TableCell className="py-4 px-6 text-right space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditUser(user.id)}
                  >
                    <FiEdit className="text-gray-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <FiTrash2 className="text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default UserManagement;

// Type definitions
declare module '@/types/user' {
  export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    lastLogin?: string;
  }

  export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';
}
