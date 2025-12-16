'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApplicationLayout } from '../../components/application-layout';
import { isAuthenticated, loadUserInfo, isAdministrator, getUserRoleDisplayName, isEducationInstitution, AccountType, type UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { getInstitutionClasses, getClassTimetable, getTeacherTimetable, addTimetableSlot, graphql } from '@/lib/education-api';
import { ADD_TIMETABLE_SLOT, DELETE_TIMETABLE_SLOT } from '@/lib/education-api';
import type { InstitutionClass, TimetableSlot, DayOfWeek, AddTimetableSlotInput } from '@/types/education';
import { Button } from '@/app/components/button';
import { Select } from '@/app/components/select';
import { Dialog, DialogTitle, DialogBody, DialogActions } from '@/app/components/dialog';
import { Field, Label } from '@/app/components/fieldset';
import { Input } from '@/app/components/input';
import { Badge } from '@/app/components/badge';
import { toast } from 'sonner';
import { PlusIcon, TrashIcon } from '@heroicons/react/20/solid';

export default function TimetablePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: DayOfWeek; time: string } | null>(null);

  // Institutional type check
  const isPrimaryOrSecondary = userInfo?.educationalInstitutionSubcategory === 'Primary' ||
                               userInfo?.educationalInstitutionSubcategory === 'PrimarySchool' ||
                               userInfo?.educationalInstitutionSubcategory === 'Secondary' ||
                               userInfo?.educationalInstitutionSubcategory === 'SecondarySchool';

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const info = loadUserInfo();
    if (!info || !isEducationInstitution(info.accountType as AccountType, info.organizationType)) {
      router.push('/dashboard');
      return;
    }

    setUserInfo(info);
    setLoading(false);
  }, [router]);

  // Fetch classes (Primary/Secondary only)
  const { data: classes } = useQuery({
    queryKey: ['institution-classes', userInfo?.organizationId],
    queryFn: () => getInstitutionClasses(userInfo!.organizationId!),
    enabled: !!userInfo?.organizationId && isPrimaryOrSecondary,
  });

  // Fetch timetable based on view mode
  const { data: timetable, isLoading: timetableLoading } = useQuery({
    queryKey: ['class-timetable', selectedClassId],
    queryFn: () => viewMode === 'class' ? getClassTimetable(selectedClassId) : getTeacherTimetable(selectedClassId),
    enabled: !!selectedClassId,
  });

  // Add timetable slot mutation
  const addSlotMutation = useMutation({
    mutationFn: async (input: AddTimetableSlotInput) => {
      const data = await graphql<{ addTimetableSlot: { success: boolean; message: string } }>(
        ADD_TIMETABLE_SLOT,
        { input }
      );
      return data.addTimetableSlot;
    },
    onSuccess: () => {
      toast.success('Timetable slot added successfully');
      queryClient.invalidateQueries({ queryKey: ['class-timetable'] });
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add slot: ${error.message}`);
    },
  });

  // Delete timetable slot mutation
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const data = await graphql<{ deleteTimetableSlot: { success: boolean; message: string } }>(
        DELETE_TIMETABLE_SLOT,
        { slotId }
      );
      return data.deleteTimetableSlot;
    },
    onSuccess: () => {
      toast.success('Timetable slot deleted');
      queryClient.invalidateQueries({ queryKey: ['class-timetable'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete slot: ${error.message}`);
    },
  });

  if (!userInfo || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Universities/Colleges: Different timetable system (course-based)
  if (!isPrimaryOrSecondary) {
    return (
      <ApplicationLayout
        userInfo={createLayoutUserInfo(userInfo)}
        onLogout={() => {
          localStorage.clear();
          router.push('/login');
        }}
        roleDisplayName={getUserRoleDisplayName(userInfo.userRole)}
        isAdmin={isAdministrator(userInfo.userRole)}
      >
        <div className="p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Course-Based Scheduling</h2>
            <p className="text-gray-600 mb-4">
              Universities and colleges use course-based scheduling systems.
            </p>
            <p className="text-sm text-gray-500">
              Class-based timetables are available for Primary and Secondary schools only.
            </p>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = Array.from({ length: 9 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const handleAddSlot = () => {
    if (!selectedSlot || !selectedClassId) return;

    const input: AddTimetableSlotInput = {
      institutionId: userInfo.organizationId!,
      classId: selectedClassId,
      subjectName: 'New Subject',
      dayOfWeek: selectedSlot.day,
      startTime: selectedSlot.time,
      endTime: `${(parseInt(selectedSlot.time.split(':')[0]) + 1).toString().padStart(2, '0')}:00`,
      isRecurring: true,
    };

    addSlotMutation.mutate(input);
  };

  const canManageTimetable = isAdministrator(userInfo.userRole) ||
                             userInfo.staffRole === 'HRManager' ||
                             userInfo.staffRole === 'DepartmentManager';

  return (
    <ApplicationLayout
      userInfo={createLayoutUserInfo(userInfo)}
      onLogout={() => {
        localStorage.clear();
        router.push('/login');
      }}
      roleDisplayName={getUserRoleDisplayName(userInfo.userRole)}
      isAdmin={isAdministrator(userInfo.userRole)}
    >
      <div className="p-6">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Timetable Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              {isPrimaryOrSecondary ? 'Manage class schedules and weekly timetables' : 'Course-based scheduling'}
            </p>
          </div>
          <Badge color="blue">
            {userInfo.educationalInstitutionSubcategory}
          </Badge>
        </div>

        <div className="mb-4 flex items-center gap-4">
          <Select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-64"
          >
            <option value="">Select a class...</option>
            {classes?.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.className} {cls.section ? `- ${cls.section}` : ''} ({cls.academicYear})
              </option>
            ))}
          </Select>

          {selectedClassId && canManageTimetable && (
            <Button color="blue" onClick={() => setIsAddDialogOpen(true)}>
              <PlusIcon />
              Add Slot
            </Button>
          )}
        </div>

        {selectedClassId && (
          <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  {daysOfWeek.map((day) => (
                    <th
                      key={day}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeSlots.map((time) => (
                  <tr key={time} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {time}
                    </td>
                    {daysOfWeek.map((day) => {
                      const slot = timetable?.find(
                        (s) => s.dayOfWeek === day && s.startTime === time
                      );
                      return (
                        <td key={day} className="px-4 py-4 text-sm">
                          {slot ? (
                            <div className="relative group bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition-colors">
                              <div className="font-semibold text-blue-900">{slot.subjectName}</div>
                              {slot.teacherName && (
                                <div className="text-xs text-blue-700 mt-1">👨‍🏫 {slot.teacherName}</div>
                              )}
                              {slot.roomName && (
                                <div className="text-xs text-blue-600 mt-1">🚪 {slot.roomName}</div>
                              )}
                              <div className="text-xs text-blue-500 mt-1">
                                {slot.startTime} - {slot.endTime}
                              </div>
                              {canManageTimetable && (
                                <button
                                  onClick={() => deleteSlotMutation.mutate(slot.id)}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-red-100 rounded hover:bg-red-200 transition-opacity"
                                  title="Delete slot"
                                >
                                  <TrashIcon className="w-3 h-3 text-red-600" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="text-center">
                              {canManageTimetable ? (
                                <button
                                  onClick={() => {
                                    setSelectedSlot({ day, time });
                                    setIsAddDialogOpen(true);
                                  }}
                                  className="text-gray-400 hover:text-blue-600 text-xs font-medium"
                                >
                                  + Add
                                </button>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!selectedClassId && (
          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">📅 Select a class to view its timetable</p>
          </div>
        )}

        {timetableLoading && (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading timetable...</div>
          </div>
        )}
      </div>

      {/* Add Slot Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
        <DialogTitle>Add Timetable Slot</DialogTitle>
        <DialogBody>
          <p className="text-sm text-gray-600 mb-4">
            Schedule a new lesson for {selectedSlot?.day} at {selectedSlot?.time}
          </p>
          <form onSubmit={(e) => { e.preventDefault(); handleAddSlot(); }}>
            <Field>
              <Label>Subject Name *</Label>
              <Input placeholder="e.g., Mathematics, English" required />
            </Field>
          </form>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddSlot} disabled={addSlotMutation.isPending}>
            {addSlotMutation.isPending ? 'Adding...' : 'Add Slot'}
          </Button>
        </DialogActions>
      </Dialog>
    </ApplicationLayout>
  );
}
