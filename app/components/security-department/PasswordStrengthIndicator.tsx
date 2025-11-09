'use client';

import { calculatePasswordStrength, getPasswordFeedback } from '@/lib/password-generator';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({ password, showRequirements = true }: PasswordStrengthIndicatorProps) {
  if (!password) {
    return null;
  }

  const strength = calculatePasswordStrength(password);
  const feedback = getPasswordFeedback(password);

  const getColorClasses = () => {
    switch (strength.color) {
      case 'red':
        return {
          bar: 'bg-red-500',
          text: 'text-red-400',
          border: 'border-red-500/50',
          bg: 'bg-red-500/10',
        };
      case 'orange':
        return {
          bar: 'bg-orange-500',
          text: 'text-orange-400',
          border: 'border-orange-500/50',
          bg: 'bg-orange-500/10',
        };
      case 'yellow':
        return {
          bar: 'bg-yellow-500',
          text: 'text-yellow-400',
          border: 'border-yellow-500/50',
          bg: 'bg-yellow-500/10',
        };
      case 'blue':
        return {
          bar: 'bg-blue-500',
          text: 'text-blue-400',
          border: 'border-blue-500/50',
          bg: 'bg-blue-500/10',
        };
      case 'green':
        return {
          bar: 'bg-green-500',
          text: 'text-green-400',
          border: 'border-green-500/50',
          bg: 'bg-green-500/10',
        };
      default:
        return {
          bar: 'bg-zinc-500',
          text: 'text-zinc-400',
          border: 'border-zinc-500/50',
          bg: 'bg-zinc-500/10',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Password Strength</span>
          <span className={`text-sm font-medium ${colors.text}`}>{strength.feedback}</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bar} transition-all duration-300`}
            style={{ width: `${strength.percentage}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className={`rounded-lg border ${colors.border} ${colors.bg} p-3 space-y-2`}>
          <p className="text-xs font-medium text-zinc-300 mb-2">Requirements:</p>
          <div className="grid grid-cols-2 gap-2">
            <RequirementItem met={strength.requirements.length} label="12+ characters" />
            <RequirementItem met={strength.requirements.uppercase} label="Uppercase (A-Z)" />
            <RequirementItem met={strength.requirements.lowercase} label="Lowercase (a-z)" />
            <RequirementItem met={strength.requirements.number} label="Number (0-9)" />
            <RequirementItem met={strength.requirements.special} label="Special (!@#$...)" />
            <RequirementItem met={strength.requirements.notCommon} label="Not common" />
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback.length > 0 && (
        <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-zinc-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-300">Suggestions:</p>
              <ul className="space-y-1">
                {feedback.map((item, index) => (
                  <li key={index} className="text-xs text-zinc-400">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  label: string;
}

function RequirementItem({ met, label }: RequirementItemProps) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-zinc-600 flex-shrink-0" />
      )}
      <span className={`text-xs ${met ? 'text-green-300' : 'text-zinc-500'}`}>{label}</span>
    </div>
  );
}
