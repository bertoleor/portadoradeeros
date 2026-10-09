import { describe, expect, it } from 'vitest';

import { sanitizeBioContent } from './sanitize';

describe('sanitizeBioContent (S5 stored-XSS defense-in-depth)', () => {
  it('strips <script> content entirely', () => {
    const out = sanitizeBioContent('<p>hola</p><script>alert(1)</script>');
    expect(out).not.toContain('script');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('<p>hola</p>');
  });

  it('removes event handlers (onerror, onclick, etc.) from allowed tags', () => {
    const out = sanitizeBioContent('<img src=x onerror="alert(1)"><p onclick="steal()">bio</p>');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('steal()');
  });

  it('keeps allowed inline tags and formatting', () => {
    const out = sanitizeBioContent(
      '<p>Me llamo <strong>Ana</strong> y <em>soy</em> <u>masajista</u>.</p>'
    );
    expect(out).toContain('<strong>Ana</strong>');
    expect(out).toContain('<em>soy</em>');
    expect(out).toContain('<u>masajista</u>');
    expect(out).toContain('<p>');
  });

  it('blocks javascript: URLs on links', () => {
    const out = sanitizeBioContent('<a href="javascript:alert(1)">pulsa</a>');
    expect(out).not.toContain('javascript:');
  });

  it('forces rel=noopener noreferrer on external links', () => {
    const out = sanitizeBioContent('<a href="https://example.com">sitio</a>');
    expect(out).toContain('noopener');
    expect(out).toContain('noreferrer');
  });

  it('keeps safe http/https/mailto URLs', () => {
    const out = sanitizeBioContent(
      '<a href="https://example.com">web</a> <a href="mailto:a@b.com">mail</a>'
    );
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('href="mailto:a@b.com"');
  });

  it('discards disallowed tags but keeps their text (disallowedTagsMode: discard)', () => {
    const out = sanitizeBioContent('<div><marquee>viva</marquee><style>p{}</style></div>');
    expect(out).not.toContain('<marquee>');
    expect(out).not.toContain('<style');
    expect(out).toContain('viva');
  });

  it('neutralizes common XSS payloads', () => {
    const payloads = [
      '<svg onload=alert(1)>',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<a href="java&#x73;cript:alert(1)">x</a>',
      '<p><script>fetch("https://evil.test")</script></p>',
    ];
    for (const p of payloads) {
      const out = sanitizeBioContent(p);
      expect(out.toLowerCase()).not.toContain('<script');
      expect(out.toLowerCase()).not.toContain('onload');
    }
  });

  it('returns plain text unchanged', () => {
    expect(sanitizeBioContent('solo un texto')).toBe('solo un texto');
  });

  it('handles empty / undefined-ish input without throwing', () => {
    expect(sanitizeBioContent('')).toBe('');
    expect(sanitizeBioContent('<p></p>')).toBe('<p></p>');
  });
});
