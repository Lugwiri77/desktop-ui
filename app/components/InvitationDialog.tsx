'use client';

import { useState } from 'react';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Field, Label } from './fieldset';
import { Checkbox, CheckboxField } from './checkbox';
import { Text } from './text';
import { createInvitation, type CreateInvitationInput, type InviteeType } from '@/lib/invitation-api';
import { EnvelopeIcon, DevicePhoneMobileIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';

interface InvitationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationType: 'business' | 'institution';
  organizationId: string;
  inviteeType: InviteeType;
  inviteeId: string;
  inviteeTableName: string;
  inviteeName: string;
  inviteeEmail?: string;
  inviteePhone: string;
  onSuccess?: () => void;
}

export function InvitationDialog({
  isOpen,
  onClose,
  organizationType,
  organizationId,
  inviteeType,
  inviteeId,
  inviteeTableName,
  inviteeName,
  inviteeEmail,
  inviteePhone,
  onSuccess,
}: InvitationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationUrl, setRegistrationUrl] = useState<string | null>(null);

  // Form state
  const [sendEmail, setSendEmail] = useState(!!inviteeEmail);
  const [sendSms, setSendSms] = useState(true);
  const [customMessage, setCustomMessage] = useState('');
  const [validForDays, setValidForDays] = useState(7);

  const handleSendInvitation = async () => {
    setLoading(true);
    setError(null);

    try {
      const input: CreateInvitationInput = {
        organizationType,
        organizationId,
        inviteeType,
        inviteeId,
        inviteeTableName,
        inviteeName,
        inviteeEmail,
        inviteePhone,
        sendEmail,
        sendSms,
        customMessage: customMessage || undefined,
        validForDays,
        preferredLanguage: 'en',
      };

      const result = await createInvitation(input);

      setSuccess(true);
      setRegistrationUrl(result.registrationUrl);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError(null);
    setRegistrationUrl(null);
    setCustomMessage('');
    onClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} size="3xl">
      <DialogTitle>
        {success ? 'Invitation Sent Successfully' : `Invite ${inviteeName} to Mobile App`}
      </DialogTitle>

      {!success ? (
        <>
          <DialogDescription>
            Send an invitation to <strong>{inviteeName}</strong> to download and register on the mobile app.
          </DialogDescription>

          <DialogBody>
            <div className="space-y-6">
              {/* Contact Information Display */}
              <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <Text className="text-sm">
                    Email: <strong>{inviteeEmail || 'Not provided'}</strong>
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
                  <Text className="text-sm">
                    Phone: <strong>{inviteePhone}</strong>
                  </Text>
                </div>
              </div>

              {/* Delivery Options */}
              <div className="space-y-4">
                <Text className="text-sm font-medium text-gray-700">Delivery Method</Text>
                <CheckboxField>
                  <Checkbox
                    name="sendEmail"
                    checked={sendEmail}
                    onChange={setSendEmail}
                    disabled={!inviteeEmail}
                  />
                  <Label>
                    Send via Email
                    {!inviteeEmail && (
                      <span className="text-sm text-gray-500"> (No email provided)</span>
                    )}
                  </Label>
                </CheckboxField>

                <CheckboxField>
                  <Checkbox
                    name="sendSms"
                    checked={sendSms}
                    onChange={setSendSms}
                  />
                  <Label>Send via SMS</Label>
                </CheckboxField>
              </div>

              {/* Custom Message */}
              <Field>
                <Label>Custom Message (Optional)</Label>
                <Input
                  name="customMessage"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a personal message to the invitation..."
                />
              </Field>

              {/* Valid For Days */}
              <Field>
                <Label>Valid For (Days)</Label>
                <Input
                  type="number"
                  name="validForDays"
                  value={validForDays}
                  onChange={(e) => setValidForDays(parseInt(e.target.value) || 7)}
                  min="1"
                  max="30"
                />
                <Text className="text-sm text-gray-500 mt-1">
                  Invitation will expire after {validForDays} {validForDays === 1 ? 'day' : 'days'}
                </Text>
              </Field>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 p-4 flex items-start gap-3">
                  <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <Text className="text-sm text-red-700">{error}</Text>
                </div>
              )}
            </div>
          </DialogBody>

          <DialogActions>
            <Button onClick={handleClose} plain>
              Cancel
            </Button>
            <Button
              onClick={handleSendInvitation}
              disabled={loading || (!sendEmail && !sendSms)}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogBody>
            <div className="space-y-6">
              {/* Success Message */}
              <div className="rounded-lg bg-green-50 p-6 flex items-start gap-4">
                <CheckCircleIcon className="h-8 w-8 text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <Text className="text-lg font-semibold text-green-900 mb-2">
                    Invitation Sent!
                  </Text>
                  <Text className="text-sm text-green-700">
                    {inviteeName} will receive the invitation via{' '}
                    {sendEmail && sendSms
                      ? 'email and SMS'
                      : sendEmail
                      ? 'email'
                      : 'SMS'}
                    .
                  </Text>
                </div>
              </div>

              {/* Registration URL */}
              {registrationUrl && (
                <Field>
                  <Label>Registration Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={registrationUrl}
                      readOnly
                      className="flex-1 font-mono text-sm"
                    />
                    <Button
                      plain
                      onClick={() => copyToClipboard(registrationUrl)}
                    >
                      Copy
                    </Button>
                  </div>
                  <Text className="text-sm text-gray-500 mt-1">
                    You can also share this link manually if needed.
                  </Text>
                </Field>
              )}

              {/* Next Steps */}
              <div className="rounded-lg border border-gray-200 p-4 space-y-2">
                <Text className="font-semibold">Next Steps:</Text>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>{inviteeName} will receive an invitation with app download links</li>
                  <li>They can download the app from App Store or Play Store</li>
                  <li>The registration link will pre-fill their information</li>
                  <li>Once registered, they'll be automatically linked to their account</li>
                </ul>
              </div>
            </div>
          </DialogBody>

          <DialogActions>
            <Button onClick={handleClose}>
              Close
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
