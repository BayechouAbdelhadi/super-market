/** "0671540528" → "06 71 54 05 28" (French 10-digit numbers; anything else is returned as typed). */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? digits.replace(/(\d{2})(?=\d)/g, "$1 ") : phone;
}

/** tel: link for a phone number as typed in the settings. */
export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
