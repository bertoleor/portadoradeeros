import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize admin-authored HTML (e.g. the "sobre mí" bio) before rendering it
 * via `dangerouslySetInnerHTML`.
 *
 * The content originates in `admin_settings.bio_content`, which is
 * admin-authored and already gated by RLS (slice 1) + `requireAdmin()` on
 * writes. This sanitizer is defense-in-depth for S5: it strips scripts,
 * event handlers, and non-http(s)/mailto URLs so a compromised admin account
 * or DB drift cannot inject stored XSS.
 *
 * We chose `sanitize-html` (a proper HTML parser with an allowlist) over a
 * regex-based strip because regex HTML parsing is unreliable and bypassable;
 * a parser-backed allowlist is the correct tool for neutralizing markup.
 */
export function sanitizeBioContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
      'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote',
      'span', 'div', 'a',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      span: ['class'],
      div: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    // Drop disallowed tags entirely, keep their text content.
    disallowedTagsMode: 'discard',
    // Do not allow any attributes on disallowed/unknown tags.
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    // Force `target="_blank"` links to be safe (avoid reverse tabnabbing).
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  });
}