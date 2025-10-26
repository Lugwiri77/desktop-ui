'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApplicationLayout } from '../components/application-layout';
import { Heading } from '../components/heading';
import { Text } from '../components/text';
import { Button } from '../components/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/table';
import { Badge } from '../components/badge';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '../components/dialog';
import { Field, Label } from '../components/fieldset';
import { Input } from '../components/input';
import { Textarea } from '../components/textarea';
import { isAuthenticated, post, put, del } from '@/lib/api';
import { getDepartments, type Department as GraphQLDepartment } from '@/lib/graphql';
import {
  loadUserInfo,
  isAdministrator,
  getUserRoleDisplayName,
  UserInfo,
} from '@/lib/roles';

interface Department {
  id: string;
  organization_id: string;
  account_type: string;
  name: string;
  description?: string;
  manager_id?: string;
  manager_name?: string;
  parent_department_id?: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface DepartmentWithStats extends Department {
  staff_count: number;
}

interface DepartmentListResponse {
  status: string;
  departments: DepartmentWithStats[];
}

export default function DepartmentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentWithStats | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager_id: '',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const info = loadUserInfo();
    if (!info) {
      router.push('/login');
      return;
    }

    if (!isAdministrator(info.userRole)) {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
  }, [router]);

  const { data: departmentsData, isLoading } = useQuery<GraphQLDepartment[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      return await getDepartments();
    },
    enabled: !!userInfo,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; manager_id?: string }) => {
      return await post('/auth/departments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setSuccess('Department created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create department');
      setTimeout(() => setError(''), 5000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await put(`/auth/departments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setSuccess('Department updated successfully');
      setIsEditDialogOpen(false);
      setSelectedDepartment(null);
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update department');
      setTimeout(() => setError(''), 5000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await del(`/auth/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setSuccess('Department deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to delete department');
      setTimeout(() => setError(''), 5000);
    },
  });

  const handleLogout = async () => {
    localStorage.clear();
    router.push('/login');
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', manager_id: '' });
  };

  const handleCreateDepartment = () => {
    if (!formData.name.trim()) {
      setError('Department name is required');
      setTimeout(() => setError(''), 3000);
      return;
    }
    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      manager_id: formData.manager_id || undefined,
    });
  };

  const handleEditDepartment = () => {
    if (!selectedDepartment) return;
    if (!formData.name.trim()) {
      setError('Department name is required');
      setTimeout(() => setError(''), 3000);
      return;
    }
    updateMutation.mutate({
      id: selectedDepartment.id,
      data: {
        name: formData.name !== selectedDepartment.name ? formData.name : undefined,
        description: formData.description !== (selectedDepartment.description || '') ? formData.description : undefined,
      },
    });
  };

  const openEditDialog = (department: DepartmentWithStats) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || '',
      manager_id: department.manager_id || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteDepartment = (department: DepartmentWithStats) => {
    if (department.is_default) {
      setError('Cannot delete default departments');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (confirm(`Are you sure you want to delete "${department.name}"?`)) {
      deleteMutation.mutate(department.id);
    }
  };

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const isAdmin = isAdministrator(userInfo.userRole);
  const roleDisplayName = getUserRoleDisplayName(userInfo.userRole);
  const layoutUserInfo = {
    username: userInfo.username,
    email: userInfo.email,
    profilePicUrl: userInfo.profilePicUrl,
    logoUrl: userInfo.logoUrl,
    organizationName: userInfo.organizationName,
    accountType: userInfo.accountType,
    organizationType: userInfo.organizationType,
    isAdministrator: isAdmin,
  };

  return (
    <ApplicationLayout
      userInfo={layoutUserInfo}
      onLogout={handleLogout}
      roleDisplayName={roleDisplayName}
      isAdmin={isAdmin}
    >
      <div className="max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Heading>Departments</Heading>
            <Text className="mt-2">Manage organizational departments</Text>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Create Department</Button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
            {success}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-gray-600">Loading departments...</div>
          </div>
        ) : (
          <div className="rounded-lg bg-white shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Description</TableHeader>
                  <TableHeader>Manager</TableHeader>
                  <TableHeader>Staff</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {departmentsData?.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">
                      {dept.name}
                      {dept.isDefault && <Badge color="blue" className="ml-2">Default</Badge>}
                    </TableCell>
                    <TableCell>{dept.description || <span className="text-gray-400">-</span>}</TableCell>
                    <TableCell><span className="text-gray-400">Not available via GraphQL</span></TableCell>
                    <TableCell>{dept.staffCount}</TableCell>
                    <TableCell>
                      {dept.isActive ? <Badge color="green">Active</Badge> : <Badge color="red">Inactive</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button onClick={() => openEditDialog(dept as any)} outline className="text-xs">Edit</Button>
                        {!dept.isDefault && (
                          <Button onClick={() => handleDeleteDepartment(dept as any)} outline className="text-xs text-red-600">Delete</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={isCreateDialogOpen} onClose={setIsCreateDialogOpen}>
          <DialogTitle>Create New Department</DialogTitle>
          <DialogDescription>Add a new department to your organization</DialogDescription>
          <DialogBody>
            <div className="space-y-4">
              <Field>
                <Label>Department Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Human Resources"
                />
              </Field>
              <Field>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </Field>
            </div>
          </DialogBody>
          <DialogActions>
            <Button outline onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreateDepartment} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={isEditDialogOpen} onClose={setIsEditDialogOpen}>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>Update department information</DialogDescription>
          <DialogBody>
            <div className="space-y-4">
              <Field>
                <Label>Department Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={selectedDepartment?.is_default}
                />
                {selectedDepartment?.is_default && (
                  <Text className="text-xs text-gray-500 mt-1">Default departments cannot be renamed</Text>
                )}
              </Field>
              <Field>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </Field>
            </div>
          </DialogBody>
          <DialogActions>
            <Button outline onClick={() => { setIsEditDialogOpen(false); setSelectedDepartment(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleEditDepartment} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ApplicationLayout>
  );
}
