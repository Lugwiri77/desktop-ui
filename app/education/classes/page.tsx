'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationLayout } from '@/app/components/application-layout';
import { createLayoutUserInfo } from '@/lib/layout-utils';
import { Heading } from '@/app/components/heading';
import { Text } from '@/app/components/text';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Select } from '@/app/components/select';
import { Field, Label, Description } from '@/app/components/fieldset';
import { Badge } from '@/app/components/badge';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/app/components/dialog';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, isEducationInstitution, isPrimaryOrSecondarySchool, type UserInfo } from '@/lib/roles';
import { getInstitutionClasses, addClass, type InstitutionClass, type AddClassInput } from '@/lib/education-api';
import {
  AcademicCapIcon,
  PlusIcon,
  UserGroupIcon,
} from '@heroicons/react/20/solid';

export default function ClassManagementPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [classes, setClasses] = useState<InstitutionClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Filter state
  const currentYear = new Date().getFullYear();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(`${currentYear}/${currentYear + 1}`);

  // Form state
  const [formLoading, setFormLoading] = useState(false);
  const [className, setClassName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [section, setSection] = useState('');
  const [maxStudents, setMaxStudents] = useState('40');

  const academicYearOptions = [
    { value: `${currentYear - 1}/${currentYear}`, label: `${currentYear - 1}/${currentYear}` },
    { value: `${currentYear}/${currentYear + 1}`, label: `${currentYear}/${currentYear + 1}` },
    { value: `${currentYear + 1}/${currentYear + 2}`, label: `${currentYear + 1}/${currentYear + 2}` },
  ];

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

    if (!isEducationInstitution(info.accountType, info.organizationType)) {
      router.push('/payments');
      return;
    }

    setUserInfo(info);
  }, [router]);

  useEffect(() => {
    if (userInfo?.organizationId) {
      loadClasses();
    }
  }, [userInfo, selectedAcademicYear]);

  const loadClasses = async () => {
    if (!userInfo?.organizationId) return;

    setLoading(true);
    try {
      const data = await getInstitutionClasses(userInfo.organizationId, selectedAcademicYear);
      setClasses(data);
    } catch (error) {
      console.error('Failed to load classes:', error);
      alert('Failed to load classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    console.log('handleCreateClass called');
    console.log('userInfo:', userInfo);

    if (!userInfo?.organizationId) {
      console.error('No institution ID', userInfo);
      alert('Institution ID not found');
      return;
    }

    if (!className.trim()) {
      console.warn('No class name');
      alert('Please enter a class name');
      return;
    }

    if (!gradeLevel.trim()) {
      console.warn('No grade level');
      alert('Please enter a grade level');
      return;
    }

    console.log('Starting class creation...', {
      className,
      gradeLevel,
      section,
      academicYear: selectedAcademicYear,
      maxStudents,
    });

    setFormLoading(true);
    try {
      const input: AddClassInput = {
        institutionId: userInfo.organizationId,
        className: className.trim(),
        gradeLevel: gradeLevel.trim(),
        section: section.trim() || undefined,
        academicYear: selectedAcademicYear,
        maxStudents: parseInt(maxStudents) || 40,
      };

      console.log('Calling addClass with input:', input);
      const result = await addClass(input);
      console.log('Class created successfully:', result);

      // Reset form
      setClassName('');
      setGradeLevel('');
      setSection('');
      setMaxStudents('40');
      setShowCreateDialog(false);

      // Reload classes
      await loadClasses();
      alert('Class created successfully!');
    } catch (error: any) {
      console.error('Failed to create class:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      alert(error.message || 'Failed to create class. Please check the console for details.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.clear();
      router.push('/login');
    }
  };

  if (!userInfo) {
    return null;
  }

  // Group classes by grade level
  const classesByGrade = classes.reduce((acc, cls) => {
    const grade = cls.gradeLevel || 'Unknown';
    if (!acc[grade]) {
      acc[grade] = [];
    }
    acc[grade].push(cls);
    return acc;
  }, {} as Record<string, InstitutionClass[]>);

  const totalStudents = classes.reduce((sum, cls) => sum + cls.currentStudents, 0);

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Heading>Class Management</Heading>
              <Text className="mt-2">
                Manage classes and grade levels for your institution
              </Text>
            </div>
            <Button color="blue" onClick={() => setShowCreateDialog(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Class
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center">
                <AcademicCapIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <Text className="text-sm">Total Classes</Text>
                  <Heading level={2} className="mt-1">{classes.length}</Heading>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center">
                <UserGroupIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <Text className="text-sm">Total Students</Text>
                  <Heading level={2} className="mt-1">{totalStudents}</Heading>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center">
                <AcademicCapIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <Text className="text-sm">Grade Levels</Text>
                  <Heading level={2} className="mt-1">{Object.keys(classesByGrade).length}</Heading>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex items-center gap-4">
            <Field>
              <Label>Academic Year</Label>
              <Select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
              >
                {academicYearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        {/* Classes List */}
        {loading ? (
          <div className="text-center py-12">
            <Text>Loading classes...</Text>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-12 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-zinc-400" />
            <Heading level={3} className="mt-4">No classes registered</Heading>
            <Text className="mt-2">
              Get started by creating your first class for the {selectedAcademicYear} academic year.
            </Text>
            <Button color="blue" className="mt-6" onClick={() => setShowCreateDialog(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Class
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(classesByGrade).sort().map(([grade, gradeClasses]) => (
              <div key={grade} className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between mb-4">
                  <Heading level={3}>{grade}</Heading>
                  <Badge color="blue">{gradeClasses.length} {gradeClasses.length === 1 ? 'Class' : 'Classes'}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gradeClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Text className="font-medium">{cls.className}</Text>
                          {cls.section && (
                            <Text className="text-sm text-zinc-500 mt-1">Section {cls.section}</Text>
                          )}
                        </div>
                        {cls.isActive ? (
                          <Badge color="green">Active</Badge>
                        ) : (
                          <Badge color="zinc">Inactive</Badge>
                        )}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <Text className="text-xs text-zinc-500">Students</Text>
                          <Text className="font-medium">{cls.currentStudents}/{cls.maxStudents || '∞'}</Text>
                        </div>
                        <div>
                          <Text className="text-xs text-zinc-500">Academic Year</Text>
                          <Text className="font-medium">{cls.academicYear}</Text>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Class Dialog */}
        <Dialog open={showCreateDialog} onClose={setShowCreateDialog}>
          <DialogTitle>Add New Class</DialogTitle>
          <DialogDescription>
            Create a new class for your institution
          </DialogDescription>
          <DialogBody>
            <div className="space-y-4">
              <Field>
                <Label>Class Name *</Label>
                <Input
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g., Grade 10A, Form 3B, Year 5 Blue"
                />
                <Description>A descriptive name for the class</Description>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>Grade Level *</Label>
                  <Input
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="e.g., Grade 10, Form 3"
                  />
                  <Description>The grade or year level</Description>
                </Field>

                <Field>
                  <Label>Section (Optional)</Label>
                  <Input
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g., A, B, Blue"
                  />
                  <Description>Class section identifier</Description>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>Academic Year</Label>
                  <Select
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  >
                    {academicYearOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field>
                  <Label>Max Students</Label>
                  <Input
                    type="number"
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(e.target.value)}
                    placeholder="40"
                    min="1"
                  />
                  <Description>Maximum capacity</Description>
                </Field>
              </div>
            </div>
          </DialogBody>
          <DialogActions>
            <Button color="white" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button color="blue" onClick={handleCreateClass} disabled={formLoading}>
              {formLoading ? 'Creating...' : 'Create Class'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ApplicationLayout>
  );
}
