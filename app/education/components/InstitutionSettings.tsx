'use client';

import React, { useState } from 'react';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { Checkbox, CheckboxField, CheckboxGroup } from '../../components/checkbox';
import { Fieldset, Legend, FieldGroup, Field, Label, Description, ErrorMessage } from '../../components/fieldset';
import { Heading, Subheading } from '../../components/heading';
import { Text } from '../../components/text';
import { Divider } from '../../components/divider';
import { graphql } from '@/lib/graphql';

interface InstitutionSettingsData {
  enablePickupDropoff: boolean;
  requirePickupApproval: boolean;
  minorStudentAgeThreshold: number;
  autoNotifyGuardiansOnCheckIn: boolean;
  autoNotifyGuardiansOnCheckOut: boolean;
  requireIdVerification: boolean;
  enableQrCodeCheckIn: boolean;
  allowedPickupTimeStart: string;
  allowedPickupTimeEnd: string;
}

interface InstitutionSettingsProps {
  institutionId: string;
}

export default function InstitutionSettings({ institutionId }: InstitutionSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<InstitutionSettingsData>({
    enablePickupDropoff: true,
    requirePickupApproval: true,
    minorStudentAgeThreshold: 18,
    autoNotifyGuardiansOnCheckIn: true,
    autoNotifyGuardiansOnCheckOut: true,
    requireIdVerification: true,
    enableQrCodeCheckIn: true,
    allowedPickupTimeStart: '07:00',
    allowedPickupTimeEnd: '18:00',
  });

  const handleToggle = (field: keyof InstitutionSettingsData, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSuccess(false);
    setError(null);
  };

  const handleInputChange = (field: keyof InstitutionSettingsData, value: string | number) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSuccess(false);
    setError(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const mutation = `
        mutation UpdateInstitutionSettings($input: UpdateInstitutionSettingsInput!) {
          updateInstitutionSettings(input: $input) {
            success
            message
          }
        }
      `;

      const input = {
        institutionId,
        enablePickupDropoff: settings.enablePickupDropoff,
        requirePickupApproval: settings.requirePickupApproval,
        minorStudentAgeThreshold: settings.minorStudentAgeThreshold,
        autoNotifyGuardiansOnCheckin: settings.autoNotifyGuardiansOnCheckIn,
        autoNotifyGuardiansOnCheckout: settings.autoNotifyGuardiansOnCheckOut,
        requireIdVerification: settings.requireIdVerification,
        enableQrCodeCheckin: settings.enableQrCodeCheckIn,
        allowedPickupTimeStart: settings.allowedPickupTimeStart,
        allowedPickupTimeEnd: settings.allowedPickupTimeEnd,
      };

      const result = await graphql<{ updateInstitutionSettings: { success: boolean; message: string } }>(
        mutation,
        { input }
      );

      if (result.updateInstitutionSettings.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        throw new Error(result.updateInstitutionSettings.message);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to save settings. Please try again.');
      console.error('Error saving settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-zinc-950/10 pb-6 dark:border-white/10">
        <Heading>Institution Settings</Heading>
        <Text className="mt-2">Configure policies and features for your educational institution.</Text>
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
            <Text className="text-green-800 dark:text-green-200">Settings saved successfully!</Text>
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

      {/* Pickup & Drop-off Settings */}
      <Fieldset>
        <Legend>Pickup & Drop-off Settings</Legend>
        <Text className="mt-2">Configure policies for student pickup and dropoff.</Text>

        <CheckboxGroup className="mt-6">
          <CheckboxField>
            <Checkbox
              checked={settings.enablePickupDropoff}
              onChange={(checked) => handleToggle('enablePickupDropoff', checked)}
              disabled={loading}
            />
            <Label>Enable Pickup/Drop-off Features</Label>
            <Description>Allow guardians to pick up students with approval workflow</Description>
          </CheckboxField>

          {settings.enablePickupDropoff && (
            <>
              <CheckboxField>
                <Checkbox
                  checked={settings.requirePickupApproval}
                  onChange={(checked) => handleToggle('requirePickupApproval', checked)}
                  disabled={loading}
                />
                <Label>Require Guardian Approval for Pickup</Label>
                <Description>Students must be approved by guardian before pickup is allowed</Description>
              </CheckboxField>
            </>
          )}
        </CheckboxGroup>

        {settings.enablePickupDropoff && (
          <FieldGroup className="mt-6">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-4">
              <Field>
                <Label>Minor Student Age Threshold</Label>
                <Input
                  type="number"
                  value={settings.minorStudentAgeThreshold.toString()}
                  onChange={(e) => handleInputChange('minorStudentAgeThreshold', parseInt(e.target.value))}
                  min="1"
                  max="25"
                  disabled={loading}
                />
                <Description>Students below this age require approval for pickup</Description>
              </Field>

              <Field>
                <Label>Pickup Time Start</Label>
                <Input
                  type="time"
                  value={settings.allowedPickupTimeStart}
                  onChange={(e) => handleInputChange('allowedPickupTimeStart', e.target.value)}
                  disabled={loading}
                />
              </Field>

              <Field>
                <Label>Pickup Time End</Label>
                <Input
                  type="time"
                  value={settings.allowedPickupTimeEnd}
                  onChange={(e) => handleInputChange('allowedPickupTimeEnd', e.target.value)}
                  disabled={loading}
                />
              </Field>
            </div>
          </FieldGroup>
        )}
      </Fieldset>

      <Divider />

      {/* Notification Settings */}
      <Fieldset>
        <Legend>Notification Settings</Legend>
        <Text className="mt-2">Configure automatic notifications to guardians.</Text>

        <CheckboxGroup className="mt-6">
          <CheckboxField>
            <Checkbox
              checked={settings.autoNotifyGuardiansOnCheckIn}
              onChange={(checked) => handleToggle('autoNotifyGuardiansOnCheckIn', checked)}
              disabled={loading}
            />
            <Label>Notify Guardians on Check-in</Label>
            <Description>Send notification when student arrives at school</Description>
          </CheckboxField>

          <CheckboxField>
            <Checkbox
              checked={settings.autoNotifyGuardiansOnCheckOut}
              onChange={(checked) => handleToggle('autoNotifyGuardiansOnCheckOut', checked)}
              disabled={loading}
            />
            <Label>Notify Guardians on Check-out</Label>
            <Description>Send notification when student leaves school</Description>
          </CheckboxField>
        </CheckboxGroup>

        <div className="mt-6 rounded-lg border border-zinc-950/10 p-4 dark:border-white/10">
          <Subheading>Notification Channels</Subheading>
          <Text className="mt-2 text-sm">
            Guardians will receive notifications via:
          </Text>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Push Notifications (in-app)</li>
            <li>SMS (if phone number provided)</li>
            <li>Email</li>
            <li>WhatsApp (if opted in)</li>
          </ul>
        </div>
      </Fieldset>

      <Divider />

      {/* Security & Verification */}
      <Fieldset>
        <Legend>Security & Verification</Legend>
        <Text className="mt-2">Configure security and identity verification policies.</Text>

        <CheckboxGroup className="mt-6">
          <CheckboxField>
            <Checkbox
              checked={settings.requireIdVerification}
              onChange={(checked) => handleToggle('requireIdVerification', checked)}
              disabled={loading}
            />
            <Label>Require ID Verification for Pickup</Label>
            <Description>Security staff must verify guardian/pickup person identity</Description>
          </CheckboxField>

          <CheckboxField>
            <Checkbox
              checked={settings.enableQrCodeCheckIn}
              onChange={(checked) => handleToggle('enableQrCodeCheckIn', checked)}
              disabled={loading}
            />
            <Label>Enable QR Code Check-in</Label>
            <Description>Allow students and guardians to check in via QR code scanning</Description>
          </CheckboxField>
        </CheckboxGroup>

        <div className="mt-6 rounded-lg bg-blue-50 p-4 ring-1 ring-blue-200 dark:bg-blue-950/10 dark:ring-blue-900">
          <Text className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Security staff will verify guardian/pickup person identity by checking
            their ID/passport against authorized persons list.
          </Text>
        </div>
      </Fieldset>

      <Divider />

      {/* Current Statistics */}
      <div className="rounded-lg bg-blue-600 p-6 text-white dark:bg-blue-700">
        <Subheading className="text-white">Current Statistics</Subheading>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-3xl font-bold">0</div>
            <Text className="mt-1 text-sm text-blue-100">Total Students</Text>
          </div>
          <div>
            <div className="text-3xl font-bold">0</div>
            <Text className="mt-1 text-sm text-blue-100">Active Today</Text>
          </div>
          <div>
            <div className="text-3xl font-bold">0</div>
            <Text className="mt-1 text-sm text-blue-100">Pending Approvals</Text>
          </div>
          <div>
            <div className="text-3xl font-bold">0</div>
            <Text className="mt-1 text-sm text-blue-100">Staff Members</Text>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end border-t border-zinc-950/10 pt-6 dark:border-white/10">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
