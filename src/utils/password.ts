export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'empty';

export function evaluatePasswordStrength(password: string): {
  score: number;
  strength: PasswordStrength;
} {
  if (!password) return { score: 0, strength: 'empty' };

  const safePassword = password.length > 200 ? password.substring(0, 200) : password;

  try {
    let score = 0;
    if (safePassword.length >= 6) score += 1;
    if (safePassword.length >= 10) score += 1;
    if (/[a-z]/.test(safePassword) && /[A-Z]/.test(safePassword)) score += 1;
    if (/\d/.test(safePassword)) score += 1;
    if (/[^a-zA-Z\d]/.test(safePassword)) score += 1;

    let strength: PasswordStrength = 'weak';
    if (score <= 2) strength = 'weak';
    else if (score <= 4) strength = 'medium';
    else strength = 'strong';

    return { score, strength };
  } catch {
    return { score: 0, strength: 'weak' };
  }
}

export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong';
