'use client';

import React, { useState } from 'react';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { Select } from '../../components/select';
import { Checkbox, CheckboxField, CheckboxGroup } from '../../components/checkbox';
import { Fieldset, Legend, FieldGroup, Field, Label, Description, ErrorMessage } from '../../components/fieldset';
import { Heading } from '../../components/heading';
import { Text, Strong } from '../../components/text';
import { graphql } from '@/lib/graphql';
import type { Guardian, GuardianRelationshipType } from '../../../types/education';

interface GuardianFormProps {
  studentId: string;
  institutionId: string;
  existingGuardian?: Guardian;
  onSuccess?: (guardian: Guardian) => void;
  onCancel?: () => void;
}

const relationshipOptions: { value: GuardianRelationshipType; label: string }[] = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'stepmother', label: 'Stepmother' },
  { value: 'stepfather', label: 'Stepfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'legal_guardian', label: 'Legal Guardian' },
  { value: 'foster_parent', label: 'Foster Parent' },
  { value: 'other', label: 'Other Relative/Guardian' },
];

/**
 * Guardian Form - For Primary/Secondary/Special Education Students ONLY
 *
 * This form collects guardian information for minor students.
 *
 * IMPORTANT: Guardians have legal authority and app access:
 * - Can view student data (grades, attendance, location)
 * - Can authorize pickup persons
 * - Receive real-time notifications
 * - Auto-linked to personal account if email matches
 */
