export const isValidEmailAddress = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export function validateLoginFields(email: string, password: string): string | null {
  if (!email.trim() || !password) return 'Please fill in both your email and password.';
  if (!isValidEmailAddress(email)) return 'Please enter a valid email address.';
  return null;
}

export function validateRegistrationFields(fields: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): string | null {
  if (!fields.name.trim()) return 'Please enter your preferred name or nickname.';
  if (!isValidEmailAddress(fields.email)) return 'Please enter a valid email address.';
  if (fields.password.length < 6) return 'Password must be at least 6 characters.';
  if (fields.password !== fields.confirmPassword) return 'Passwords do not match.';
  return null;
}

export function classifySignUpResult(
  hasSession: boolean,
  identityCount: number | undefined
): 'authenticated' | 'confirmation-required' | 'duplicate' {
  if (hasSession) return 'authenticated';
  if (identityCount === 0) return 'duplicate';
  return 'confirmation-required';
}