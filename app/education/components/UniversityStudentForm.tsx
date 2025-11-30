'use client';

import React, { useState } from 'react';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { Select } from '../../components/select';
import { Fieldset, Legend, FieldGroup, Field, Label, Description, ErrorMessage } from '../../components/fieldset';
import { Heading, Subheading } from '../../components/heading';
import { Text, Strong } from '../../components/text';
import { Divider } from '../../components/divider';
import type { UniversityStudentDetails, NextOfKin } from '../../../types/education';

interface UniversityStudentFormProps {
  studentId: string;
  institutionId: string;
  existingDetails?: UniversityStudentDetails;
  onSuccess?: (details: UniversityStudentDetails) => void;
  onCancel?: () => void;
}

const relationshipOptions = [
  { value: '', label: 'Select relationship' },
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'partner', label: 'Partner' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' },
];

/**
 * University Student Form - For University/College Students ONLY
 *
 * This form collects comprehensive university student information including:
 * - Next of kin (emergency contact)
 * - Academic details (major, GPA, credits)
 * - Academic advisor
 * - Financial aid (optional)
 * - Campus life (optional)
 */
export default function UniversityStudentForm({
  studentId,
  institutionId,
  existingDetails,
  onSuccess,
  onCancel,
}: UniversityStudentFormProps) {
  const [formData, setFormData] = useState({
    // Next of Kin (Required)
    nextOfKinName: existingDetails?.nextOfKin?.name || '',
    nextOfKinRelationship: existingDetails?.nextOfKin?.relationship || '',
    nextOfKinPhone: existingDetails?.nextOfKin?.phone || '',
    nextOfKinEmail: existingDetails?.nextOfKin?.email || '',
    nextOfKinAddress: existingDetails?.nextOfKin?.address || '',

    // Academic Information
    yearOfStudy: existingDetails?.yearOfStudy?.toString() || '',
    semester: existingDetails?.semester || '',
    major: existingDetails?.major || '',
    minor: existingDetails?.minor || '',
    degreeProgram: existingDetails?.degreeProgram || '',
    expectedGraduationDate: existingDetails?.expectedGraduationDate || '',

    // Academic Advisor (Optional)
    advisorName: existingDetails?.advisor?.name || '',
    advisorEmail: existingDetails?.advisor?.email || '',
    advisorPhone: existingDetails?.advisor?.phone || '',
    advisorOfficeLocation: existingDetails?.advisor?.officeLocation || '',

    // Financial (Optional)
    scholarshipName: existingDetails?.financialAid?.scholarshipName || '',
    scholarshipAmount: existingDetails?.financialAid?.scholarshipAmount?.toString() || '',

    // Campus Life (Optional)
    dormBuilding: existingDetails?.campusLife?.dormBuilding || '',
    dormRoom: existingDetails?.campusLife?.dormRoom || '',
    mealPlanType: existingDetails?.campusLife?.mealPlanType || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear field-specific error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
    setError(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Next of Kin validation
    if (!formData.nextOfKinName.trim()) {
      errors.nextOfKinName = 'Next of kin name is required';
    }

    if (!formData.nextOfKinPhone.trim()) {
      errors.nextOfKinPhone = 'Next of kin phone number is required';
    } else {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.nextOfKinPhone)) {
        errors.nextOfKinPhone = 'Please enter a valid phone number';
      }
    }

    // Email validations
    if (formData.nextOfKinEmail && formData.nextOfKinEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.nextOfKinEmail)) {
        errors.nextOfKinEmail = 'Please enter a valid email address';
      }
    }

    if (formData.advisorEmail && formData.advisorEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.advisorEmail)) {
        errors.advisorEmail = 'Please enter a valid email address';
      }
    }

    // Year of study validation
    if (formData.yearOfStudy) {
      const year = parseInt(formData.yearOfStudy);
      if (isNaN(year) || year < 1 || year > 10) {
        errors.yearOfStudy = 'Year of study must be between 1 and 10';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const mutation = `
        mutation AddUniversityDetails($input: AddUniversityDetailsInput!) {
          addUniversityDetails(input: $input) {
            studentId
            yearOfStudy
            semester
            major
            minor
            degreeProgram
            nextOfKinName
            nextOfKinPhone
            nextOfKinEmail
          }
        }
      `;

      const variables = {
        input: {
          studentId,
          // Next of Kin
          nextOfKinName: formData.nextOfKinName,
          nextOfKinRelationship: formData.nextOfKinRelationship || null,
          nextOfKinPhone: formData.nextOfKinPhone,
          nextOfKinEmail: formData.nextOfKinEmail || null,
          nextOfKinAddress: formData.nextOfKinAddress || null,

          // Academic Information
          yearOfStudy: formData.yearOfStudy ? parseInt(formData.yearOfStudy) : null,
          semester: formData.semester || null,
          major: formData.major || null,
          minor: formData.minor || null,
          degreeProgram: formData.degreeProgram || null,
          expectedGraduationDate: formData.expectedGraduationDate || null,

          // Academic Advisor
          advisorName: formData.advisorName || null,
          advisorEmail: formData.advisorEmail || null,
          advisorPhone: formData.advisorPhone || null,
          advisorOfficeLocation: formData.advisorOfficeLocation || null,

          // Financial
          scholarshipName: formData.scholarshipName || null,
          scholarshipAmount: formData.scholarshipAmount ? parseFloat(formData.scholarshipAmount) : null,

          // Campus Life
          dormBuilding: formData.dormBuilding || null,
          dormRoom: formData.dormRoom || null,
          mealPlanType: formData.mealPlanType || null,
        },
      };

      const response = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: mutation,
          variables,
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      setSuccess(true);
      if (onSuccess) {
        // Build the response object
        const details: UniversityStudentDetails = {
          studentId,
          yearOfStudy: formData.yearOfStudy ? parseInt(formData.yearOfStudy) : undefined,
          semester: formData.semester || undefined,
          major: formData.major || undefined,
          minor: formData.minor || undefined,
          degreeProgram: formData.degreeProgram || undefined,
          expectedGraduationDate: formData.expectedGraduationDate || undefined,
          totalCreditsEarned: existingDetails?.totalCreditsEarned || 0,
          nextOfKin: {
            name: formData.nextOfKinName,
            relationship: formData.nextOfKinRelationship || undefined,
            phone: formData.nextOfKinPhone,
            email: formData.nextOfKinEmail || undefined,
            address: formData.nextOfKinAddress || undefined,
          },
          advisor: formData.advisorName
            ? {
                name: formData.advisorName,
                email: formData.advisorEmail,
                phone: formData.advisorPhone,
                officeLocation: formData.advisorOfficeLocation,
              }
            : undefined,
          financialAid: formData.scholarshipName
            ? {
                scholarshipName: formData.scholarshipName,
                scholarshipAmount: formData.scholarshipAmount ? parseFloat(formData.scholarshipAmount) : undefined,
              }
            : undefined,
          campusLife: formData.dormBuilding
            ? {
                dormBuilding: formData.dormBuilding,
                dormRoom: formData.dormRoom,
                mealPlanType: formData.mealPlanType,
              }
            : undefined,
        };
        onSuccess(details);
      }
    } catch (err) {
      console.error('Error saving university student details:', err);
      setError(err instanceof Error ? err.message : 'Failed to save university student details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-zinc-950/10 pb-6 dark:border-white/10">
        <Heading>University Student Details</Heading>
        <Text className="mt-2">
          Complete information for <Strong>University/College</Strong> students.
        </Text>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
          <div className="flex items-center">
            <svg
              className="mr-3 size-5 text-green-600 dark:text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <Text className="text-green-800 dark:text-green-200">University student details saved successfully!</Text>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <div className="flex items-start">
            <svg
              className="mr-3 mt-0.5 size-5 flex-shrink-0 text-red-600 dark:text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <Text className="text-red-800 dark:text-red-200">{error}</Text>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Next of Kin Section */}
        <div>
          <Subheading>Next of Kin (Emergency Contact)</Subheading>
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
            <div className="flex items-start">
              <svg
                className="mr-3 mt-0.5 size-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold">Emergency Contact Only</p>
                <p className="mt-1">
                  This person will NOT have guardian privileges, app access, or ability to view grades.
                </p>
              </div>
            </div>
          </div>

          <Fieldset className="mt-6">
            <FieldGroup>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
                <Field>
                  <Label>
                    Full Name <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="nextOfKinName"
                    value={formData.nextOfKinName}
                    onChange={(e) => handleChange('nextOfKinName', e.target.value)}
                    placeholder="e.g., Jane Smith"
                    disabled={loading}
                    invalid={!!fieldErrors.nextOfKinName}
                    required
                  />
                  {fieldErrors.nextOfKinName && <ErrorMessage>{fieldErrors.nextOfKinName}</ErrorMessage>}
                </Field>

                <Field>
                  <Label>Relationship</Label>
                  <Select
                    name="nextOfKinRelationship"
                    value={formData.nextOfKinRelationship}
                    onChange={(e) => handleChange('nextOfKinRelationship', e.target.value)}
                    disabled={loading}
                  >
                    {relationshipOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
                <Field>
                  <Label>
                    Phone Number <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="tel"
                    name="nextOfKinPhone"
                    value={formData.nextOfKinPhone}
                    onChange={(e) => handleChange('nextOfKinPhone', e.target.value)}
                    placeholder="e.g., +1 (555) 123-4567"
                    disabled={loading}
                    invalid={!!fieldErrors.nextOfKinPhone}
                    required
                  />
                  {fieldErrors.nextOfKinPhone && <ErrorMessage>{fieldErrors.nextOfKinPhone}</ErrorMessage>}
                </Field>

                <Field>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    name="nextOfKinEmail"
                    value={formData.nextOfKinEmail}
                    onChange={(e) => handleChange('nextOfKinEmail', e.target.value)}
                    placeholder="e.g., jane@example.com"
                    disabled={loading}
                    invalid={!!fieldErrors.nextOfKinEmail}
                  />
                  {fieldErrors.nextOfKinEmail && <ErrorMessage>{fieldErrors.nextOfKinEmail}</ErrorMessage>}
                </Field>
              </div>

              <Field>
                <Label>Address</Label>
                <Input
                  type="text"
                  name="nextOfKinAddress"
                  value={formData.nextOfKinAddress}
                  onChange={(e) => handleChange('nextOfKinAddress', e.target.value)}
                  placeholder="Street address, city, state, zip code"
                  disabled={loading}
                />
                <Description>Optional</Description>
              </Field>
            </FieldGroup>
          </Fieldset>
        </div>

        <Divider />

        {/* Academic Information */}
        <Fieldset>
          <Legend>Academic Information</Legend>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-4">
              <Field>
                <Label>Year of Study</Label>
                <Input
                  type="number"
                  name="yearOfStudy"
                  value={formData.yearOfStudy}
                  onChange={(e) => handleChange('yearOfStudy', e.target.value)}
                  placeholder="e.g., 2"
                  min="1"
                  max="10"
                  disabled={loading}
                  invalid={!!fieldErrors.yearOfStudy}
                />
                {fieldErrors.yearOfStudy && <ErrorMessage>{fieldErrors.yearOfStudy}</ErrorMessage>}
                <Description>1 = Freshman, 2 = Sophomore, etc.</Description>
              </Field>

              <Field>
                <Label>Semester</Label>
                <Input
                  type="text"
                  name="semester"
                  value={formData.semester}
                  onChange={(e) => handleChange('semester', e.target.value)}
                  placeholder="e.g., Fall 2024"
                  disabled={loading}
                />
              </Field>

              <Field>
                <Label>Expected Graduation</Label>
                <Input
                  type="month"
                  name="expectedGraduationDate"
                  value={formData.expectedGraduationDate}
                  onChange={(e) => handleChange('expectedGraduationDate', e.target.value)}
                  disabled={loading}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
              <Field>
                <Label>Major</Label>
                <Input
                  type="text"
                  name="major"
                  value={formData.major}
                  onChange={(e) => handleChange('major', e.target.value)}
                  placeholder="e.g., Computer Science"
                  disabled={loading}
                />
              </Field>

              <Field>
                <Label>Minor</Label>
                <Input
                  type="text"
                  name="minor"
                  value={formData.minor}
                  onChange={(e) => handleChange('minor', e.target.value)}
                  placeholder="e.g., Mathematics"
                  disabled={loading}
                />
                <Description>Optional</Description>
              </Field>
            </div>

            <Field>
              <Label>Degree Program</Label>
              <Input
                type="text"
                name="degreeProgram"
                value={formData.degreeProgram}
                onChange={(e) => handleChange('degreeProgram', e.target.value)}
                placeholder="e.g., Bachelor of Science, Master of Arts"
                disabled={loading}
              />
            </Field>
          </FieldGroup>
        </Fieldset>

        <Divider />

        {/* Academic Advisor */}
        <Fieldset>
          <Legend>Academic Advisor (Optional)</Legend>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
              <Field>
                <Label>Advisor Name</Label>
                <Input
                  type="text"
                  name="advisorName"
                  value={formData.advisorName}
                  onChange={(e) => handleChange('advisorName', e.target.value)}
                  placeholder="e.g., Dr. John Smith"
                  disabled={loading}
                />
              </Field>

              <Field>
                <Label>Advisor Email</Label>
                <Input
                  type="email"
                  name="advisorEmail"
                  value={formData.advisorEmail}
                  onChange={(e) => handleChange('advisorEmail', e.target.value)}
                  placeholder="e.g., jsmith@university.edu"
                  disabled={loading}
                  invalid={!!fieldErrors.advisorEmail}
                />
                {fieldErrors.advisorEmail && <ErrorMessage>{fieldErrors.advisorEmail}</ErrorMessage>}
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
              <Field>
                <Label>Advisor Phone</Label>
                <Input
                  type="tel"
                  name="advisorPhone"
                  value={formData.advisorPhone}
                  onChange={(e) => handleChange('advisorPhone', e.target.value)}
                  placeholder="e.g., +1 (555) 987-6543"
                  disabled={loading}
                />
              </Field>

              <Field>
                <Label>Office Location</Label>
                <Input
                  type="text"
                  name="advisorOfficeLocation"
                  value={formData.advisorOfficeLocation}
                  onChange={(e) => handleChange('advisorOfficeLocation', e.target.value)}
                  placeholder="e.g., Building A, Room 305"
                  disabled={loading}
                />
              </Field>
            </div>
          </FieldGroup>
        </Fieldset>

        <Divider />

        {/* Financial Aid */}
        <Fieldset>
          <Legend>Financial Aid (Optional)</Legend>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
              <Field>
                <Label>Scholarship Name</Label>
                <Input
                  type="text"
                  name="scholarshipName"
                  value={formData.scholarshipName}
                  onChange={(e) => handleChange('scholarshipName', e.target.value)}
                  placeholder="e.g., Merit Scholarship"
                  disabled={loading}
                />
              </Field>

              <Field>
                <Label>Scholarship Amount</Label>
                <Input
                  type="number"
                  name="scholarshipAmount"
                  value={formData.scholarshipAmount}
                  onChange={(e) => handleChange('scholarshipAmount', e.target.value)}
                  placeholder="e.g., 5000"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
                <Description>Annual amount in dollars</Description>
              </Field>
            </div>
          </FieldGroup>
        </Fieldset>

        <Divider />

        {/* Campus Life */}
        <Fieldset>
          <Legend>Campus Life (Optional)</Legend>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-4">
              <Field>
                <Label>Dorm Building</Label>
                <Input
                  type="text"
                  name="dormBuilding"
                  value={formData.dormBuilding}
                  onChange={(e) => handleChange('dormBuilding', e.target.value)}
                  placeholder="e.g., North Hall"
                  disabled={loading}
                />
              </Field>

              <Field>
                <Label>Room Number</Label>
                <Input
                  type="text"
                  name="dormRoom"
                  value={formData.dormRoom}
                  onChange={(e) => handleChange('dormRoom', e.target.value)}
                  placeholder="e.g., 402B"
                  disabled={loading}
                />
              </Field>

              <Field>
                <Label>Meal Plan</Label>
                <Input
                  type="text"
                  name="mealPlanType"
                  value={formData.mealPlanType}
                  onChange={(e) => handleChange('mealPlanType', e.target.value)}
                  placeholder="e.g., 14 meals/week"
                  disabled={loading}
                />
              </Field>
            </div>
          </FieldGroup>
        </Fieldset>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 border-t border-zinc-950/10 pt-8 dark:border-white/10">
          {onCancel && (
            <Button type="button" plain onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : existingDetails ? 'Update Details' : 'Save Details'}
          </Button>
        </div>
      </form>
    </div>
  );
}
