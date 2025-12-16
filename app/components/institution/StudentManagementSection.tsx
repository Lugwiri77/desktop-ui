'use client';

import React, { useState, useEffect } from 'react';
import { Heading } from '../heading';
import { Text } from '../text';
import { Button } from '../button';
import { Input } from '../input';
import { Field, Label, Description } from '../fieldset';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '../dialog';
import {
  AcademicCapIcon,
  ArrowUpTrayIcon,
  UserPlusIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/20/solid';
import { graphql } from '@/lib/graphql';
import { loadUserInfo, getStudentFieldLabels, UserInfo } from '@/lib/roles';
import GuardianManagementDialog from '../../education/components/GuardianManagementDialog';
import NextOfKinManagementDialog from '../../education/components/NextOfKinManagementDialog';

interface StudentData {
  id?: string;
  studentIdNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  gender?: string;
  gradeLevel?: string;
  classSection?: string;
  dateOfBirth?: string;
}

interface StudentManagementSectionProps {
  institutionId: string;
  organizationType?: string;
}

export default function StudentManagementSection({ institutionId, organizationType }: StudentManagementSectionProps) {
  // Statistics moved to dashboard - removed tab switching
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Load user info to determine institution type
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [fieldLabels, setFieldLabels] = useState({
    gradeLevelLabel: 'Grade Level',
    classSectionLabel: 'Class Section',
    shouldShowGradeLevel: true,
    shouldShowClassSection: true,
  });

  // Student management state
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<StudentData>({
    studentIdNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gradeLevel: '',
    classSection: '',
    dateOfBirth: '',
  });
  const [personalAccountId, setPersonalAccountId] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Guardian/Next of Kin dialog state
  const [guardianDialogOpen, setGuardianDialogOpen] = useState(false);
  const [selectedStudentForGuardian, setSelectedStudentForGuardian] = useState<{ id: string; name: string } | null>(null);
  const [isUniversity, setIsUniversity] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit student state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentData | null>(null);
  const [updating, setUpdating] = useState(false);

  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      student.firstName?.toLowerCase().includes(search) ||
      student.lastName?.toLowerCase().includes(search) ||
      student.middleName?.toLowerCase().includes(search) ||
      student.studentIdNumber?.toLowerCase().includes(search) ||
      student.email?.toLowerCase().includes(search) ||
      student.gradeLevel?.toLowerCase().includes(search) ||
      student.classSection?.toLowerCase().includes(search)
    );
  });

  // Load user info and set field labels on mount
  useEffect(() => {
    const info = loadUserInfo();
    if (info) {
      setUserInfo(info);
      const labels = getStudentFieldLabels(info);
      setFieldLabels(labels);

      // Determine if institution is university/college
      const subcategory = info.educationalInstitutionSubcategory || '';
      const isUni = subcategory === 'University' || subcategory === 'College';
      setIsUniversity(isUni);

      console.log('📚 Institution type:', info.educationalInstitutionSubcategory);
      console.log('📋 Field labels:', labels);
      console.log('🎓 Is University/College:', isUni);
    }
  }, []);

  // Fetch students on mount
  useEffect(() => {
    loadStudents();
  }, [institutionId]);

  const loadStudents = async () => {
    try {
      const query = `
        query GetInstitutionStudents($institutionId: String!) {
          getInstitutionStudents(institutionId: $institutionId) {
            id
            studentIdNumber
            firstName
            middleName
            lastName
            studentEmail
            studentPhone
            gender
            gradeLevel
            classSection
            enrollmentStatus
            currentStatus
          }
        }
      `;

      const data = await graphql<{ getInstitutionStudents: any[] }>(query, { institutionId });

      const studentsData = data.getInstitutionStudents.map((s: any) => ({
        id: s.id,
        studentIdNumber: s.studentIdNumber,
        firstName: s.firstName,
        middleName: s.middleName,
        lastName: s.lastName,
        email: s.studentEmail,
        phoneNumber: s.studentPhone,
        gender: s.gender,
        gradeLevel: s.gradeLevel,
        classSection: s.classSection,
      }));

      setStudents(studentsData);
    } catch (err: any) {
      console.error('Error loading students:', err);
      setError(`Failed to load students: ${err.message}`);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.studentIdNumber || !newStudent.firstName || !newStudent.lastName) {
      setError('Student ID, first name, and last name are required');
      return;
    }

    if (!newStudent.dateOfBirth) {
      setError('Date of birth is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const mutation = `
        mutation RegisterStudent($input: RegisterStudentInput!) {
          registerStudent(input: $input) {
            id
            institutionId
            firstName
            lastName
            studentIdNumber
            gradeLevel
            classSection
            enrollmentStatus
            currentStatus
            photoUrl
            createdAt
          }
        }
      `;

      const input = {
        institutionId,
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        middleName: newStudent.middleName || null,
        studentIdNumber: newStudent.studentIdNumber,
        dateOfBirth: newStudent.dateOfBirth,
        studentEmail: newStudent.email || null,
        studentPhone: newStudent.phoneNumber || null,
        gender: newStudent.gender || null,
        gradeLevel: newStudent.gradeLevel || null,
        classSection: newStudent.classSection || null,
        enrollmentDate: new Date().toISOString().split('T')[0], // Today's date
        personalAccountId: personalAccountId, // Link to personal account if found via email
      };

      console.log('Current personalAccountId state:', personalAccountId);
      console.log('Registering student:', input);

      const data = await graphql<{ registerStudent: any }>(mutation, { input });

      console.log('Student registered successfully:', data.registerStudent);

      // Reload students list
      await loadStudents();

      // Store student info for guardian dialog
      const registeredStudent = data.registerStudent;
      setSelectedStudentForGuardian({
        id: registeredStudent.id,
        name: `${registeredStudent.firstName} ${registeredStudent.lastName}`,
      });

      setAddStudentDialogOpen(false);
      setNewStudent({
        studentIdNumber: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        gradeLevel: '',
        classSection: '',
        dateOfBirth: '',
      });
      setPersonalAccountId(null);

      const successMsg = personalAccountId
        ? 'Student registered and linked to their app account successfully!'
        : 'Student registered successfully!';
      setSuccess(successMsg);
      setTimeout(() => setSuccess(''), 4000);

      // Open guardian/next of kin dialog
      setGuardianDialogOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to register student. Please try again.');
      console.error('Student registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  // Helper function to parse various date formats to YYYY-MM-DD
  const parseDateToISO = (dateStr: string): string => {
    if (!dateStr || !dateStr.trim()) return '';

    dateStr = dateStr.trim();

    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Try parsing common formats: M/D/YY, M/D/YYYY, MM/DD/YY, MM/DD/YYYY
    const slashPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
    const match = dateStr.match(slashPattern);

    if (match) {
      let month = match[1].padStart(2, '0');
      let day = match[2].padStart(2, '0');
      let year = match[3];

      // Convert 2-digit year to 4-digit
      if (year.length === 2) {
        const yearNum = parseInt(year);
        // Assume 00-30 is 2000-2030, 31-99 is 1931-1999
        year = yearNum <= 30 ? `20${year}` : `19${year}`;
      }

      return `${year}-${month}-${day}`;
    }

    // Try Date object parsing as fallback
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      // Fallback failed
    }

    throw new Error(`Invalid date format: "${dateStr}". Expected YYYY-MM-DD or M/D/YY or MM/DD/YYYY`);
  };

  const handleImportStudents = async () => {
    if (!importFile) {
      setError('Please select a file to import');
      return;
    }

    setImporting(true);
    setError('');

    try {
      console.log('Importing students from file:', importFile.name);

      // Read the CSV file
      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('CSV file must contain a header row and at least one data row');
      }

      // Parse header to get column indices
      const headers = lines[0].split(',').map(h => h.trim());
      const getColumnIndex = (name: string) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());

      const studentIdIdx = getColumnIndex('Student ID Number');
      const firstNameIdx = getColumnIndex('First Name');
      const middleNameIdx = getColumnIndex('Middle Name');
      const lastNameIdx = getColumnIndex('Last Name');
      const emailIdx = getColumnIndex('Email');
      const phoneIdx = getColumnIndex('Phone Number');
      const genderIdx = getColumnIndex('Gender');
      const gradeLevelIdx = getColumnIndex(fieldLabels.gradeLevelLabel);
      const classSectionIdx = getColumnIndex(fieldLabels.classSectionLabel);
      const dobIdx = getColumnIndex('Date of Birth');

      // Validate required columns exist
      if (studentIdIdx === -1 || firstNameIdx === -1 || lastNameIdx === -1 || dobIdx === -1) {
        throw new Error('CSV must contain: Student ID Number, First Name, Last Name, and Date of Birth');
      }

      // Parse student data
      const students = [];
      const parseErrors: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());

        if (values.length < headers.length) continue; // Skip incomplete rows

        try {
          // Parse and validate date of birth
          const dobValue = values[dobIdx];
          const parsedDob = parseDateToISO(dobValue);

          students.push({
            institutionId,
            studentIdNumber: values[studentIdIdx],
            firstName: values[firstNameIdx],
            middleName: middleNameIdx !== -1 ? values[middleNameIdx] || null : null,
            lastName: values[lastNameIdx],
            dateOfBirth: parsedDob,
            studentEmail: emailIdx !== -1 ? values[emailIdx] || null : null,
            studentPhone: phoneIdx !== -1 ? values[phoneIdx] || null : null,
            gender: genderIdx !== -1 ? values[genderIdx] || null : null,
            gradeLevel: gradeLevelIdx !== -1 ? values[gradeLevelIdx] || null : null,
            classSection: classSectionIdx !== -1 ? values[classSectionIdx] || null : null,
            enrollmentDate: new Date().toISOString().split('T')[0],
            personalAccountId: null,
          });
        } catch (err: any) {
          parseErrors.push(`Row ${i + 1}: ${err.message}`);
        }
      }

      if (parseErrors.length > 0 && students.length === 0) {
        throw new Error(`Failed to parse any students:\n${parseErrors.join('\n')}`);
      }

      if (parseErrors.length > 0) {
        console.warn('Some rows had errors:', parseErrors);
      }

      console.log(`Parsed ${students.length} students from CSV`);

      // Call bulk registration mutation
      const mutation = `
        mutation RegisterStudentsBulk($institutionId: String!, $students: [RegisterStudentInput!]!) {
          registerStudentsBulk(institutionId: $institutionId, students: $students) {
            successCount
            failedCount
            totalCount
            errors
          }
        }
      `;

      const data = await graphql<{ registerStudentsBulk: any }>(mutation, {
        institutionId,
        students,
      });

      const result = data.registerStudentsBulk;
      console.log('Bulk registration result:', result);

      if (result.failedCount > 0) {
        const errorMsg = `Imported ${result.successCount} of ${result.totalCount} students. ${result.failedCount} failed.`;
        setError(errorMsg);
        if (result.errors) {
          console.error('Failed rows:', result.errors);
        }
      } else {
        const guardianNote = isUniversity
          ? 'Next of Kin can be added individually from the student list below.'
          : 'Guardians can be added individually from the student list below.';
        setSuccess(`Successfully imported all ${result.successCount} students from ${importFile.name}. ${guardianNote}`);
        setTimeout(() => setSuccess(''), 6000);
      }

      // Reload students list to show newly imported students
      await loadStudents();

      setImportFile(null);
    } catch (err: any) {
      setError(`Failed to import students: ${err.message}`);
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Generate template based on institution type
    const gradeLevelHeader = fieldLabels.gradeLevelLabel;
    const classSectionHeader = fieldLabels.classSectionLabel;

    let template: string;
    if (fieldLabels.gradeLevelLabel === 'Programme/Course') {
      // University/College template - includes email and phone (adults)
      const exampleRow1 = 'S001,John,Michael,Doe,john.doe@example.com,+1234567890,Male,Computer Science,Year 1,2005-01-15';
      const exampleRow2 = 'S002,Jane,Marie,Smith,jane.smith@example.com,+1234567891,Female,Engineering,Year 2,2004-05-22';
      template = `Student ID Number,First Name,Middle Name,Last Name,Email,Phone Number,Gender,${gradeLevelHeader},${classSectionHeader},Date of Birth
${exampleRow1}
${exampleRow2}`;
    } else {
      // Primary/Secondary School template - NO email/phone (use guardian contact info instead)
      const exampleRow1 = 'S001,John,Michael,Doe,Male,10,A,2008-01-15';
      const exampleRow2 = 'S002,Jane,Marie,Smith,Female,11,B,2007-05-22';
      template = `Student ID Number,First Name,Middle Name,Last Name,Gender,${gradeLevelHeader},${classSectionHeader},Date of Birth
${exampleRow1}
${exampleRow2}`;
    }

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleOpenGuardianDialog = (student: StudentData) => {
    setSelectedStudentForGuardian({
      id: student.id!,
      name: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`,
    });
    setGuardianDialogOpen(true);
  };

  const handleOpenDeleteDialog = (student: StudentData) => {
    setStudentToDelete({
      id: student.id!,
      name: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`,
    });
    setDeleteDialogOpen(true);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    setDeleting(true);
    setError('');

    try {
      const mutation = `
        mutation DeleteStudent($studentId: String!) {
          deleteStudent(studentId: $studentId) {
            success
            message
          }
        }
      `;

      const result = await graphql<{ deleteStudent: { success: boolean; message: string } }>(mutation, {
        studentId: studentToDelete.id,
      });

      if (result.deleteStudent.success) {
        setSuccess(`Student ${studentToDelete.name} deleted successfully!`);
        setTimeout(() => setSuccess(''), 5000);

        // Reload students list
        await loadStudents();

        // Close dialog
        setDeleteDialogOpen(false);
        setStudentToDelete(null);
      } else {
        throw new Error(result.deleteStudent.message);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to delete student');
      console.error('Error deleting student:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenEditDialog = (student: StudentData) => {
    setStudentToEdit({
      id: student.id,
      studentIdNumber: student.studentIdNumber,
      firstName: student.firstName,
      middleName: student.middleName || '',
      lastName: student.lastName,
      email: student.email || '',
      phoneNumber: student.phoneNumber || '',
      gender: student.gender || '',
      gradeLevel: student.gradeLevel || '',
      classSection: student.classSection || '',
      dateOfBirth: student.dateOfBirth || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToEdit || !studentToEdit.id) return;

    setUpdating(true);
    setError('');

    try {
      const mutation = `
        mutation UpdateStudent($input: UpdateStudentInput!) {
          updateStudent(input: $input) {
            id
            firstName
            lastName
            middleName
            studentIdNumber
            studentEmail
            studentPhone
            gender
            gradeLevel
            classSection
          }
        }
      `;

      const input = {
        studentId: studentToEdit.id,
        firstName: studentToEdit.firstName || null,
        lastName: studentToEdit.lastName || null,
        middleName: studentToEdit.middleName || null,
        studentEmail: studentToEdit.email || null,
        studentPhone: studentToEdit.phoneNumber || null,
        gender: studentToEdit.gender || null,
        gradeLevel: studentToEdit.gradeLevel || null,
        classSection: studentToEdit.classSection || null,
        dateOfBirth: studentToEdit.dateOfBirth || null,
      };

      const result = await graphql<{ updateStudent: any }>(mutation, { input });

      if (result.updateStudent) {
        setSuccess(`Student ${studentToEdit.firstName} ${studentToEdit.lastName} updated successfully!`);
        setTimeout(() => setSuccess(''), 5000);

        // Reload students list
        await loadStudents();

        // Close dialog
        setEditDialogOpen(false);
        setStudentToEdit(null);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to update student');
      console.error('Error updating student:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleEmailLookup = async (email: string) => {
    if (!email || !email.includes('@')) return;

    setLoading(true);
    setError('');

    try {
      const query = `
        query LookupPersonalAccount($email: String!, $institutionId: String!) {
          lookupPersonalAccountByEmail(email: $email, institutionId: $institutionId) {
            id
            firstName
            lastName
            email
            phoneNumber
            dateOfBirth
          }
        }
      `;

      console.log('Looking up student by email:', email);

      const data = await graphql<{ lookupPersonalAccountByEmail: any }>(query, {
        email,
        institutionId,
      });

      if (data.lookupPersonalAccountByEmail) {
        const account = data.lookupPersonalAccountByEmail;
        console.log('Found personal account:', account);
        console.log('Setting personalAccountId to:', account.id);

        // Save the account ID for linking
        setPersonalAccountId(account.id);

        // Autofill the form with account details
        setNewStudent({
          ...newStudent,
          email: account.email,
          phoneNumber: account.phoneNumber || newStudent.phoneNumber,
          firstName: account.firstName,
          lastName: account.lastName,
          dateOfBirth: account.dateOfBirth || newStudent.dateOfBirth,
        });

        setSuccess('Account found! Form auto-filled with user details. Student will be linked to their app account.');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        console.log('No account found for email:', email);
        console.log('Clearing personalAccountId');
        // Clear any previous account ID
        setPersonalAccountId(null);
        // Keep the email but don't auto-fill
        setNewStudent({
          ...newStudent,
          email,
        });
      }
    } catch (err: any) {
      console.error('Email lookup failed:', err);
      // Don't show error - it's optional to have an account
      // Just keep the email they entered
      setNewStudent({
        ...newStudent,
        email,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AcademicCapIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        <div>
          <Heading level={2}>Student Management</Heading>
          <Text>Manage students and view statistics</Text>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
          <strong>Success:</strong> {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Student Management Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual Add */}
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
              <Heading level={3} className="mb-2">Add Student Manually</Heading>
              <Text className="mb-4">Add individual students one at a time. Link with app account via email for auto-fill.</Text>
              <Button type="button" onClick={() => setAddStudentDialogOpen(true)}>
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Add New Student
              </Button>
            </div>

            {/* Bulk Import */}
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
              <Heading level={3} className="mb-2">Bulk Import from Excel/CSV</Heading>
              <Text className="mb-4">Import multiple students at once using an Excel or CSV file.</Text>

              <div className="space-y-3">
                <Button type="button" outline onClick={handleDownloadTemplate}>
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download Template
                </Button>

                <div>
                  <input
                    accept=".xlsx,.xls,.csv"
                    style={{ display: 'none' }}
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="file-upload">
                    <Button type="button" outline>
                      <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                      Select File
                    </Button>
                  </label>
                </div>

                {importFile && (
                  <div className="space-y-2">
                    <Text className="text-sm">Selected: {importFile.name}</Text>
                    <Button type="button" onClick={handleImportStudents} disabled={importing}>
                      {importing ? 'Importing...' : 'Import Students'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Student List */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <div className="mb-4 flex items-center justify-between gap-4">
              <Heading level={3}>Registered Students ({students.length})</Heading>
              <div className="relative w-64">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-zinc-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {students.length === 0 ? (
              <div className="rounded-lg bg-zinc-50 p-8 text-center dark:bg-zinc-800">
                <Text>No students added yet. Use the buttons above to add students.</Text>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="rounded-lg bg-zinc-50 p-8 text-center dark:bg-zinc-800">
                <Text>No students found matching &quot;{searchTerm}&quot;</Text>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Student ID</TableHeader>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Email</TableHeader>
                    <TableHeader>Grade/Class</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.studentIdNumber}</TableCell>
                      <TableCell>
                        {student.firstName} {student.middleName ? `${student.middleName} ` : ''}{student.lastName}
                      </TableCell>
                      <TableCell>{student.email || '-'}</TableCell>
                      <TableCell>
                        {student.gradeLevel && student.classSection
                          ? `${student.gradeLevel} - ${student.classSection}`
                          : student.gradeLevel || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            plain
                            onClick={() => handleOpenGuardianDialog(student)}
                            title={isUniversity ? 'Add Next of Kin' : 'Add Guardian'}
                          >
                            <UserGroupIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            plain
                            title="Edit Student"
                            onClick={() => handleOpenEditDialog(student)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            plain
                            title="Delete Student"
                            onClick={() => handleOpenDeleteDialog(student)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

      {/* Add Student Dialog */}
      <Dialog open={addStudentDialogOpen} onClose={() => {
        setAddStudentDialogOpen(false);
        setPersonalAccountId(null);
      }}>
        <DialogTitle>Add New Student</DialogTitle>
        <DialogDescription>
          Enter student email to auto-fill form from app account, or fill manually.
        </DialogDescription>
        <DialogBody>
          <div className="space-y-4">
            <Field>
              <Label>Email (for app linking)</Label>
              <Input
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                onBlur={(e) => handleEmailLookup(e.target.value)}
              />
              <Description>Leave blank for manual entry. If student has app account, email will auto-fill details.</Description>
            </Field>

            <Field>
              <Label>Phone Number</Label>
              <Input
                type="tel"
                value={newStudent.phoneNumber}
                onChange={(e) => setNewStudent({ ...newStudent, phoneNumber: e.target.value })}
                placeholder="+254..."
              />
              <Description>Contact phone number for the student (auto-filled from app account if available)</Description>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <Label>Student ID Number *</Label>
                <Input
                  required
                  value={newStudent.studentIdNumber}
                  onChange={(e) => setNewStudent({ ...newStudent, studentIdNumber: e.target.value })}
                />
              </Field>
              <Field>
                <Label>First Name *</Label>
                <Input
                  required
                  value={newStudent.firstName}
                  onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                />
              </Field>
              <Field>
                <Label>Middle Name</Label>
                <Input
                  value={newStudent.middleName}
                  onChange={(e) => setNewStudent({ ...newStudent, middleName: e.target.value })}
                />
              </Field>
              <Field>
                <Label>Last Name *</Label>
                <Input
                  required
                  value={newStudent.lastName}
                  onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                />
              </Field>
              <Field>
                <Label>Gender</Label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white px-3 py-2 border"
                  value={newStudent.gender || ''}
                  onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field>
                <Label>Date of Birth *</Label>
                <Input
                  type="date"
                  required
                  value={newStudent.dateOfBirth}
                  onChange={(e) => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })}
                />
              </Field>
              <Field>
                <Label>{fieldLabels.gradeLevelLabel}</Label>
                <Input
                  value={newStudent.gradeLevel}
                  onChange={(e) => setNewStudent({ ...newStudent, gradeLevel: e.target.value })}
                  placeholder={
                    fieldLabels.gradeLevelLabel === 'Programme/Course'
                      ? "e.g., Computer Science, Engineering"
                      : "e.g., 10, Year 1, Freshman"
                  }
                />
              </Field>
              <Field>
                <Label>{fieldLabels.classSectionLabel}</Label>
                <Input
                  value={newStudent.classSection}
                  onChange={(e) => setNewStudent({ ...newStudent, classSection: e.target.value })}
                  placeholder={
                    fieldLabels.classSectionLabel === 'Year of Study'
                      ? "e.g., Year 1, Year 2, Year 3"
                      : "e.g., A, B, Section 1"
                  }
                />
              </Field>
            </div>
          </div>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => {
            setAddStudentDialogOpen(false);
            setPersonalAccountId(null);
          }}>
            Cancel
          </Button>
          <Button onClick={handleAddStudent} disabled={loading}>
            {loading ? 'Adding...' : 'Add Student'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Guardian/Next of Kin Management Dialog */}
      {selectedStudentForGuardian && (
        isUniversity ? (
          <NextOfKinManagementDialog
            open={guardianDialogOpen}
            onClose={() => {
              setGuardianDialogOpen(false);
              setSelectedStudentForGuardian(null);
            }}
            studentId={selectedStudentForGuardian.id}
            studentName={selectedStudentForGuardian.name}
            institutionId={institutionId}
          />
        ) : (
          <GuardianManagementDialog
            open={guardianDialogOpen}
            onClose={() => {
              setGuardianDialogOpen(false);
              setSelectedStudentForGuardian(null);
            }}
            studentId={selectedStudentForGuardian.id}
            studentName={selectedStudentForGuardian.name}
            institutionId={institutionId}
          />
        )
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteDialogOpen(false);
            setStudentToDelete(null);
          }
        }}
      >
        <DialogTitle>Delete Student</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete <strong>{studentToDelete?.name}</strong>? This action cannot be undone. All related records (guardians, attendance, etc.) will also be deleted.
        </DialogDescription>
        <DialogActions>
          <Button
            plain
            onClick={() => {
              setDeleteDialogOpen(false);
              setStudentToDelete(null);
            }}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={handleDeleteStudent}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Student'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          if (!updating) {
            setEditDialogOpen(false);
            setStudentToEdit(null);
          }
        }}
      >
        <DialogTitle>Edit Student</DialogTitle>
        <DialogDescription>
          Update student information. Only modified fields will be updated.
        </DialogDescription>
        <form onSubmit={handleUpdateStudent}>
          <DialogBody>
            <div className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <Label>First Name</Label>
                  <Input
                    type="text"
                    value={studentToEdit?.firstName || ''}
                    onChange={(e) =>
                      setStudentToEdit((prev) => prev ? { ...prev, firstName: e.target.value } : null)
                    }
                    disabled={updating}
                    required
                  />
                </Field>
                <Field>
                  <Label>Middle Name</Label>
                  <Input
                    type="text"
                    value={studentToEdit?.middleName || ''}
                    onChange={(e) =>
                      setStudentToEdit((prev) => prev ? { ...prev, middleName: e.target.value } : null)
                    }
                    disabled={updating}
                  />
                </Field>
                <Field>
                  <Label>Last Name</Label>
                  <Input
                    type="text"
                    value={studentToEdit?.lastName || ''}
                    onChange={(e) =>
                      setStudentToEdit((prev) => prev ? { ...prev, lastName: e.target.value } : null)
                    }
                    disabled={updating}
                    required
                  />
                </Field>
              </div>

              {/* Email & Phone - Only for University/College */}
              {isUniversity && (
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={studentToEdit?.email || ''}
                      onChange={(e) =>
                        setStudentToEdit((prev) => prev ? { ...prev, email: e.target.value } : null)
                      }
                      disabled={updating}
                    />
                  </Field>
                  <Field>
                    <Label>Phone Number</Label>
                    <Input
                      type="tel"
                      value={studentToEdit?.phoneNumber || ''}
                      onChange={(e) =>
                        setStudentToEdit((prev) => prev ? { ...prev, phoneNumber: e.target.value } : null)
                      }
                      disabled={updating}
                    />
                  </Field>
                </div>
              )}

              {/* Gender & Date of Birth */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>Gender</Label>
                  <Input
                    type="text"
                    value={studentToEdit?.gender || ''}
                    onChange={(e) =>
                      setStudentToEdit((prev) => prev ? { ...prev, gender: e.target.value } : null)
                    }
                    disabled={updating}
                    placeholder="Male/Female/Other"
                  />
                </Field>
                <Field>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={studentToEdit?.dateOfBirth || ''}
                    onChange={(e) =>
                      setStudentToEdit((prev) => prev ? { ...prev, dateOfBirth: e.target.value } : null)
                    }
                    disabled={updating}
                  />
                </Field>
              </div>

              {/* Grade Level & Class Section */}
              {fieldLabels.shouldShowGradeLevel && (
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label>{fieldLabels.gradeLevelLabel}</Label>
                    <Input
                      type="text"
                      value={studentToEdit?.gradeLevel || ''}
                      onChange={(e) =>
                        setStudentToEdit((prev) => prev ? { ...prev, gradeLevel: e.target.value } : null)
                      }
                      disabled={updating}
                    />
                  </Field>
                  {fieldLabels.shouldShowClassSection && (
                    <Field>
                      <Label>{fieldLabels.classSectionLabel}</Label>
                      <Input
                        type="text"
                        value={studentToEdit?.classSection || ''}
                        onChange={(e) =>
                          setStudentToEdit((prev) => prev ? { ...prev, classSection: e.target.value } : null)
                        }
                        disabled={updating}
                      />
                    </Field>
                  )}
                </div>
              )}
            </div>
          </DialogBody>
          <DialogActions>
            <Button
              plain
              type="button"
              onClick={() => {
                setEditDialogOpen(false);
                setStudentToEdit(null);
              }}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updating}>
              {updating ? 'Updating...' : 'Update Student'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
