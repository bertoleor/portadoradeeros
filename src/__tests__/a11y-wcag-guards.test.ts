import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/* eslint-disable security/detect-non-literal-fs-filename -- test reads a
   fixed allow-list of repo files; the path is never attacker-controlled. */
/* eslint-disable security/detect-object-injection -- the "injection" is an
   indexed access over a literal tuple in a unit test, not dynamic data. */

/**
 * EROS a11y regression guards (WCAG 2.2 AA) — kickoff UI/UX t_407514f7.
 *
 * These guards lock the fixes shipped in the 2026-10-01 pass so the nightly
 * verifier catches any regression:
 *   - EROS-C1  `maximumScale: 1` removed from the viewport (WCAG 1.4.4)
 *   - Skip-to-content link present (WCAG 2.4.1)
 *   - Footer/legal text contrast >= 4.5:1 (WCAG 1.4.3)
 *   - Public pages use AA-compliant text tokens (WCAG 1.4.3)
 *   - Service carousel cards keep a visible focus indicator (WCAG 2.4.7)
 */

const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(`../../${rel}`, import.meta.url)), 'utf8');

// ── WCAG contrast math (evidence, not vibes) ─────────────────────────────────

function contrastRatio(
  fg: readonly [number, number, number],
  bg: readonly [number, number, number]
) {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum = (c: readonly [number, number, number]) =>
    0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const l1 = lum(fg);
  const l2 = lum(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Compose the site ink rgba(15,15,20,a) over the body background #f8f9fb. */
const inkOnBodyBg = (alpha: number): [number, number, number] => {
  const bg = [248, 249, 251];
  const ink = [15, 15, 20];
  return [0, 1, 2].map((i) => Math.round(alpha * ink[i] + (1 - alpha) * bg[i])) as [
    number,
    number,
    number,
  ];
};

/** Tailwind `black/NN` over the same body background. */
const blackOnBodyBg = (pct: number): [number, number, number] => {
  const bg = [248, 249, 251];
  return [0, 1, 2].map((i) => Math.round((pct / 100) * 0 + (1 - pct / 100) * bg[i])) as [
    number,
    number,
    number,
  ];
};

describe('EROS-C1: viewport never pins maximumScale (WCAG 1.4.4 resize text)', () => {
  it('layout.tsx must not set maximumScale', () => {
    const src = read('src/app/layout.tsx');
    expect(src).not.toContain('maximumScale');
  });
});

describe('Skip link: keyboard users can bypass the navbar (WCAG 2.4.1)', () => {
  it('Shell exposes a skip link targeting #main-content', () => {
    const src = read('src/components/client/Shell.tsx');
    expect(src).toContain('#main-content');
    expect(src).toContain('skip-link');
  });
});

describe('Footer legal text meets AA contrast (WCAG 1.4.3)', () => {
  it('footer drops sub-AA ink alphas (0.25 / 0.35 / 0.45)', () => {
    const src = read('src/components/client/Footer.tsx');
    expect(src).not.toContain('text-[rgba(15,15,20,0.25)]');
    expect(src).not.toContain('text-[rgba(15,15,20,0.35)]');
    expect(src).not.toContain('text-[rgba(15,15,20,0.45)]');
  });

  it('replacement ink alpha actually passes 4.5:1 on the body bg', () => {
    // Site-wide floor for small text after this pass (4.91:1):
    expect(contrastRatio(inkOnBodyBg(0.6), [248, 249, 251])).toBeGreaterThanOrEqual(4.5);
    // Evidence the old values were failures (why they were replaced):
    for (const a of [0.2, 0.25, 0.28, 0.3, 0.35, 0.38, 0.4, 0.45, 0.5, 0.55]) {
      expect(contrastRatio(inkOnBodyBg(a), [248, 249, 251])).toBeLessThan(4.5);
    }
  });
});

describe('Public pages use AA-compliant eyebrow/label tokens (WCAG 1.4.3)', () => {
  const PUBLIC_TSX = [
    'src/app/page.tsx',
    'src/app/contacto/page.tsx',
    'src/app/servicios/page.tsx',
    'src/app/servicios/[slug]/page.tsx',
    'src/app/sobre-mi/page.tsx',
    'src/app/terminos/page.tsx',
    'src/app/privacidad/page.tsx',
    'src/app/politica-cancelacion/page.tsx',
    'src/app/error.tsx',
    'src/components/client/Footer.tsx',
    'src/components/client/Hero.tsx',
    'src/components/client/Navbar.tsx',
    'src/components/client/ServiceCard.tsx',
    'src/components/client/ServiceCarousel.tsx',
    'src/components/client/ServiceContactForm.tsx',
    'src/components/client/BookingCalendar.tsx',
    'src/components/client/CustomTimePicker.tsx',
    'src/components/ui/Input.tsx',
  ];

  it.each(PUBLIC_TSX)('%s has no sub-AA ink text tokens', (rel) => {
    const src = read(rel);
    const offenders = [
      'text-[rgba(15,15,20,0.15)]',
      'text-[rgba(15,15,20,0.2)]',
      'text-[rgba(15,15,20,0.25)]',
      'text-[rgba(15,15,20,0.3)]',
      'text-[rgba(15,15,20,0.35)]',
      'text-[rgba(15,15,20,0.38)]',
      'text-[rgba(15,15,20,0.4)]',
      'text-[rgba(15,15,20,0.45)]',
      'text-[rgba(15,15,20,0.5)]',
      'text-[rgba(15,15,20,0.28)]',
      'text-black/30',
      'text-black/40',
      'text-black/50',
      'placeholder:text-gray-400',
    ].filter((token) => src.includes(token));
    expect(offenders, `sub-AA tokens found in ${rel}: ${offenders.join(', ')}`).toEqual([]);
  });

  it('black/60 replacement passes 4.5:1 on the body bg', () => {
    expect(contrastRatio(blackOnBodyBg(60), [248, 249, 251])).toBeGreaterThanOrEqual(4.5);
  });
});

describe('Service carousel cards keep a visible focus indicator (WCAG 2.4.7)', () => {
  it('ServiceCarousel cards render a focus-visible ring, not a bare outline-none', () => {
    const src = read('src/components/client/ServiceCarousel.tsx');
    expect(src).toContain('focus-visible:ring');
  });
});
