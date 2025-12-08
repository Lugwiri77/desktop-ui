'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApplicationLayout } from '../../components/application-layout';
import { isAuthenticated, loadUserInfo, isAdministrator, getUserRoleDisplayName, type UserInfo } from '@/lib/roles';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { getStudentDiary, getUnacknowledgedDiaries, addDiaryEntry, addDiaryAssignment, acknowledgeDiary, graphql } from '@/lib/education-api';
import { GET_MY_CHILDREN } from '@/lib/education-api';
import type { StudentDiaryEntry, AddDiaryEntryInput, AddDiaryAssignmentInput, AcknowledgeDiaryInput, AttendanceStatus, AssignmentType } from '@/types/education';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Select } from '@/app/components/select';
import { Dialog, DialogTitle, DialogBody, DialogActions } from '@/app/components/dialog';
import { Field, Label, FieldGroup } from '@/app/components/fieldset';
import { Badge } from '@/app/components/badge';
import { toast } from 'sonner';
import { CheckCircleIcon, ClockIcon, PencilIcon } from '@heroicons/react/20/solid';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  institutionId: string;
}

export default function DiaryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<StudentDiaryEntry | null>(null);

  // Primary school check
  const isPrimarySchool = userInfo?.educationalInstitutionSubcategory === 'Primary' ||
                          userInfo?.educationalInstitutionSubcategory === 'PrimarySchool';

  const isTeacher = userInfo?.staffRole === 'Administrator' ||
                   userInfo?.staffRole === 'DepartmentManager' ||
                   userInfo?.accountType === 'InstitutionStaff';

  const isParent = userInfo?.accountType === 'PersonalAccount';

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

    setUserInfo(info);
    setLoading(false);
  }, [router]);

  // Fetch children for parents
  const { data: children } = useQuery({
    queryKey: ['my-children', userInfo?.institutionId],
    queryFn: async () => {
      const data = await graphql<{ getMyChildren: Child[] }>(GET_MY_CHILDREN, {
        institutionId: userInfo?.institutionId,
      });
      return data.getMyChildren;
    },
    enabled: !!userInfo && isParent && isPrimarySchool,
  });

  // Fetch diary entries
  const { data: diaryEntries, refetch: refetchDiary } = useQuery({
    queryKey: ['student-diary', selectedStudentId],
    queryFn: () => getStudentDiary(selectedStudentId),
    enabled: !!selectedStudentId && isPrimarySchool,
  });

  // Fetch unacknowledged diaries for parents
  const { data: unacknowledgedDiaries } = useQuery({
    queryKey: ['unacknowledged-diaries'],
    queryFn: () => getUnacknowledgedDiaries(),
    enabled: isParent && isPrimarySchool,
  });

  // Mutations
  const addEntryMutation = useMutation({
    mutationFn: addDiaryEntry,
    onSuccess: () => {
      toast.success('Diary entry added successfully');
      refetchDiary();
      setIsAddEntryDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add entry: ${error.message}`);
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: acknowledgeDiary,
    onSuccess: () => {
      toast.success('Diary acknowledged successfully');
      queryClient.invalidateQueries({ queryKey: ['student-diary'] });
      queryClient.invalidateQueries({ queryKey: ['unacknowledged-diaries'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to acknowledge: ${error.message}`);
    },
  });

  if (!userInfo || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Not a primary school - show message
  if (!isPrimarySchool) {
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
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="mb-6">
              <Badge color="amber" className="text-lg">
                {userInfo.educationalInstitutionSubcategory}
              </Badge>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">📖 Online Diary System</h2>
            <p className="text-lg text-gray-600 mb-4">
              The online diary system is available for <strong>Primary Schools only</strong>.
            </p>
            <p className="text-sm text-gray-500">
              Secondary schools, universities, and colleges use different communication systems.
            </p>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

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
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Diary</h1>
            <p className="mt-1 text-sm text-gray-500">
              {isTeacher ? 'Add daily diary entries and assignments' : 'View and acknowledge daily diary entries'}
            </p>
          </div>
          <Badge color="green">Primary School</Badge>
        </div>

        {/* Parent View: Unacknowledged Diaries Alert */}
        {isParent && unacknowledgedDiaries && unacknowledgedDiaries.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
            <div className="flex items-center">
              <ClockIcon className="w-5 h-5 text-amber-600 mr-2" />
              <p className="font-semibold text-amber-900">
                You have {unacknowledgedDiaries.length} unacknowledged diary {unacknowledgedDiaries.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
          </div>
        )}

        {/* Student/Child Selector */}
        <div className="mb-6 flex items-center gap-4">
          <Select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-64"
          >
            <option value="">Select a student...</option>
            {isParent && children?.map((child) => (
              <option key={child.id} value={child.id}>
                {child.firstName} {child.lastName} - {child.gradeLevel}
              </option>
            ))}
          </Select>

          {isTeacher && selectedStudentId && (
            <Button color="blue" onClick={() => setIsAddEntryDialogOpen(true)}>
              <PencilIcon />
              Add Diary Entry
            </Button>
          )}
        </div>

        {/* Diary Entries Timeline */}
        {selectedStudentId && diaryEntries && (
          <div className="space-y-6">
            {diaryEntries.map((entry) => (
              <div
                key={entry.id}
                className={`border rounded-lg p-6 shadow-sm transition-all ${
                  !entry.isAcknowledged ? 'border-amber-300 bg-amber-50' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {new Date(entry.entryDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h3>
                    {entry.teacherName && (
                      <p className="text-sm text-gray-600">Teacher: {entry.teacherName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.attendanceStatus && (
                      <Badge
                        color={
                          entry.attendanceStatus === 'present'
                            ? 'lime'
                            : entry.attendanceStatus === 'absent'
                            ? 'red'
                            : 'amber'
                        }
                      >
                        {entry.attendanceStatus}
                      </Badge>
                    )}
                    {entry.isAcknowledged && (
                      <Badge color="green">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Acknowledged
                      </Badge>
                    )}
                  </div>
                </div>

                {entry.generalNotes && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-1">General Notes:</p>
                    <p className="text-gray-900">{entry.generalNotes}</p>
                  </div>
                )}

                {entry.behaviorNotes && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Behavior Notes:</p>
                    <p className="text-gray-900">{entry.behaviorNotes}</p>
                  </div>
                )}

                {/* Assignments */}
                {entry.assignments && entry.assignments.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">📚 Assignments:</p>
                    <div className="space-y-3">
                      {entry.assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <input
                            type="checkbox"
                            checked={assignment.isCompleted}
                            disabled={entry.isAcknowledged || !isParent}
                            className="mt-1"
                            readOnly
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{assignment.title}</span>
                              {assignment.isUrgent && (
                                <Badge color="red" size="sm">
                                  Urgent
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{assignment.subjectName}</p>
                            {assignment.description && (
                              <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                            )}
                            {assignment.dueDate && (
                              <p className="text-xs text-gray-500 mt-1">
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acknowledgment for Parents */}
                {isParent && !entry.isAcknowledged && (
                  <div className="mt-6 border-t pt-4">
                    <Button
                      color="green"
                      onClick={() => {
                        const completedAssignments = entry.assignments
                          .filter((a) => a.isCompleted)
                          .map((a) => a.id);
                        acknowledgeMutation.mutate({
                          diaryEntryId: entry.id,
                          assignmentsCompleted: completedAssignments,
                        });
                      }}
                      disabled={acknowledgeMutation.isPending}
                    >
                      {acknowledgeMutation.isPending ? 'Acknowledging...' : '✓ Acknowledge & Sign'}
                    </Button>
                  </div>
                )}

                {/* Acknowledgment Info */}
                {entry.isAcknowledged && entry.acknowledgmentDate && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-green-700">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>
                      Acknowledged on {new Date(entry.acknowledgmentDate).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {diaryEntries.length === 0 && (
              <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">📖 No diary entries yet</p>
                {isTeacher && (
                  <Button className="mt-4" onClick={() => setIsAddEntryDialogOpen(true)}>
                    Add First Entry
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {!selectedStudentId && (
          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">
              {isParent ? '👨‍👩‍👧‍👦 Select your child to view diary entries' : '👨‍🎓 Select a student to view or add diary entries'}
            </p>
          </div>
        )}
      </div>

      {/* Add Diary Entry Dialog (Teachers only) */}
      <Dialog open={isAddEntryDialogOpen} onClose={() => setIsAddEntryDialogOpen(false)} size="2xl">
        <DialogTitle>Add Diary Entry</DialogTitle>
        <DialogBody>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              addEntryMutation.mutate({
                studentId: selectedStudentId,
                entryDate: formData.get('entryDate') as string,
                generalNotes: formData.get('generalNotes') as string || undefined,
                behaviorNotes: formData.get('behaviorNotes') as string || undefined,
                attendanceStatus: (formData.get('attendanceStatus') as AttendanceStatus) || undefined,
              });
            }}
            className="space-y-4"
          >
            <Field>
              <Label>Date *</Label>
              <Input
                name="entryDate"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                required
              />
            </Field>

            <Field>
              <Label>Attendance Status</Label>
              <Select name="attendanceStatus">
                <option value="">Select status...</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="early_dismissal">Early Dismissal</option>
              </Select>
            </Field>

            <Field>
              <Label>General Notes</Label>
              <textarea
                name="generalNotes"
                rows={3}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="General notes about the day..."
              />
            </Field>

            <Field>
              <Label>Behavior Notes</Label>
              <textarea
                name="behaviorNotes"
                rows={3}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Behavior observations..."
              />
            </Field>
          </form>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setIsAddEntryDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={addEntryMutation.isPending}>
            {addEntryMutation.isPending ? 'Adding...' : 'Add Entry'}
          </Button>
        </DialogActions>
      </Dialog>
    </ApplicationLayout>
  );
}
