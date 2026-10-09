/**
 * Build a validated WhatsApp deep link (`https://wa.me/<digits>`).
 *
 * Pure function: strips non-digit separators, enforces the E.164 digit
 * range (8–15 digits, no `+`), and optionally appends an encoded message.
 * Throws on invalid input so bad numbers fail fast instead of producing
 * a dead `wa.me/` link.
 *
 * @param phone - phone number in any human format (e.g. `+54 9 11 1234-5678`)
 * @param message - optional pre-filled text; blank is treated as absent
 * @returns the `wa.me` URL
 * @throws `Error('Invalid WhatsApp phone number')` when digits are not 8–15
 */
export function buildWhatsAppLink(phone: string, message?: string): string {
  const digits = phone.replaceAll(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    throw new Error('Invalid WhatsApp phone number');
  }
  const text = message?.trim();
  if (!text) {
    return `https://wa.me/${digits}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
