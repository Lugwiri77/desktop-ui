'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '../../components/dialog';
import { Field, Label } from '../../components/fieldset';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/table';
import { PencilIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/20/solid';
import { graphql } from '@/lib/graphql';

interface NextOfKin {
  id: string;
  guardianFullName: string;
  guardianPhone: string;
  guardianEmail?: string;
  relationshipType: string;
  isPrimaryGuardian: boolean;
  isActive: boolean;
}

interface NextOfKinManagementDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  institutionId: string;
}

export default function NextOfKinManagementDialog({
  open,
  onClose,
  studentId,
  studentName,
  institutionId,
}: NextOfKinManagementDialogProps) {
  const [nextOfKinList, setNextOfKinList] = useState<NextOfKin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add next of kin dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newNextOfKin, setNewNextOfKin] = useState({
    guardianFullName: '',
    guardianPhone: '',
    guardianEmail: '',
    relationshipType: '',
    isPrimaryGuardian: false,
  });

  // Edit next of kin dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [nextOfKinToEdit, setNextOfKinToEdit] = useState<NextOfKin | null>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nextOfKinToDelete, setNextOfKinToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load next of kin when dialog opens
  useEffect(() => {
    if (open && studentId) {
      loadNextOfKin();
    }
  }, [open, studentId]);

  const loadNextOfKin = async () => {
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
            isActive
          }
        }
      `;

      const result = await graphql<{ getStudentGuardians: NextOfKin[] }>(query, { studentId });
      setNextOfKinList(result.getStudentGuardians || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load next of kin');
      console.error('Error loading next of kin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNextOfKin = async (e: React.FormEvent) => {
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
        ...newNextOfKin,
        guardianEmail: newNextOfKin.guardianEmail || null,
        guardianPersonalAccountId: null,
        guardianIdPassportNumber: null,
        canPickup: false, // University students don't have pickup system
        canAuthorizeOthers: false,
      };

      const result = await graphql<{ addGuardianRelationship: { success: boolean; message: string } }>(
        mutation,
        { input }
      );

      if (result.addGuardianRelationship.success) {
        setSuccess('Next of Kin added successfully!');
        setTimeout(() => setSuccess(null), 3000);
        setAddDialogOpen(false);
        setNewNextOfKin({
          guardianFullName: '',
          guardianPhone: '',
          guardianEmail: '',
          relationshipType: '',
          isPrimaryGuardian: false,
        });
        await loadNextOfKin();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add next of kin');
      console.error('Error adding next of kin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = (nextOfKin: NextOfKin) => {
    setNextOfKinToEdit(nextOfKin);
    setEditDialogOpen(true);
  };

  const handleUpdateNextOfKin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextOfKinToEdit) return;

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
          }
        }
      `;

      const input = {
        guardianId: nextOfKinToEdit.id,
        guardianFullName: nextOfKinToEdit.guardianFullName,
        guardianPhone: nextOfKinToEdit.guardianPhone,
        guardianEmail: nextOfKinToEdit.guardianEmail || null,
        relationshipType: nextOfKinToEdit.relationshipType,
        isPrimaryGuardian: nextOfKinToEdit.isPrimaryGuardian,
        canPickup: false,
        canAuthorizeOthers: false,
      };

      await graphql<{ updateGuardian: NextOfKin }>(mutation, { input });

      setSuccess('Next of Kin updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setEditDialogOpen(false);
      setNextOfKinToEdit(null);
      await loadNextOfKin();
    } catch (err: any) {
      setError(err.message || 'Failed to update next of kin');
      console.error('Error updating next of kin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = (nextOfKin: NextOfKin) => {
    setNextOfKinToDelete({
      id: nextOfKin.id,
      name: nextOfKin.guardianFullName,
    });
    setDeleteDialogOpen(true);
  };

  const handleDeleteNextOfKin = async () => {
    if (!nextOfKinToDelete) return;

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
        guardianId: nextOfKinToDelete.id,
      });

      if (result.deleteGuardian.success) {
        setSuccess('Next of Kin deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
        setDeleteDialogOpen(false);
        setNextOfKinToDelete(null);
        await loadNextOfKin();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete next of kin');
      console.error('Error deleting next of kin:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} size="4xl">
        <DialogTitle>Manage Next of Kin for {studentName}</DialogTitle>
        <DialogDescription>
          Next of Kin are <strong>emergency contacts only</strong> for university/college students. They do NOT receive app access or pickup permissions.
        </DialogDescription>
        <DialogBody>
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

          {/* Important Notice */}
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
                <p className="font-semibold">University/College Students - Emergency Contact Only</p>
                <p className="mt-1">
                  Next of Kin are for emergency situations only. They will NOT receive app access, notifications, or pickup permissions. University students are adults and manage their own accounts.
                </p>
              </div>
            </div>
          </div>

          {/* Add Next of Kin Button */}
          <div className="mb-4">
            <Button onClick={() => setAddDialogOpen(true)}>
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Add Next of Kin
            </Button>
          </div>

          {/* Next of Kin List */}
          {loading && nextOfKinList.length === 0 ? (
            <div className="py-8 text-center text-zinc-500">Loading next of kin...</div>
          ) : nextOfKinList.length === 0 ? (
            <div className="py-8 text-center text-zinc-500">
              No next of kin added yet. Click "Add Next of Kin" to add one.
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
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {nextOfKinList.map((nok) => (
                  <TableRow key={nok.id}>
                    <TableCell className="font-medium">{nok.guardianFullName}</TableCell>
                    <TableCell>{nok.relationshipType}</TableCell>
                    <TableCell>{nok.guardianPhone}</TableCell>
                    <TableCell>{nok.guardianEmail || '-'}</TableCell>
                    <TableCell>{nok.isPrimaryGuardian ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button type="button" plain onClick={() => handleOpenEditDialog(nok)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button type="button" plain onClick={() => handleOpenDeleteDialog(nok)}>
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

      {/* Add Next of Kin Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add Next of Kin</DialogTitle>
        <DialogDescription>Add emergency contact for {studentName}. They will NOT receive app access.</DialogDescription>
        <form onSubmit={handleAddNextOfKin}>
          <DialogBody>
            <div className="space-y-4">
              <Field>
                <Label>Full Name *</Label>
                <Input
                  type="text"
                  value={newNextOfKin.guardianFullName}
                  onChange={(e) => setNewNextOfKin({ ...newNextOfKin, guardianFullName: e.target.value })}
                  required
                  disabled={loading}
                />
              </Field>
              <Field>
                <Label>Phone Number *</Label>
                <Input
                  type="tel"
                  value={newNextOfKin.guardianPhone}
                  onChange={(e) => setNewNextOfKin({ ...newNextOfKin, guardianPhone: e.target.value })}
                  required
                  disabled={loading}
                />
              </Field>
              <Field>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newNextOfKin.guardianEmail}
                  onChange={(e) => setNewNextOfKin({ ...newNextOfKin, guardianEmail: e.target.value })}
                  disabled={loading}
                />
              </Field>
              <Field>
                <Label>Relationship *</Label>
                <Input
                  type="text"
                  value={newNextOfKin.relationshipType}
                  onChange={(e) => setNewNextOfKin({ ...newNextOfKin, relationshipType: e.target.value })}
                  placeholder="e.g., parent, sibling, spouse"
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
              {loading ? 'Adding...' : 'Add Next of Kin'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Next of Kin Dialog */}
      <Dialog open={editDialogOpen} onClose={() => !loading && setEditDialogOpen(false)}>
        <DialogTitle>Edit Next of Kin</DialogTitle>
        <DialogDescription>Update emergency contact information</DialogDescription>
        <form onSubmit={handleUpdateNextOfKin}>
          <DialogBody>
            {nextOfKinToEdit && (
              <div className="space-y-4">
                <Field>
                  <Label>Full Name *</Label>
                  <Input
                    type="text"
                    value={nextOfKinToEdit.guardianFullName}
                    onChange={(e) =>
                      setNextOfKinToEdit({ ...nextOfKinToEdit, guardianFullName: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    value={nextOfKinToEdit.guardianPhone}
                    onChange={(e) => setNextOfKinToEdit({ ...nextOfKinToEdit, guardianPhone: e.target.value })}
                    required
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={nextOfKinToEdit.guardianEmail || ''}
                    onChange={(e) => setNextOfKinToEdit({ ...nextOfKinToEdit, guardianEmail: e.target.value })}
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <Label>Relationship *</Label>
                  <Input
                    type="text"
                    value={nextOfKinToEdit.relationshipType}
                    onChange={(e) =>
                      setNextOfKinToEdit({ ...nextOfKinToEdit, relationshipType: e.target.value })
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
              {loading ? 'Updating...' : 'Update Next of Kin'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Next of Kin</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete <strong>{nextOfKinToDelete?.name}</strong>? This action cannot be undone.
        </DialogDescription>
        <DialogActions>
          <Button plain onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteNextOfKin} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Next of Kin'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
