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
import { Field, Label } from '@/app/components/fieldset';
import { Badge } from '@/app/components/badge';
import { isAuthenticated, logout } from '@/lib/api';
import { loadUserInfo, isEducationInstitution, type UserInfo } from '@/lib/roles';
import { formatCurrency } from '@/lib/formatting-utils';
import { getGradeLevels, getFeeStructures, generateFeeInvoices } from '@/lib/education-api';
import {
  DocumentTextIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/20/solid';

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  currency: string;
}

interface ClassGrade {
  id: string;
  name: string;
  studentCount: number;
  gradeLevel?: string;
  classSection?: string;
}

export default function BulkInvoicePage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [classGrades, setClassGrades] = useState<ClassGrade[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('');
  const [selectedFees, setSelectedFees] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const currentYear = new Date().getFullYear();
  const [term, setTerm] = useState('TERM_1');
  const [academicYear, setAcademicYear] = useState(`${currentYear}/${currentYear + 1}`);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [preview, setPreview] = useState(false);
  const [success, setSuccess] = useState(false);

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

  // Load data when userInfo is available or when academic year/term changes
  useEffect(() => {
    if (userInfo) {
      loadData();
    }
  }, [userInfo, academicYear, term]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      if (!userInfo?.organizationId) {
        console.error('No institution ID found');
        return;
      }

      const [gradesData, feesData] = await Promise.all([
        getGradeLevels(userInfo.organizationId),
        getFeeStructures(userInfo.organizationId, academicYear, term, true),
      ]);

      // Map grades data
      if (gradesData && Array.isArray(gradesData)) {
        const mappedGrades = gradesData.map((grade: any) => ({
          id: `${grade.gradeLevel || 'unknown'}_${grade.classSection || ''}`,
          name: grade.name,
          studentCount: grade.studentCount || 0,
          gradeLevel: grade.gradeLevel,
          classSection: grade.classSection,
        }));
        setClassGrades(mappedGrades);
      }

      // Map fee structures data
      if (feesData && Array.isArray(feesData)) {
        const mappedFees = feesData.map((fee: any) => ({
          id: fee.id,
          name: fee.feeName || fee.name,
          amount: parseFloat(fee.amountKes || fee.amount || '0'),
          currency: 'KES',
        }));
        setFeeStructures(mappedFees);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      // Set empty arrays on error
      setClassGrades([]);
      setFeeStructures([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleFeeToggle = (feeId: string) => {
    setSelectedFees((prev) =>
      prev.includes(feeId) ? prev.filter((id) => id !== feeId) : [...prev, feeId]
    );
  };

  const getTotalAmount = () => {
    return selectedFees.reduce((sum, feeId) => {
      const fee = feeStructures.find((f) => f.id === feeId);
      return sum + (fee?.amount || 0);
    }, 0);
  };

  const getSelectedClass = () => {
    return classGrades.find((c) => c.id === selectedClass);
  };

  const handlePreview = () => {
    if (!selectedClass || selectedFees.length === 0 || !dueDate) {
      alert('Please select class, fees, and due date');
      return;
    }
    setPreview(true);
  };

  const handleGenerate = async () => {
    if (!userInfo?.organizationId) {
      alert('Institution ID not found');
      return;
    }

    const selectedClass = getSelectedClass();
    if (!selectedClass?.gradeLevel) {
      alert('Please select a valid grade/class');
      return;
    }

    setLoading(true);
    try {
      const input = {
        institutionId: userInfo.organizationId,
        feeStructureIds: selectedFees,
        academicYear,
        term,
        gradeLevel: selectedClass.gradeLevel,
        dueDate: dueDate ? new Date(dueDate).toISOString().split('T')[0] : undefined,
        paymentInstructions: notes || undefined,
      };

      const result = await generateFeeInvoices(input);

      if (result && result.invoicesGenerated > 0) {
        setSuccess(true);
      } else {
        alert('No invoices were generated. Please check if students have already been assigned these fees.');
      }
    } catch (error: any) {
      console.error('Failed to generate invoices:', error);
      alert(error.message || 'Failed to generate invoices. Please try again.');
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

  if (success) {
    const classData = getSelectedClass();
    return (
      <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-600" />
          <Heading className="mt-4">Invoices Generated Successfully!</Heading>
          <Text className="mt-4">
            {classData?.studentCount} invoices have been generated for {classData?.name}
          </Text>
          <div className="mt-6 space-y-2">
            <Text className="text-sm text-zinc-600">
              Total Amount per Student: {formatCurrency(getTotalAmount(), 'KES')}
            </Text>
            <Text className="text-sm text-zinc-600">
              Due Date: {new Date(dueDate).toLocaleDateString()}
            </Text>
          </div>
          <div className="mt-8 flex gap-3 justify-center">
            <Button href="/school-fees" color="blue">
              Back to School Fees
            </Button>
            <Button href="/payments/invoices" outline>
              View All Invoices
            </Button>
          </div>
        </div>
      </div>
      </ApplicationLayout>
    );
  }

  if (preview) {
    const classData = getSelectedClass();
    const totalAmount = getTotalAmount();

    return (
      <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button color="white" className="mb-4" onClick={() => setPreview(false)}>
            ← Back to Edit
          </Button>
          <Heading>Invoice Preview</Heading>
          <Text className="mt-2">Review the details before generating invoices</Text>
        </div>

        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6 mb-6">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <Heading level={3} className="text-blue-900">
                Important Notice
              </Heading>
              <Text className="text-sm text-blue-800 mt-2">
                You are about to generate {classData?.studentCount} invoices for{' '}
                {classData?.name}. This action cannot be undone. Please ensure all details are
                correct before proceeding.
              </Text>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 space-y-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <Heading level={3} className="mb-4">
              Invoice Details
            </Heading>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Class/Grade</Text>
                <Text className="font-semibold">{classData?.name}</Text>
              </div>
              <div>
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                  Number of Students
                </Text>
                <Text className="font-semibold">{classData?.studentCount}</Text>
              </div>
              <div>
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Term</Text>
                <Text className="font-semibold">{term}</Text>
              </div>
              <div>
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Academic Year</Text>
                <Text className="font-semibold">{academicYear}</Text>
              </div>
              <div>
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Due Date</Text>
                <Text className="font-semibold">
                  {new Date(dueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <Heading level={3} className="mb-4">
              Fee Breakdown
            </Heading>
            <div className="space-y-3">
              {selectedFees.map((feeId) => {
                const fee = feeStructures.find((f) => f.id === feeId);
                if (!fee) return null;
                return (
                  <div key={feeId} className="flex justify-between items-center">
                    <Text>{fee.name}</Text>
                    <Text className="font-semibold">
                      {formatCurrency(fee.amount, fee.currency)}
                    </Text>
                  </div>
                );
              })}
              <div className="border-t border-zinc-300 pt-3 mt-3 flex justify-between items-center dark:border-zinc-700">
                <Text className="font-bold text-lg">Total Amount</Text>
                <Text className="font-bold text-2xl text-blue-600">
                  {formatCurrency(totalAmount, 'KES')}
                </Text>
              </div>
            </div>
          </div>

          {notes && (
            <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <Heading level={3} className="mb-2">
                Additional Notes
              </Heading>
              <Text className="text-sm">{notes}</Text>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3 justify-end">
          <Button color="white" onClick={() => setPreview(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading} color="blue">
            {loading ? 'Generating...' : `Generate ${classData?.studentCount} Invoices`}
          </Button>
        </div>
      </div>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout userInfo={createLayoutUserInfo(userInfo)} onLogout={handleLogout}>
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button color="white" className="mb-4" onClick={() => router.push('/school-fees')}>
          ← Back to School Fees
        </Button>
        <Heading>Bulk Invoice Generation</Heading>
        <Text className="mt-2">
          Generate invoices for an entire class or grade at once
        </Text>
      </div>

      <div className="space-y-6">
        {/* Class Selection */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <Heading level={3} className="mb-4">
            Step 1: Select Class/Grade
          </Heading>
          <Field>
            <Label>Class/Grade</Label>
            <Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">Select a class...</option>
              {classGrades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name} ({grade.studentCount} students)
                </option>
              ))}
            </Select>
          </Field>
          {selectedClass && (
            <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
              <UserGroupIcon className="h-5 w-5" />
              <Text>
                {getSelectedClass()?.studentCount} students will receive invoices
              </Text>
            </div>
          )}
        </div>

        {/* Fee Selection */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <Heading level={3} className="mb-4">
            Step 2: Select Fees
          </Heading>
          <div className="space-y-3">
            {feeStructures.map((fee) => (
              <label
                key={fee.id}
                className="flex items-center justify-between p-4 border rounded-lg cursor-pointer transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedFees.includes(fee.id)}
                    onChange={() => handleFeeToggle(fee.id)}
                    className="h-4 w-4 text-blue-600 rounded border-zinc-300"
                  />
                  <div>
                    <Text className="font-medium">{fee.name}</Text>
                  </div>
                </div>
                <Text className="font-semibold">{formatCurrency(fee.amount, fee.currency)}</Text>
              </label>
            ))}
          </div>
          {selectedFees.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg dark:bg-blue-950/20">
              <div className="flex justify-between items-center">
                <Text className="font-medium">Total per Student:</Text>
                <Text className="text-xl font-bold text-blue-600">
                  {formatCurrency(getTotalAmount(), 'KES')}
                </Text>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Details */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <Heading level={3} className="mb-4">
            Step 3: Invoice Details
          </Heading>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <Label>Term</Label>
                <Input value={term} onChange={(e) => setTerm(e.target.value)} required />
              </Field>
              <Field>
                <Label>Academic Year</Label>
                <Input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  required
                />
              </Field>
            </div>
            <Field>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </Field>
            <Field>
              <Label>Additional Notes (Optional)</Label>
              <textarea
                className="min-w-0 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information for parents/guardians..."
              />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button color="white" onClick={() => router.push('/school-fees')}>
            Cancel
          </Button>
          <Button
            onClick={handlePreview}
            disabled={!selectedClass || selectedFees.length === 0 || !dueDate}
            color="blue"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Preview Invoices
          </Button>
        </div>
      </div>
    </div>
    </ApplicationLayout>
  );
}
