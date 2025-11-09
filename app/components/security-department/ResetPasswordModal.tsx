'use client';

import { useState } from 'react';
import { Dialog, DialogTitle, DialogDescription, DialogActions, DialogBody } from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { Alert, AlertDescription, AlertTitle } from '../alert';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { useResetExternalStaffPassword } from '@/hooks/use-security-department';
import { generateStrongPassword, copyToClipboard, isPasswordValid } from '@/lib/password-generator';
import { Shield, Key, Eye, EyeOff, Copy, Check, AlertCircle } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  staffName: string;
}

export function ResetPasswordModal({ isOpen, onClose, staffId, staffName }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const { mutate: resetPassword, isPending, isSuccess } = useResetExternalStaffPassword();

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword(16);
    setNewPassword(generated);
    setConfirmPassword(generated);
    setErrors({});
  };

  const handleCopyPassword = async () => {
    const success = await copyToClipboard(newPassword);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { password?: string; confirm?: string } = {};

    if (!newPassword) {
      newErrors.password = 'Password is required';
    } else if (!isPasswordValid(newPassword)) {
      newErrors.password = 'Password does not meet security requirements';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = () => {
    if (!validateForm()) {
      return;
    }

    resetPassword(
      {
        staffId,
        newPassword,
        resetReason: resetReason || undefined,
      },
      {
        onSuccess: () => {
          // Show success message for a moment before closing
          setTimeout(() => {
            handleClose();
          }, 2000);
        },
      }
    );
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setResetReason('');
    setErrors({});
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} size="2xl">
      <DialogTitle>Reset Password for {staffName}</DialogTitle>
      <DialogDescription>
        Create a new password for this external security staff member. They will not be able to reset it
        themselves.
      </DialogDescription>

      <DialogBody>
        <div className="space-y-4">
          {/* Warning Alert */}
          <Alert variant="warning">
            <Shield className="h-4 w-4" />
            <AlertTitle>Administrative Password Reset</AlertTitle>
            <AlertDescription>
              This is an administrative password reset. The staff member cannot reset their own password. Only
              department managers and administrators can perform password resets.
            </AlertDescription>
          </Alert>

          {isSuccess && (
            <Alert variant="success">
              <Check className="h-4 w-4" />
              <AlertTitle>Password Reset Successfully</AlertTitle>
              <AlertDescription>
                The password has been reset. Please provide the new password to the staff member securely.
              </AlertDescription>
            </Alert>
          )}

          {/* Reset Reason */}
          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-2">
              Reset Reason (Optional)
            </label>
            <Input
              type="text"
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              placeholder="e.g., Forgot password, Security concern, etc."
            />
          </div>

          {/* Password Input with Generate Button */}
          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-2">
              New Password <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Enter new password"
                  className={errors.password ? 'border-red-500' : ''}
                />
              </div>
              <Button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                outline
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
              <Button type="button" onClick={handleGeneratePassword} color="blue">
                <Key className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-2">
              Confirm Password <span className="text-red-400">*</span>
            </label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirm: undefined }));
              }}
              placeholder="Confirm new password"
              className={errors.confirm ? 'border-red-500' : ''}
            />
            {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm}</p>}
          </div>

          {/* Password Strength Indicator */}
          {newPassword && <PasswordStrengthIndicator password={newPassword} />}

          {/* Copy Password Section */}
          {newPassword && isPasswordValid(newPassword) && (
            <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-4">
              <p className="text-sm font-medium text-zinc-300 mb-2">Generated Password:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-green-400 bg-zinc-900 px-3 py-2 rounded">
                  {showPassword ? newPassword : '••••••••••••••••'}
                </code>
                <Button type="button" onClick={handleCopyPassword} outline size="sm">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Copy this password and provide it to the staff member securely. They will need to use this
                password to log in.
              </p>
            </div>
          )}

          {/* Important Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Make sure to copy and securely share this password with the staff
              member before closing this dialog. You will not be able to retrieve it later.
            </AlertDescription>
          </Alert>
        </div>
      </DialogBody>

      <DialogActions>
        <Button plain onClick={handleClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleReset}
          disabled={!newPassword || newPassword.length < 12 || isPending || isSuccess}
          color="red"
        >
          {isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Resetting...
            </>
          ) : isSuccess ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Reset Complete
            </>
          ) : (
            <>
              <Key className="h-4 w-4 mr-2" />
              Reset Password
            </>
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
