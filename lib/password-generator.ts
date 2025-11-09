/**
 * Password Generator Utility
 * For creating strong, non-resetable passwords for external security staff
 */

const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
  'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
  'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael',
];

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string;
  color: string;
  percentage: number;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
    notCommon: boolean;
  };
}

/**
 * Generate a cryptographically strong random password
 * @param length - Password length (default 16, minimum 12)
 * @returns A strong random password
 */
export function generateStrongPassword(length: number = 16): string {
  if (length < 12) {
    throw new Error('Password must be at least 12 characters long');
  }

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const all = uppercase + lowercase + numbers + special;

  // Ensure at least one of each required type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Calculate password strength with detailed requirements
 * @param password - The password to evaluate
 * @returns PasswordStrength object with score, feedback, and requirements
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
    notCommon: !COMMON_PASSWORDS.includes(password.toLowerCase()),
  };

  // Calculate score based on requirements
  let score = 0;
  let metRequirements = 0;

  Object.values(requirements).forEach(met => {
    if (met) metRequirements++;
  });

  // Score calculation
  if (metRequirements === 6) {
    // All requirements met
    if (password.length >= 16) {
      score = 4; // Strong
    } else if (password.length >= 14) {
      score = 3; // Good
    } else {
      score = 3; // Good
    }
  } else if (metRequirements >= 4) {
    score = 2; // Fair
  } else if (metRequirements >= 2) {
    score = 1; // Weak
  } else {
    score = 0; // Very Weak
  }

  // Additional check for length
  if (password.length >= 20 && metRequirements === 6) {
    score = 4; // Strong
  }

  const feedbackMap = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colorMap = ['red', 'orange', 'yellow', 'blue', 'green'];
  const percentageMap = [0, 25, 50, 75, 100];

  return {
    score,
    feedback: feedbackMap[score],
    color: colorMap[score],
    percentage: percentageMap[score],
    requirements,
  };
}

/**
 * Get specific feedback for password improvement
 * @param password - The password to evaluate
 * @returns Array of improvement suggestions
 */
export function getPasswordFeedback(password: string): string[] {
  const feedback: string[] = [];
  const strength = calculatePasswordStrength(password);

  if (!strength.requirements.length) {
    feedback.push('Password must be at least 12 characters long');
  }
  if (!strength.requirements.uppercase) {
    feedback.push('Add uppercase letters (A-Z)');
  }
  if (!strength.requirements.lowercase) {
    feedback.push('Add lowercase letters (a-z)');
  }
  if (!strength.requirements.number) {
    feedback.push('Add numbers (0-9)');
  }
  if (!strength.requirements.special) {
    feedback.push('Add special characters (!@#$%^&*...)');
  }
  if (!strength.requirements.notCommon) {
    feedback.push('This is a commonly used password. Choose something more unique');
  }

  if (feedback.length === 0 && password.length < 16) {
    feedback.push('Consider making it longer for extra security (16+ characters recommended)');
  }

  return feedback;
}

/**
 * Validate password meets minimum requirements
 * @param password - The password to validate
 * @returns true if password meets all requirements, false otherwise
 */
export function isPasswordValid(password: string): boolean {
  const strength = calculatePasswordStrength(password);
  return Object.values(strength.requirements).every(req => req === true);
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when copy is complete
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Generate multiple passwords and return the strongest one
 * @param count - Number of passwords to generate (default 5)
 * @param length - Length of each password (default 16)
 * @returns The strongest generated password
 */
export function generateOptimalPassword(count: number = 5, length: number = 16): string {
  const passwords = Array.from({ length: count }, () => generateStrongPassword(length));

  // Return the one with the highest strength score
  return passwords.reduce((best, current) => {
    const bestScore = calculatePasswordStrength(best).score;
    const currentScore = calculatePasswordStrength(current).score;
    return currentScore > bestScore ? current : best;
  });
}
