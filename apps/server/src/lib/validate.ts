/**
 * Contact-form validation. Mirrors the constraints in the front-end form
 * (apps/web/src/pages/contact-us.astro) so a bypassed client can't get junk in.
 */

export interface ContactData {
  name: string;
  email: string;
  budget: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
  data?: ContactData;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const truthy = (v: unknown): boolean => v === true || v === 'on' || v === 'true' || v === '1';

export function validateContact(input: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};

  const name = str(input.name);
  const email = str(input.email);
  const budget = str(input.budget);
  const message = str(input.message);

  if (!name) errors.name = 'Name is required.';
  else if (name.length > 256) errors.name = 'Name is too long.';

  if (!email) errors.email = 'Email is required.';
  else if (email.length > 256 || !EMAIL_RE.test(email)) errors.email = 'A valid email is required.';

  if (!budget) errors.budget = 'Budget is required.';
  else if (budget.length > 256) errors.budget = 'Budget is too long.';

  if (!message) errors.message = 'Project description is required.';
  else if (message.length > 5000) errors.message = 'Message is too long.';

  if (!truthy(input.privacy)) errors.privacy = 'Consent is required.';

  const ok = Object.keys(errors).length === 0;
  return ok ? { ok, errors, data: { name, email, budget, message } } : { ok, errors };
}
