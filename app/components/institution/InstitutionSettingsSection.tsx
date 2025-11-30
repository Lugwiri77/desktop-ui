'use client';

import React, { useState } from 'react';
import { Heading } from '../heading';
import { Text } from '../text';
import { Button } from '../button';
import { Input } from '../input';
import { Field, Label, Description } from '../fieldset';
import { Switch, SwitchField } from '../switch';
import {
  AcademicCapIcon,
  Cog6ToothIcon,
} from '@heroicons/react/20/solid';
import { isPrimaryOrSecondarySchool, isUniversityOrCollege, UserInfo } from '@/lib/roles';

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

interface InstitutionSettingsSectionProps {
  institutionId: string;
  organizationType?: string;
  educationalInstitutionSubcategory?: string;
}

export default function InstitutionSettingsSection({
  institutionId,
  organizationType,
  educationalInstitutionSubcategory
}: InstitutionSettingsSectionProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Settings state
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

  const handleSaveSettings = async () => {
    setLoading(true);
    setError('');

    try {
      // TODO: Implement GraphQL mutation to save settings
      console.log('Saving institution settings:', settings);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Institution settings saved successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Create a minimal UserInfo object for type checking
  const userInfo: Partial<UserInfo> = {
    educationalInstitutionSubcategory,
  };

  // Check institution type using helper functions
  const isPrimarySecondary = isPrimaryOrSecondarySchool(userInfo as UserInfo);
  const isUniversityCollege = isUniversityOrCollege(userInfo as UserInfo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AcademicCapIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        <div>
          <Heading level={2}>Institution Settings</Heading>
          <Text>Educational institution-specific configuration</Text>
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

      {/* Settings Content */}
      <div className="space-y-6">
          {/* University/College Info */}
          {isUniversityCollege && (
            <div className="rounded-lg bg-blue-50 p-6 text-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
              <Heading level={3} className="mb-2">University/College Settings</Heading>
              <Text>
                As a university/college institution, pickup/drop-off and guardian notification features are not typically required
                since most students are adults. QR code check-in and security verification features are available below.
              </Text>
            </div>
          )}

          {/* Pickup/Drop-off Settings - Only for Primary/Secondary Schools */}
          {isPrimarySecondary && (
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Cog6ToothIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <Heading level={3}>Pickup & Drop-off</Heading>
            </div>

            <div className="space-y-4">
              <SwitchField>
                <Label>Enable Pickup/Drop-off Features</Label>
                <Description>Allow guardian-based pickup and drop-off management</Description>
                <Switch
                  checked={settings.enablePickupDropoff}
                  onChange={(checked) => setSettings({ ...settings, enablePickupDropoff: checked })}
                />
              </SwitchField>

              {settings.enablePickupDropoff && (
                <>
                  <div className="border-t border-zinc-950/10 dark:border-white/10 pt-4 space-y-4">
                    <SwitchField>
                      <Label>Require Guardian Approval for Pickup</Label>
                      <Description>Students need guardian approval before being picked up</Description>
                      <Switch
                        checked={settings.requirePickupApproval}
                        onChange={(checked) => setSettings({ ...settings, requirePickupApproval: checked })}
                      />
                    </SwitchField>

                    <Field>
                      <Label>Minor Student Age Threshold</Label>
                      <Description>
                        Students below age {settings.minorStudentAgeThreshold} require approval for pickup
                      </Description>
                      <Input
                        type="number"
                        min={1}
                        max={25}
                        value={settings.minorStudentAgeThreshold}
                        onChange={(e) => setSettings({ ...settings, minorStudentAgeThreshold: parseInt(e.target.value) })}
                      />
                    </Field>

                    {isPrimarySecondary && (
                      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
                        <strong>Note:</strong> For primary and secondary schools, guardian approval is highly recommended for all students.
                      </div>
                    )}

                    {isUniversityCollege && (
                      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
                        <strong>Note:</strong> For universities and colleges, most students can self-checkout. Age threshold applies to minors only.
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <Label>Pickup Time Start</Label>
                        <Input
                          type="time"
                          value={settings.allowedPickupTimeStart}
                          onChange={(e) => setSettings({ ...settings, allowedPickupTimeStart: e.target.value })}
                        />
                      </Field>
                      <Field>
                        <Label>Pickup Time End</Label>
                        <Input
                          type="time"
                          value={settings.allowedPickupTimeEnd}
                          onChange={(e) => setSettings({ ...settings, allowedPickupTimeEnd: e.target.value })}
                        />
                      </Field>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          )}

          {/* Notification Settings - Only for Primary/Secondary Schools */}
          {isPrimarySecondary && (
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <Heading level={3} className="mb-4">Notification Settings</Heading>

            <div className="space-y-4">
              <SwitchField>
                <Label>Notify Guardians on Check-in</Label>
                <Description>Send notifications when students check in</Description>
                <Switch
                  checked={settings.autoNotifyGuardiansOnCheckIn}
                  onChange={(checked) => setSettings({ ...settings, autoNotifyGuardiansOnCheckIn: checked })}
                />
              </SwitchField>

              <SwitchField>
                <Label>Notify Guardians on Check-out</Label>
                <Description>Send notifications when students check out</Description>
                <Switch
                  checked={settings.autoNotifyGuardiansOnCheckOut}
                  onChange={(checked) => setSettings({ ...settings, autoNotifyGuardiansOnCheckOut: checked })}
                />
              </SwitchField>

              <div className="mt-4 pt-4 border-t border-zinc-950/10 dark:border-white/10">
                <Text className="font-medium mb-2">Notification Channels:</Text>
                <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>• Push Notifications</li>
                  <li>• SMS (if phone number provided)</li>
                  <li>• Email</li>
                  <li>• WhatsApp (if opted in)</li>
                </ul>
              </div>
            </div>
          </div>
          )}

          {/* Security & Verification - Available for all institution types */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <Heading level={3} className="mb-4">Security & Verification</Heading>

            <div className="space-y-4">
              <SwitchField>
                <Label>Require ID Verification for Pickup</Label>
                <Description>Security staff must verify ID/passport of pickup person</Description>
                <Switch
                  checked={settings.requireIdVerification}
                  onChange={(checked) => setSettings({ ...settings, requireIdVerification: checked })}
                />
              </SwitchField>

              <SwitchField>
                <Label>Enable QR Code Check-in</Label>
                <Description>Allow students to check in using QR codes</Description>
                <Switch
                  checked={settings.enableQrCodeCheckIn}
                  onChange={(checked) => setSettings({ ...settings, enableQrCodeCheckIn: checked })}
                />
              </SwitchField>

              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
                <strong>Info:</strong> Security staff will verify guardian/pickup person identity by checking their ID/passport against the authorized persons list.
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="button" onClick={handleSaveSettings} disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
    </div>
  );
}
