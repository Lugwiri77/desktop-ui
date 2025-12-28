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
import { Checkbox, CheckboxField } from '@/app/components/checkbox';
import { Badge } from '@/app/components/badge';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, isEducationInstitution, isPrimaryOrSecondarySchool, type UserInfo } from '@/lib/roles';
import { createFeeStructure, getInstitutionClasses, type InstitutionClass } from '@/lib/education-api';
import {
  AcademicCapIcon,
  CheckCircleIcon,
} from '@heroicons/react/20/solid';

const FEE_TYPES = [
  { value: 'TUITION', label: 'Tuition Fee', description: 'Regular tuition charges' },
  { value: 'REGISTRATION', label: 'Registration Fee', description: 'One-time registration' },
  { value: 'ADMISSION', label: 'Admission Fee', description: 'Initial admission fee' },
  { value: 'EXAM', label: 'Examination Fee', description: 'For exams and assessments' },
  { value: 'LIBRARY', label: 'Library Fee', description: 'Library access and resources' },
  { value: 'LABORATORY', label: 'Laboratory Fee', description: 'Lab equipment and materials' },
  { value: 'SPORTS', label: 'Sports Fee', description: 'Sports facilities and equipment' },
  { value: 'TRANSPORT', label: 'Transport Fee', description: 'School transport services' },
  { value: 'MEALS', label: 'Meals Fee', description: 'Cafeteria and meal plans' },
  { value: 'ACCOMMODATION', label: 'Accommodation Fee', description: 'Boarding facilities' },
  { value: 'ACTIVITY', label: 'Activity Fee', description: 'Extra-curricular activities' },
  { value: 'TECHNOLOGY', label: 'Technology Fee', description: 'Computer labs and tech resources' },
  { value: 'UNIFORM', label: 'Uniform Fee', description: 'School uniforms' },
  { value: 'MATERIALS', label: 'Materials Fee', description: 'Books and learning materials' },
  { value: 'FIELD_TRIP', label: 'Field Trip Fee', description: 'Educational excursions' },
  { value: 'GRADUATION', label: 'Graduation Fee', description: 'Graduation ceremony' },
  { value: 'OTHER', label: 'Other Fee', description: 'Miscellaneous charges' },
];

const TERM_OPTIONS = [
  { value: 'TERM_1', label: 'Term 1' },
  { value: 'TERM_2', label: 'Term 2' },
  { value: 'TERM_3', label: 'Term 3' },
  { value: 'SEMESTER_1', label: 'Semester 1' },
  { value: 'SEMESTER_2', label: 'Semester 2' },
  { value: 'QUARTER_1', label: 'Quarter 1' },
  { value: 'QUARTER_2', label: 'Quarter 2' },
  { value: 'QUARTER_3', label: 'Quarter 3' },
  { value: 'QUARTER_4', label: 'Quarter 4' },
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'CUSTOM', label: 'Custom' },
];

// Common grade levels for different institution types
const GRADE_LEVELS = {
  PrimarySchool: ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'],
  SecondarySchool: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
  University: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Masters', 'PhD'],
  College: ['Year 1', 'Year 2', 'Year 3', 'Certificate', 'Diploma'],
  Other: [],
};

