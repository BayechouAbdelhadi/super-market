/**
 * Escapes text for safe interpolation into email HTML (element content and quoted attributes).
 * SECURITY: every user-supplied value (names, campaign text) must go through this
 * before being placed in an HTML email, or it can inject links/markup into our emails.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
