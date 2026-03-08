/** RFC 5322 compliant email regex */
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  // Must start with + and have at least 8 digits total
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}
