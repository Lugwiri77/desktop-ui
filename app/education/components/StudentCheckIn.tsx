'use client';

import React, { useState } from 'react';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { Badge } from '../../components/badge';
import { Heading, Subheading } from '../../components/heading';
import { Text } from '../../components/text';
import { Dialog, DialogTitle, DialogDescription, DialogBody, DialogActions } from '../../components/dialog';
import { Divider } from '../../components/divider';
import { format } from 'date-fns';

interface Guardian {
  guardian_name: string;
  guardian_phone: string;
  relationship_type: string;
  can_pickup: boolean;
}

interface StudentCheckInProfile {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  studentIdNumber: string;
  gradeLevel?: string;
  classSection?: string;
  currentStatus: string;
  hasAllergies: boolean;
  hasMedicalConditions: boolean;
  medicalEmergencyNotes?: string;
  homeroomTeacherFirstName?: string;
  homeroomTeacherLastName?: string;
  homeroomTeacherPhone?: string;
  guardians?: Guardian[];
}

interface StudentCheckInProps {
  institutionId: string;
  staffId: string;
}

export default function StudentCheckIn({ institutionId, staffId }: StudentCheckInProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<StudentCheckInProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentCheckInProfile | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'check_in' | 'check_out' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError(null);

    try {
      // TODO: Implement GraphQL query - searchStudentForCheckin
      // This searches by student ID, name, or email
      // const response = await client.query({
      //   query: SEARCH_STUDENT_FOR_CHECKIN,
      //   variables: { institutionId, searchQuery }
      // });

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock data - replace with actual API call
      const mockResults: StudentCheckInProfile[] = [];
      setSearchResults(mockResults);

      if (mockResults.length === 0) {
        setError('No students found matching your search');
      }
    } catch (err) {
      setError('Failed to search for students. Please try again.');
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleQrScan = async () => {
    // TODO: Implement QR code scanning
    // This should open camera/QR scanner and call getStudentByQr mutation
    setError('QR code scanning will be implemented with camera integration');

    // Example implementation:
    // const qrData = await scanQRCode();
    // const student = await client.query({
    //   query: GET_STUDENT_BY_QR,
    //   variables: { qrCodeData: qrData }
    // });
    // setSelectedStudent(student);
  };

  const handleStudentSelect = (student: StudentCheckInProfile) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchQuery('');
  };

  const openActionDialog = (type: 'check_in' | 'check_out') => {
    setActionType(type);
    setActionDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedStudent || !actionType) return;

    setProcessing(true);
    setError(null);

    try {
      if (actionType === 'check_in') {
        // TODO: Record student drop-off (check-in)
        // This creates a visitor log entry for the student
        // await client.mutate({
        //   mutation: RECORD_STUDENT_DROPOFF,
        //   variables: {
        //     institutionId,
        //     studentId: selectedStudent.id,
        //     staffId,
        //     gateLocation: 'Main Gate'
        //   }
        // });

        await new Promise(resolve => setTimeout(resolve, 1000));
        setSuccessMessage(`${selectedStudent.firstName} ${selectedStudent.lastName} has been checked in successfully`);
      } else {
        // TODO: Request student pickup (check-out)
        // This triggers the approval workflow if required
        // await client.mutate({
        //   mutation: REQUEST_STUDENT_PICKUP,
        //   variables: {
        //     input: {
        //       institutionId,
        //       studentId: selectedStudent.id,
        //       requesterName: 'Guardian Name', // Get from guardian selection
        //       requesterPhone: 'Guardian Phone',
        //       reason: 'Regular pickup',
        //       isEmergency: false
        //     }
        //   }
        // });

        await new Promise(resolve => setTimeout(resolve, 1000));
        setSuccessMessage(`Check-out request initiated for ${selectedStudent.firstName} ${selectedStudent.lastName}`);
      }

      setActionDialogOpen(false);
      setSelectedStudent(null);
    } catch (err) {
      setError(`Failed to ${actionType === 'check_in' ? 'check in' : 'check out'} student`);
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'checked_in':
        return 'success';
      case 'checked_out':
        return 'default';
      case 'picked_up':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center border-b border-zinc-950/10 pb-6 dark:border-white/10">
        <svg
          className="mr-3 size-10 text-blue-600 dark:text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <div>
          <Heading>Student Check-in / Check-out</Heading>
          <Text className="mt-1">Security Gate - Student Management</Text>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg
                className="mr-3 size-5 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <Text className="text-green-800 dark:text-green-200">{successMessage}</Text>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-start">
              <svg
                className="mr-3 mt-0.5 size-5 flex-shrink-0 text-red-600 dark:text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <Text className="text-red-800 dark:text-red-200">{error}</Text>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="rounded-lg border border-zinc-950/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
        <Subheading className="mb-4">Search Student</Subheading>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <label className="text-sm font-medium text-zinc-950 dark:text-white">
              Search by Student ID, Name, or Email
            </label>
            <div className="relative mt-2">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  className="size-5 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <Input
                className="pl-10"
                placeholder="Enter student ID number, full name, or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          <div className="md:col-span-3">
            <Button
              className="w-full"
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
            >
              {searching ? (
                <>
                  <svg className="mr-2 size-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <svg className="mr-2 size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Search
                </>
              )}
            </Button>
          </div>
          <div className="md:col-span-2">
            <Button className="w-full" outline onClick={handleQrScan}>
              <svg className="mr-2 size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              Scan QR
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-6">
            <Text className="mb-2 font-medium">Search Results:</Text>
            <div className="space-y-2">
              {searchResults.map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className="flex w-full items-center rounded-lg border border-zinc-950/10 p-3 text-left transition hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-zinc-800"
                >
                  <div className="mr-3 flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt={`${student.firstName} ${student.lastName}`}
                        className="size-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold">
                        {student.firstName[0]}{student.lastName[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-zinc-950 dark:text-white">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      ID: {student.studentIdNumber} | {student.gradeLevel || 'N/A'} {student.classSection || ''}
                    </div>
                  </div>
                  <Badge color={getStatusColor(student.currentStatus) as any}>
                    {getStatusLabel(student.currentStatus)}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Student Profile */}
      {selectedStudent && (
        <div className="rounded-lg border border-zinc-950/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <div className="mb-6 flex items-start justify-between">
            <Subheading>Student Profile</Subheading>
            <button
              onClick={() => setSelectedStudent(null)}
              className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Profile Photo and Basic Info */}
            <div className="flex flex-col items-center">
              <div className="mb-4 flex size-36 items-center justify-center overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/30">
                {selectedStudent.photoUrl ? (
                  <img
                    src={selectedStudent.photoUrl}
                    alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                    className="size-36 rounded-full object-cover"
                  />
                ) : (
                  <svg className="size-20 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </div>
              <Heading level={3} className="mb-2 text-center">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </Heading>
              <div className="mb-2">
                <Badge color={getStatusColor(selectedStudent.currentStatus) as any}>
                  {getStatusLabel(selectedStudent.currentStatus)}
                </Badge>
              </div>
              <Text className="mb-1 text-center text-sm">
                Student ID: {selectedStudent.studentIdNumber}
              </Text>
              {selectedStudent.gradeLevel && (
                <Text className="text-center text-sm">
                  Grade: {selectedStudent.gradeLevel} {selectedStudent.classSection || ''}
                </Text>
              )}
            </div>

            {/* Medical Information */}
            <div className="space-y-4">
              <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                <div className="mb-3 flex items-center">
                  <svg className="mr-2 size-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <Text className="font-semibold">Medical Information</Text>
                </div>

                {selectedStudent.hasAllergies && (
                  <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                    <Text className="font-bold text-amber-900 dark:text-amber-100">HAS ALLERGIES</Text>
                  </div>
                )}

                {selectedStudent.hasMedicalConditions && (
                  <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                    <Text className="font-bold text-amber-900 dark:text-amber-100">HAS MEDICAL CONDITIONS</Text>
                  </div>
                )}

                {selectedStudent.medicalEmergencyNotes && (
                  <div className="mt-3">
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400">Emergency Notes:</Text>
                    <Text className="mt-1 text-sm">{selectedStudent.medicalEmergencyNotes}</Text>
                  </div>
                )}

                {!selectedStudent.hasAllergies &&
                 !selectedStudent.hasMedicalConditions &&
                 !selectedStudent.medicalEmergencyNotes && (
                  <Text className="text-sm text-zinc-500">No medical alerts on file</Text>
                )}
              </div>

              {/* Homeroom Teacher */}
              {selectedStudent.homeroomTeacherFirstName && (
                <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                  <Text className="mb-2 font-medium">Homeroom Teacher</Text>
                  <Text className="text-sm">
                    {selectedStudent.homeroomTeacherFirstName} {selectedStudent.homeroomTeacherLastName}
                  </Text>
                  {selectedStudent.homeroomTeacherPhone && (
                    <div className="mt-1 flex items-center">
                      <svg className="mr-1 size-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <Text className="text-sm text-zinc-500">{selectedStudent.homeroomTeacherPhone}</Text>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Guardian Contacts */}
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <Text className="mb-3 font-semibold">Guardian Contacts</Text>

              {selectedStudent.guardians && selectedStudent.guardians.length > 0 ? (
                <div className="space-y-3">
                  {selectedStudent.guardians.map((guardian, index) => (
                    <div key={index}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Text className="font-medium">{guardian.guardian_name}</Text>
                            {guardian.can_pickup && (
                              <Badge color="green">Can Pickup</Badge>
                            )}
                          </div>
                          <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {guardian.relationship_type}
                          </Text>
                          <div className="mt-1 flex items-center">
                            <svg className="mr-1 size-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            <Text className="text-xs">{guardian.guardian_phone}</Text>
                          </div>
                        </div>
                      </div>
                      {index < selectedStudent.guardians!.length - 1 && (
                        <Divider className="my-3" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Text className="text-sm text-zinc-500">No guardian contacts on file</Text>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              color="green"
              onClick={() => openActionDialog('check_in')}
              disabled={selectedStudent.currentStatus.toLowerCase() === 'checked_in'}
              className="flex-1 sm:flex-none"
            >
              <svg className="mr-2 size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Check In (Drop-off)
            </Button>
            <Button
              color="amber"
              onClick={() => openActionDialog('check_out')}
              disabled={selectedStudent.currentStatus.toLowerCase() === 'checked_out'}
              className="flex-1 sm:flex-none"
            >
              <svg className="mr-2 size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Check Out (Pickup)
            </Button>
          </div>
        </div>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)}>
        <DialogTitle>
          {actionType === 'check_in' ? 'Confirm Check-in' : 'Confirm Check-out'}
        </DialogTitle>
        <DialogBody>
          {selectedStudent && (
            <div className="space-y-4">
              <Text>
                Are you sure you want to {actionType === 'check_in' ? 'check in' : 'check out'}:
              </Text>
              <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                <Heading level={4} className="mb-1">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </Heading>
                <Text className="text-sm text-zinc-500">
                  Student ID: {selectedStudent.studentIdNumber}
                </Text>
                <Text className="text-sm text-zinc-500">
                  {selectedStudent.gradeLevel} {selectedStudent.classSection}
                </Text>
              </div>
              {actionType === 'check_out' && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
                  <Text className="text-sm text-blue-800 dark:text-blue-200">
                    This will initiate the pickup approval process if required by institution policy.
                  </Text>
                </div>
              )}
              <Text className="text-xs text-zinc-500">
                Time: {format(new Date(), 'PPpp')}
              </Text>
            </div>
          )}
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setActionDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            color={actionType === 'check_in' ? 'green' : 'amber'}
            onClick={handleAction}
            disabled={processing}
          >
            {processing ? (
              <>
                <svg className="mr-2 size-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