export default function CreateFeeStructurePage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);

  // Form state
  const [feeName, setFeeName] = useState('');
  const [feeType, setFeeType] = useState('TUITION');
  const [amount, setAmount] = useState('');
  const currentYear = new Date().getFullYear();
  const [academicYear, setAcademicYear] = useState(`${currentYear}/${currentYear + 1}`);
  const [term, setTerm] = useState('TERM_1');
  const [gradeLevel, setGradeLevel] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [applyToAll, setApplyToAll] = useState(false);
  const [description, setDescription] = useState('');

  // Generate academic year options
  const academicYearOptions = [
    { value: `${currentYear - 1}/${currentYear}`, label: `${currentYear - 1}/${currentYear}` },
    { value: `${currentYear}/${currentYear + 1}`, label: `${currentYear}/${currentYear + 1}` },
    { value: `${currentYear + 1}/${currentYear + 2}`, label: `${currentYear + 1}/${currentYear + 2}` },
  ];

  // Get available grade levels - use real grades from backend, fallback to defaults
  const getAvailableGradeLevels = () => {
    // If we have grades from the backend, use those
    if (availableGrades.length > 0) {
      return availableGrades;
    }

    // Otherwise, fallback to defaults based on institution type
    if (!userInfo) return [];

    const subcategory = userInfo.educationalInstitutionSubcategory;
    if (subcategory === 'PrimarySchool' || subcategory === 'Primary') {
      return GRADE_LEVELS.PrimarySchool;
    } else if (subcategory === 'SecondarySchool' || subcategory === 'Secondary') {
      return GRADE_LEVELS.SecondarySchool;
    } else if (subcategory === 'University') {
      return GRADE_LEVELS.University;
    } else if (subcategory === 'College') {
      return GRADE_LEVELS.College;
    }
    return [];
  };

  // Load available grades from backend
  const loadAvailableGrades = async () => {
    if (!userInfo?.organizationId) return;

    setLoadingGrades(true);
    try {
      const classes = await getInstitutionClasses(userInfo.organizationId, academicYear);

      // Extract unique grade levels from classes
      const uniqueGrades = Array.from(
        new Set(classes.map(c => c.gradeLevel).filter(Boolean))
      ).sort();

      setAvailableGrades(uniqueGrades);
    } catch (error) {
      console.error('Failed to load grade levels:', error);
      // Keep availableGrades empty to use fallback defaults
    } finally {
      setLoadingGrades(false);
    }
  };

  // Get recommended terms based on institution type
  const getRecommendedTerms = () => {
    if (!userInfo) return TERM_OPTIONS;

    const subcategory = userInfo.educationalInstitutionSubcategory;
    if (subcategory === 'PrimarySchool' || subcategory === 'Primary' ||
        subcategory === 'SecondarySchool' || subcategory === 'Secondary') {
      // Primary and Secondary schools typically use terms
      return TERM_OPTIONS.filter(t => t.value.startsWith('TERM_') || t.value === 'ANNUAL');
    } else if (subcategory === 'University' || subcategory === 'College') {
      // Universities and colleges typically use semesters
      return TERM_OPTIONS.filter(t => t.value.startsWith('SEMESTER_') || t.value === 'ANNUAL');
    }
    return TERM_OPTIONS;
  };

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

  // Load grades when user info or academic year changes
  useEffect(() => {
    if (userInfo?.organizationId) {
      loadAvailableGrades();
    }
  }, [userInfo, academicYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInfo?.organizationId) {
      alert('Institution ID not found');
      return;
    }

    // Validation
    if (!feeName.trim()) {
      alert('Please enter a fee name');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!applyToAll && !gradeLevel) {
      alert('Please select a grade level or choose "Apply to all grades"');
      return;
    }

    setLoading(true);
    try {
      const input = {
        institutionId: userInfo.organizationId,
        feeName: feeName.trim(),
        feeType,
        amountKes: parseFloat(amount),
        academicYear,
        term,
        gradeLevel: applyToAll ? null : gradeLevel,
        isMandatory,
        description: description.trim() || null,
      };

      const result = await createFeeStructure(input);

      if (result && result.id) {
        setSuccess(true);
      } else {
        alert('Failed to create fee structure');
      }
    } catch (error: any) {
      console.error('Failed to create fee structure:', error);
      alert(error.message || 'Failed to create fee structure. Please try again.');
    } finally {
      setLoading(false);
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

  const getSchoolTypeLabel = () => {
    if (isPrimaryOrSecondarySchool(userInfo)) {
      return userInfo.educationalInstitutionSubcategory === 'PrimarySchool'
        ? 'Primary School'
        : 'Secondary School';
    }
    return userInfo.educationalInstitutionSubcategory || 'Educational Institution';
  };

  if (success) {
    return (
      <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-600" />
            <Heading className="mt-4">Fee Structure Created Successfully!</Heading>
            <Text className="mt-4">
              The fee structure "{feeName}" has been created and is now active.
            </Text>
            <div className="mt-8 flex gap-3 justify-center">
              <Button href="/school-fees" color="blue">
                Back to School Fees
              </Button>
              <Button href="/school-fees/structure/create" outline>
                Create Another
              </Button>
            </div>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button href="/school-fees" color="white" className="mb-4">
            ← Back to School Fees
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <Heading>Create Fee Structure</Heading>
              <Text className="mt-2">
                Define a new fee structure for your institution
              </Text>
              <Badge color="blue" className="mt-2">{getSchoolTypeLabel()}</Badge>
            </div>
            <AcademicCapIcon className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <Heading level={3} className="mb-6">Basic Information</Heading>

            <div className="space-y-6">
              <Field>
                <Label>Fee Name *</Label>
                <Input
                  value={feeName}
                  onChange={(e) => setFeeName(e.target.value)}
                  placeholder="e.g., Term 1 Tuition Fee"
                  required
                />
                <Description>Give this fee structure a descriptive name</Description>
              </Field>

              <Field>
                <Label>Fee Type *</Label>
                <Select value={feeType} onChange={(e) => setFeeType(e.target.value)} required>
                  {FEE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field>
                <Label>Amount (KES) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="45000.00"
                  required
                />
                <Description>Enter the fee amount in Kenya Shillings</Description>
              </Field>

              <Field>
                <Label>Description (Optional)</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional information about this fee..."
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </Field>
            </div>
          </div>

          {/* Academic Period */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <Heading level={3} className="mb-6">Academic Period</Heading>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <Label>Academic Year *</Label>
                <Select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} required>
                  {academicYearOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field>
                <Label>Term / Semester *</Label>
                <Select value={term} onChange={(e) => setTerm(e.target.value)} required>
                  {getRecommendedTerms().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          {/* Grade Level */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <Heading level={3} className="mb-6">Applicable Grades</Heading>

            <div className="space-y-4">
              <CheckboxField>
                <Checkbox
                  checked={applyToAll}
                  onChange={(checked) => {
                    setApplyToAll(checked);
                    if (checked) setGradeLevel('');
                  }}
                />
                <Label>Apply to all grades</Label>
                <Description>This fee applies to all students regardless of grade level</Description>
              </CheckboxField>

              {!applyToAll && (
                <Field>
                  <Label>Select Grade Level *</Label>
                  <Select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    required={!applyToAll}
                    disabled={applyToAll || loadingGrades}
                  >
                    <option value="">{loadingGrades ? 'Loading grades...' : 'Select a grade...'}</option>
                    {getAvailableGradeLevels().map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </Select>
                  <Description>
                    {getAvailableGradeLevels().length === 0 && !loadingGrades
                      ? availableGrades.length === 0
                        ? 'No classes registered yet. Using default grades for your institution type, or you can create classes first.'
                        : 'No grade levels configured for your institution type'
                      : 'Select the grade level this fee applies to'}
                  </Description>
                </Field>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <Heading level={3} className="mb-6">Fee Settings</Heading>

            <div className="space-y-4">
              <CheckboxField>
                <Checkbox checked={isMandatory} onChange={setIsMandatory} />
                <Label>Mandatory Fee</Label>
                <Description>Students must pay this fee to remain enrolled</Description>
              </CheckboxField>

              <CheckboxField>
                <Checkbox checked={isActive} onChange={setIsActive} />
                <Label>Active</Label>
                <Description>Only active fee structures can be assigned to students</Description>
              </CheckboxField>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <Button type="button" color="white" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" color="blue" disabled={loading}>
              {loading ? 'Creating...' : 'Create Fee Structure'}
            </Button>
          </div>
        </form>
      </div>
    </ApplicationLayout>
  );
}