export default function GuardianForm({
  studentId,
  institutionId,
  existingGuardian,
  onSuccess,
  onCancel,
}: GuardianFormProps) {
  const [formData, setFormData] = useState({
    guardianFullName: existingGuardian?.guardianFullName || '',
    guardianPhone: existingGuardian?.guardianPhone || '',
    guardianEmail: existingGuardian?.guardianEmail || '',
    relationshipType: existingGuardian?.relationshipType || ('' as GuardianRelationshipType | ''),
    isPrimaryGuardian: true, // Default to true for first guardian added
    canPickup: existingGuardian?.canPickup ?? true,
    canAuthorizeOthers: existingGuardian?.canAuthorizeOthers ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear field-specific error when user starts typing
    if (typeof value === 'string' && fieldErrors[field]) {
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

    if (!formData.guardianFullName.trim()) {
      errors.guardianFullName = 'Guardian name is required';
    }

    if (!formData.guardianPhone.trim()) {
      errors.guardianPhone = 'Phone number is required';
    } else {
      // Basic phone validation
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.guardianPhone)) {
        errors.guardianPhone = 'Please enter a valid phone number';
      }
    }

    if (!formData.relationshipType) {
      errors.relationshipType = 'Relationship is required';
    }

    // Email validation if provided
    if (formData.guardianEmail && formData.guardianEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.guardianEmail)) {
        errors.guardianEmail = 'Please enter a valid email address';
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
        guardianFullName: formData.guardianFullName,
        guardianPhone: formData.guardianPhone,
        guardianEmail: formData.guardianEmail || null,
        relationshipType: formData.relationshipType,
        isPrimaryGuardian: formData.isPrimaryGuardian,
        canPickup: formData.canPickup,
        canAuthorizeOthers: formData.canAuthorizeOthers,
        guardianPersonalAccountId: null,
        guardianIdPassportNumber: null,
      };

      const result = await graphql<{ addGuardianRelationship: { success: boolean; message: string } }>(
        mutation,
        { input }
      );

      if (result.addGuardianRelationship.success) {
        setSuccess(true);
        if (onSuccess) {
          // Create a temporary Guardian object for the callback
          const guardianData: Guardian = {
            id: '', // Backend doesn't return ID, will be populated on next fetch
            guardianPersonalAccountId: undefined,
            guardianFullName: formData.guardianFullName,
            guardianPhone: formData.guardianPhone,
            guardianEmail: formData.guardianEmail,
            relationshipType: formData.relationshipType as GuardianRelationshipType,
            canPickup: formData.canPickup,
            canAuthorizeOthers: formData.canAuthorizeOthers,
            isActive: true,
          };
          onSuccess(guardianData);
        }
      } else {
        throw new Error(result.addGuardianRelationship.message);
      }
    } catch (err) {
      console.error('Error saving guardian:', err);
      setError(err instanceof Error ? err.message : 'Failed to save guardian information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-950/10 pb-6 dark:border-white/10">
        <Heading>Parent/Guardian Information</Heading>
        <Text className="mt-2">
          For <Strong>Primary, Secondary, and Special Education</Strong> students only.
        </Text>
      </div>

      {/* Important Notice - Auto-linking */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
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
            <p className="font-semibold">Automatic App Access</p>
            <p className="mt-1">
              If the guardian email matches a personal account, they will automatically receive:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-2">
              <li>App access to view student data</li>
              <li>Real-time check-in/check-out notifications</li>
              <li>Ability to track student location</li>
              <li>Pickup approval requests</li>
            </ul>
          </div>
        </div>
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
            <Text className="text-green-800 dark:text-green-200">Guardian information saved successfully!</Text>
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
      <form onSubmit={handleSubmit}>
        <Fieldset>
          <Legend>Contact Information</Legend>
          <FieldGroup>
            {/* Full Name - Required */}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
              <Field>
                <Label>
                  Full Name <span className="text-red-600">*</span>
                </Label>
                <Input
                  type="text"
                  name="guardianFullName"
                  value={formData.guardianFullName}
                  onChange={(e) => handleChange('guardianFullName', e.target.value)}
                  placeholder="e.g., Sarah Johnson"
                  disabled={loading}
                  invalid={!!fieldErrors.guardianFullName}
                  required
                />
                {fieldErrors.guardianFullName && <ErrorMessage>{fieldErrors.guardianFullName}</ErrorMessage>}
              </Field>

              {/* Relationship - Required */}
              <Field>
                <Label>
                  Relationship <span className="text-red-600">*</span>
                </Label>
                <Select
                  name="relationshipType"
                  value={formData.relationshipType}
                  onChange={(e) =>
                    handleChange('relationshipType', e.target.value as GuardianRelationshipType)
                  }
                  disabled={loading}
                  invalid={!!fieldErrors.relationshipType}
                  required
                >
                  <option value="">Select relationship</option>
                  {relationshipOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                {fieldErrors.relationshipType && <ErrorMessage>{fieldErrors.relationshipType}</ErrorMessage>}
              </Field>
            </div>

            {/* Phone Number - Required */}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
              <Field>
                <Label>
                  Phone Number <span className="text-red-600">*</span>
                </Label>
                <Input
                  type="tel"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={(e) => handleChange('guardianPhone', e.target.value)}
                  placeholder="e.g., +1 (555) 123-4567"
                  disabled={loading}
                  invalid={!!fieldErrors.guardianPhone}
                  required
                />
                {fieldErrors.guardianPhone && <ErrorMessage>{fieldErrors.guardianPhone}</ErrorMessage>}
              </Field>

              {/* Email Address - Optional but Recommended */}
              <Field>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  name="guardianEmail"
                  value={formData.guardianEmail}
                  onChange={(e) => handleChange('guardianEmail', e.target.value)}
                  placeholder="e.g., sarah@example.com"
                  disabled={loading}
                  invalid={!!fieldErrors.guardianEmail}
                />
                {fieldErrors.guardianEmail && <ErrorMessage>{fieldErrors.guardianEmail}</ErrorMessage>}
                <Description>Recommended for app access and notifications</Description>
              </Field>
            </div>
          </FieldGroup>
        </Fieldset>

        {/* Permissions */}
        <Fieldset className="mt-8">
          <Legend>Permissions</Legend>
          <Text className="mt-2">Configure what this guardian is authorized to do.</Text>
          <CheckboxGroup className="mt-6">
            <CheckboxField>
              <Checkbox
                name="isPrimaryGuardian"
                checked={formData.isPrimaryGuardian}
                onChange={(checked) => handleChange('isPrimaryGuardian', checked)}
                disabled={loading}
              />
              <Label>Primary Guardian</Label>
              <Description>
                This is the student&apos;s primary guardian (usually the parent or main caregiver). Primary guardians
                receive all notifications and have full authority.
              </Description>
            </CheckboxField>

            <CheckboxField>
              <Checkbox
                name="canPickup"
                checked={formData.canPickup}
                onChange={(checked) => handleChange('canPickup', checked)}
                disabled={loading}
              />
              <Label>Can pick up student</Label>
              <Description>
                This guardian is authorized to pick up the student from school. They must still provide ID
                verification at pickup.
              </Description>
            </CheckboxField>

            <CheckboxField>
              <Checkbox
                name="canAuthorizeOthers"
                checked={formData.canAuthorizeOthers}
                onChange={(checked) => handleChange('canAuthorizeOthers', checked)}
                disabled={loading}
              />
              <Label>Can authorize other pickup persons</Label>
              <Description>
                This guardian can add or approve other people to pick up the student (e.g., grandparents,
                family friends).
              </Description>
            </CheckboxField>
          </CheckboxGroup>
        </Fieldset>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end gap-4">
          {onCancel && (
            <Button type="button" plain onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Add Guardian'}
          </Button>
        </div>
      </form>
    </div>
  );
}
