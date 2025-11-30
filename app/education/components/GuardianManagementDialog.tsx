'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '../../components/dialog';
import { Field, Label } from '../../components/fieldset';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/table';
import { Heading } from '../../components/heading';
import { Text } from '../../components/text';
import { PencilIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/20/solid';
import { graphql } from '@/lib/graphql';

interface Guardian {
  id: string;
  guardianFullName: string;
  guardianPhone: string;
  guardianEmail?: string;
  relationshipType: string;
  isPrimaryGuardian: boolean;
  canPickup: boolean;
  canAuthorizeOthers: boolean;
  isActive: boolean;
}

interface GuardianManagementDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  institutionId: string;
}

export default function GuardianManagementDialog({
  open,
  onClose,
  studentId,
  studentName,
  institutionId,
}: GuardianManagementDialogProps) {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add guardian dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newGuardian, setNewGuardian] = useState({
    guardianFullName: '',
    guardianPhone: '',
    guardianEmail: '',
    relationshipType: '',
    isPrimaryGuardian: false,
    canPickup: true,
    canAuthorizeOthers: true,
  });

  // Edit guardian dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [guardianToEdit, setGuardianToEdit] = useState<Guardian | null>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [guardianToDelete, setGuardianToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load guardians when dialog opens
  useEffect(() => {
    if (open && studentId) {
      loadGuardians();
    }
  }, [open, studentId]);

  const loadGuardians = async () => {
    setLoading(true);
    setError(null);

    try {
      const query = `
        query GetStudentGuardians($studentId: String!) {
          getStudentGuardians(studentId: $studentId) {
            id
            guardianFullName
            guardianPhone
            guardianEmail
            relationshipType
            isPrimaryGuardian
            canPickup
            canAuthorizeOthers
            isActive
          }
        }
      `;

      const result = await graphql<{ getStudentGuardians: Guardian[] }>(query, { studentId });
      setGuardians(result.getStudentGuardians || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load guardians');
      console.error('Error loading guardians:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const mutation = `
        mutation AddGuardianRelationship($input: AddGuardianRelationshipInput!) {
          addGuardianRelationship(input: $input) {
            success
            message
          }
        }
      `;

      const input = {
        studentId,
        ...newGuardian,
        guardianEmail: newGuardian.guardianEmail || null,
        guardianPersonalAccountId: null,
        guardianIdPassportNumber: null,
      };

      const result = await graphql<{ addGuardianRelationship: { success: boolean; message: string } }>(
        mutation,
        { input }
      );

      if (result.addGuardianRelationship.success) {
        setSuccess('Guardian added successfully!');
        setTimeout(() => setSuccess(null), 3000);
        setAddDialogOpen(false);
        setNewGuardian({
          guardianFullName: '',
          guardianPhone: '',
          guardianEmail: '',
          relationshipType: '',
          isPrimaryGuardian: false,
          canPickup: true,
          canAuthorizeOthers: true,
        });
        await loadGuardians();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add guardian');
      console.error('Error adding guardian:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = (guardian: Guardian) => {
    setGuardianToEdit(guardian);
    setEditDialogOpen(true);
  };

  const handleUpdateGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardianToEdit) return;

    setLoading(true);
    setError(null);

    try {
      const mutation = `
        mutation UpdateGuardian($input: UpdateGuardianInput!) {
          updateGuardian(input: $input) {
            id
            guardianFullName
            guardianPhone
            guardianEmail
            relationshipType
            isPrimaryGuardian
            canPickup
            canAuthorizeOthers
          }
        }
      `;

      const input = {
        guardianId: guardianToEdit.id,
        guardianFullName: guardianToEdit.guardianFullName,
        guardianPhone: guardianToEdit.guardianPhone,
        guardianEmail: guardianToEdit.guardianEmail || null,
        relationshipType: guardianToEdit.relationshipType,
        isPrimaryGuardian: guardianToEdit.isPrimaryGuardian,
        canPickup: guardianToEdit.canPickup,
        canAuthorizeOthers: guardianToEdit.canAuthorizeOthers,
      };

      await graphql<{ updateGuardian: Guardian }>(mutation, { input });

      setSuccess('Guardian updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setEditDialogOpen(false);
      setGuardianToEdit(null);
      await loadGuardians();
    } catch (err: any) {
      setError(err.message || 'Failed to update guardian');
      console.error('Error updating guardian:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = (guardian: Guardian) => {
    setGuardianToDelete({
      id: guardian.id,
      name: guardian.guardianFullName,
    });
    setDeleteDialogOpen(true);
  };

  const handleDeleteGuardian = async () => {
    if (!guardianToDelete) return;

    setDeleting(true);
    setError(null);

    try {
      const mutation = `
        mutation DeleteGuardian($guardianId: String!) {
          deleteGuardian(guardianId: $guardianId) {
            success
            message
          }
        }
      `;

      const result = await graphql<{ deleteGuardian: { success: boolean; message: string } }>(mutation, {
        guardianId: guardianToDelete.id,
      });

      if (result.deleteGuardian.success) {
        setSuccess('Guardian deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
        setDeleteDialogOpen(false);
        setGuardianToDelete(null);
        await loadGuardians();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete guardian');
      console.error('Error deleting guardian:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} size="4xl">
        <DialogTitle>Manage Guardians for {studentName}</DialogTitle>
        <DialogDescription>
          View, add, edit, or delete guardians. <strong>Guardians receive automatic app access</strong> when their email matches a personal account.
        </DialogDescription>
        <DialogBody>
          {/* Important Notice - Auto-linking */}
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
            <div className="flex items-start">
              <svg
                className="mr-3 mt-0.5 size-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold">Automatic App Access for Guardians</p>
                <p className="mt-1">
                  When a guardian's email matches their personal account, they automatically receive:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 pl-2">
                  <li>App access to view student data (grades, attendance, location)</li>
                  <li>Real-time check-in/check-out notifications</li>
                  <li>Ability to authorize pickup persons</li>
                  <li>Pickup approval requests</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-200">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Add Guardian Button */}
          <div className="mb-4">
            <Button onClick={() => setAddDialogOpen(true)}>
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Add Guardian
            </Button>
          </div>

          {/* Guardians List */}
          {loading && guardians.length === 0 ? (
            <div className="py-8 text-center text-zinc-500">Loading guardians...</div>
          ) : guardians.length === 0 ? (
            <div className="py-8 text-center text-zinc-500">
              No guardians added yet. Click "Add Guardian" to add one.
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Relationship</TableHeader>
                  <TableHeader>Phone</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Primary</TableHeader>
                  <TableHeader>Can Pickup</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {guardians.map((guardian) => (
                  <TableRow key={guardian.id}>
                    <TableCell className="font-medium">{guardian.guardianFullName}</TableCell>
                    <TableCell>{guardian.relationshipType}</TableCell>
                    <TableCell>{guardian.guardianPhone}</TableCell>
                    <TableCell>{guardian.guardianEmail || '-'}</TableCell>
                    <TableCell>{guardian.isPrimaryGuardian ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{guardian.canPickup ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button type="button" plain onClick={() => handleOpenEditDialog(guardian)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button type="button" plain onClick={() => handleOpenDeleteDialog(guardian)}>
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogBody>
        <DialogActions>
          <Button plain onClick={onClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Guardian Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add Guardian</DialogTitle>
        <DialogDescription>Add a new guardian for {studentName}</DialogDescription>
        <form onSubmit={handleAddGuardian}>
          <DialogBody>
            <div className="space-y-4">
              <Field>
                <Label>Full Name *</Label>
                <Input
                  type="text"
                  value={newGuardian.guardianFullName}
                  onChange={(e) => setNewGuardian({ ...newGuardian, guardianFullName: e.target.value })}
                  required
                  disabled={loading}
                />
              </Field>
              <Field>
                <Label>Phone Number *</Label>
                <Input
                  type="tel"
                  value={newGuardian.guardianPhone}
                  onChange={(e) => setNewGuardian({ ...newGuardian, guardianPhone: e.target.value })}
                  required
                  disabled={loading}
                />
              </Field>
              <Field>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newGuardian.guardianEmail}
                  onChange={(e) => setNewGuardian({ ...newGuardian, guardianEmail: e.target.value })}
                  disabled={loading}
                />
              </Field>
              <Field>
                <Label>Relationship *</Label>
                <Input
                  type="text"
                  value={newGuardian.relationshipType}
                  onChange={(e) => setNewGuardian({ ...newGuardian, relationshipType: e.target.value })}
                  placeholder="e.g., mother, father, legal guardian"
                  required
                  disabled={loading}
                />
              </Field>
            </div>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={() => setAddDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Guardian'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Guardian Dialog */}
      <Dialog open={editDialogOpen} onClose={() => !loading && setEditDialogOpen(false)}>
        <DialogTitle>Edit Guardian</DialogTitle>
        <DialogDescription>Update guardian information</DialogDescription>
        <form onSubmit={handleUpdateGuardian}>
          <DialogBody>
            {guardianToEdit && (
              <div className="space-y-4">
                <Field>
                  <Label>Full Name *</Label>
                  <Input
                    type="text"
                    value={guardianToEdit.guardianFullName}
                    onChange={(e) =>
                      setGuardianToEdit({ ...guardianToEdit, guardianFullName: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    value={guardianToEdit.guardianPhone}
                    onChange={(e) => setGuardianToEdit({ ...guardianToEdit, guardianPhone: e.target.value })}
                    required
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={guardianToEdit.guardianEmail || ''}
                    onChange={(e) => setGuardianToEdit({ ...guardianToEdit, guardianEmail: e.target.value })}
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <Label>Relationship *</Label>
                  <Input
                    type="text"
                    value={guardianToEdit.relationshipType}
                    onChange={(e) =>
                      setGuardianToEdit({ ...guardianToEdit, relationshipType: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </Field>
              </div>
            )}
          </DialogBody>
          <DialogActions>
            <Button plain onClick={() => setEditDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Guardian'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Guardian</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete <strong>{guardianToDelete?.name}</strong>? This action cannot be undone.
        </DialogDescription>
        <DialogActions>
          <Button plain onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteGuardian} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Guardian'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
