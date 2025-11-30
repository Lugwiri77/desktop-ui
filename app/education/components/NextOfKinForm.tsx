'use client';

import React, { useState } from 'react';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { Select } from '../../components/select';
import { Fieldset, Legend, FieldGroup, Field, Label, Description, ErrorMessage } from '../../components/fieldset';
import { Heading, Subheading } from '../../components/heading';
import { Text } from '../../components/text';
import type { NextOfKin } from '../../../types/education';

interface NextOfKinFormProps {
  studentId: string;
  institutionId: string;
  existingNextOfKin?: NextOfKin;
  onSuccess?: (nextOfKin: NextOfKin) => void;
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
 * Next of Kin Form - For University/College Students ONLY
 *
 * This form collects emergency contact information for adult university students.
 *
 * IMPORTANT: Next of kin is NOT a guardian and does NOT have:
 * - App access to student data
 * - Guardian privileges
 * - Pickup/dropoff authorization
 * - Ability to view grades or attendance
 *
 * They are ONLY contacted in emergencies.
 */
export default function NextOfKinForm({
  studentId,
  institutionId,
  existingNextOfKin,
  onSuccess,
  onCancel,
}: NextOfKinFormProps) {
  const [formData, setFormData] = useState<NextOfKin>({
    name: existingNextOfKin?.name || '',
    relationship: existingNextOfKin?.relationship || '',
    phone: existingNextOfKin?.phone || '',
    email: existingNextOfKin?.email || '',
    address: existingNextOfKin?.address || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof NextOfKin, value: string) => {
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

    if (!formData.name.trim()) {
      errors.name = 'Next of kin name is required';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      // Basic phone validation
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = 'Please enter a valid phone number';
      }
    }

    // Email validation if provided
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
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

      const mutation = existingNextOfKin
        ? `
          mutation UpdateNextOfKin($input: UpdateNextOfKinInput!) {
            updateNextOfKin(input: $input) {
              success
              message
            }
          }
        `
        : `
          mutation AddUniversityDetails($input: AddUniversityDetailsInput!) {
            addUniversityDetails(input: $input) {
              studentId
              nextOfKinName
              nextOfKinPhone
              nextOfKinEmail
            }
          }
        `;

      const variables = existingNextOfKin
        ? {
            input: {
              studentId,
              nextOfKinName: formData.name,
              nextOfKinPhone: formData.phone,
              nextOfKinEmail: formData.email || null,
            },
          }
        : {
            input: {
              studentId,
              nextOfKinName: formData.name,
              nextOfKinRelationship: formData.relationship || null,
              nextOfKinPhone: formData.phone,
              nextOfKinEmail: formData.email || null,
              nextOfKinAddress: formData.address || null,
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
        onSuccess(formData);
      }
    } catch (err) {
      console.error('Error saving next of kin:', err);
      setError(err instanceof Error ? err.message : 'Failed to save next of kin information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-950/10 pb-6 dark:border-white/10">
        <Heading>Next of Kin (Emergency Contact)</Heading>
        <Text className="mt-2">
          This information is for <strong>emergency purposes only</strong>.
        </Text>
      </div>

      {/* Important Notice */}
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
            <p className="font-semibold">Important: Next of Kin is NOT a Guardian</p>
            <p className="mt-1">This person will be contacted ONLY in emergencies. They will NOT have:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-2">
              <li>App access to view student data</li>
              <li>Guardian privileges</li>
              <li>Ability to view grades or attendance</li>
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
            <Text className="text-green-800 dark:text-green-200">
              Next of kin information saved successfully!
            </Text>
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
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Jane Smith"
                  disabled={loading}
                  invalid={!!fieldErrors.name}
                  required
                />
                {fieldErrors.name && <ErrorMessage>{fieldErrors.name}</ErrorMessage>}
              </Field>

              {/* Relationship - Optional */}
              <Field>
                <Label>Relationship</Label>
                <Select
                  name="relationship"
                  value={formData.relationship || ''}
                  onChange={(e) => handleChange('relationship', e.target.value)}
                  disabled={loading}
                >
                  {relationshipOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Description>How this person is related to the student</Description>
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
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="e.g., +1 (555) 123-4567"
                  disabled={loading}
                  invalid={!!fieldErrors.phone}
                  required
                />
                {fieldErrors.phone && <ErrorMessage>{fieldErrors.phone}</ErrorMessage>}
              </Field>

              {/* Email Address - Optional */}
              <Field>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="e.g., jane@example.com"
                  disabled={loading}
                  invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && <ErrorMessage>{fieldErrors.email}</ErrorMessage>}
                <Description>Optional but recommended</Description>
              </Field>
            </div>

            {/* Address - Optional */}
            <Field>
              <Label>Address</Label>
              <Input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Street address, city, state, zip code"
                disabled={loading}
              />
              <Description>Optional - for mailing emergency information if needed</Description>
            </Field>
          </FieldGroup>
        </Fieldset>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end gap-4">
          {onCancel && (
            <Button type="button" plain onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : existingNextOfKin ? 'Update Next of Kin' : 'Save Next of Kin'}
          </Button>
        </div>
      </form>
    </div>
  );
}
