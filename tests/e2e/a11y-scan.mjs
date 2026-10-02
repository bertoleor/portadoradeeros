/**
 * EROS a11y kickoff gate — axe-core scan against the PRODUCTION build.
 * (t_407514f7, kickoff: UI/UX al día)
 *
 * Usage: node tests/e2e/a11y-scan.mjs
 *
 * Boots `next start` on :3010 with Supabase env vars pointed at the
 * tests/e2e/server.mjs stub (127.0.0.1:54321) so pages render without the
 * live DB, then runs axe-core over every public route in both a mobile
 * (375x812) and desktop (1280x800) viewport.
 */
/* eslint-disable no-console -- this is a CLI gate: stdout IS the report. */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

import { chromium } from '@playwright/test';

const PORT = 3010;
const BASE = `http://localhost:${PORT}`;
const AXE_SRC = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js';
/** Local fallback so the scan works even if the CDN is blocked. */
const AXE_LOCAL = 'E:/Hermes/projects/paeonia/node_modules/axe-core/axe.min.js';

const ROUTES = [
  { url: '/', name: 'home' },
  { url: '/servicios', name: 'servicios' },
  { url: '/servicios/tarot', name: 'servicios/tarot' },
  { url: '/sobre-mi', name: 'sobre-mi' },
  { url: '/contacto', name: 'contacto' },
  { url: '/terminos', name: 'terminos' },
  { url: '/privacidad', name: 'privacidad' },
  { url: '/politica-cancelacion', name: 'politica-cancelacion' },
];

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'desktop-1280', width: 1280, height: 800 },
];

// Supabase REST stub WITHOUT next dev (see E2E_STUB_ONLY in server.mjs).
const stub = spawn('node', ['tests/e2e/server.mjs'], {
  cwd: process.cwd(),
  env: { ...process.env, E2E_STUB_ONLY: '1' },
  stdio: 'ignore',
  detached: true,
});

// Production server (`next start`) with every real credential neutralized —
// same policy as tests/e2e/server.mjs (.env.local leaks through Next env).
const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'e2e-service-role-key',
    EMAIL_PROVIDER: 'smtp',
    RESEND_API_KEY: '',
    SMTP_HOST: '',
    SMTP_USER: '',
    SMTP_PASS: '',
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: '',
    VAPID_PRIVATE_KEY: '',
  },
  shell: true,
  stdio: 'ignore',
  detached: true,
});

async function waitFor(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status < 500) {
        return true;
      }
    } catch {
      /* not up yet */
    }
    await sleep(1000);
  }
  return false;
}

async function injectAxe(page) {
  try {
    await page.addScriptTag({ url: AXE_SRC, timeout: 20_000 });
    return 'cdn';
  } catch {
    if (existsSync(AXE_LOCAL)) {
      await page.addScriptTag({ content: readFileSync(AXE_LOCAL, 'utf8') });
      return 'local';
    }
    throw new Error('axe-core unavailable (CDN down and no local copy)');
  }
}

async function main() {
  console.log('[a11y-scan] waiting for supabase stub (54321)...');
  if (!(await waitFor('http://localhost:54321/rest/v1/services', 30_000))) {
    throw new Error('supabase stub never came up');
  }
  console.log('[a11y-scan] waiting for next start (3010)...');
  if (!(await waitFor(`${BASE}/`, 90_000))) {
    throw new Error('next start never came up');
  }

  const browser = await chromium.launch();
  const results = [];
  const axeSources = new Set();
  let totalCritical = 0;
  let totalSerious = 0;
  let totalModerate = 0;

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.name.startsWith('mobile'),
      hasTouch: vp.name.startsWith('mobile'),
    });
    const page = await context.newPage();

    for (const route of ROUTES) {
      const url = `${BASE}${route.url}`;
      await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
      // Let hydration + fonts settle so axe sees the real DOM.
      await sleep(900);

      const axeSource = await injectAxe(page);
      axeSources.add(axeSource);

      const axe = await page.evaluate(async () => {
        const r = await window.axe.run(document, {
          resultTypes: ['violations'],
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
          },
        });
        return JSON.parse(JSON.stringify(r.violations));
      });

      const crit = axe.filter((v) => v.impact === 'critical');
      const ser = axe.filter((v) => v.impact === 'serious');
      const mod = axe.filter((v) => v.impact === 'moderate');
      totalCritical += crit.length;
      totalSerious += ser.length;
      totalModerate += mod.length;

      const entry = {
        route: route.name,
        viewport: vp.name,
        violations: axe.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.length,
          html: v.nodes[0]?.html?.slice(0, 200) ?? null,
          target: v.nodes[0]?.target?.join(' ')?.slice(0, 140) ?? null,
          failureSummary: v.nodes[0]?.failureSummary?.replace(/\s+/g, ' ')?.slice(0, 280) ?? null,
        })),
      };
      results.push(entry);

      const icon = crit.length || ser.length ? '🔴' : '🟢';
      console.log(
        `${icon} ${vp.name} ${route.name}: ${axe.length} violations (crit ${crit.length} / serious ${ser.length} / mod ${mod.length})`
      );
    }
    await context.close();
  }

  await browser.close();

  console.log(`\n[a11y-scan] axe sources: ${[...axeSources].join(', ')}`);
  console.log('=== A11Y SCAN SUMMARY (PRODUCTION BUILD) ===');
  console.log(`routes x viewports: ${results.length}`);
  console.log(`critical: ${totalCritical}`);
  console.log(`serious: ${totalSerious}`);
  console.log(`moderate: ${totalModerate}`);
  if (totalCritical + totalSerious > 0) {
    console.log('--- critical/serious detail ---');
    for (const r of results) {
      for (const v of r.violations) {
        if (v.impact === 'critical' || v.impact === 'serious') {
          console.log(
            `  [${v.impact}] ${v.id} — ${v.help} @ ${r.viewport} ${r.route} (nodes ${v.nodes})`,
          );
          console.log(`      target: ${v.target}`);
          console.log(`      html: ${v.html}`);
          console.log(`      why: ${v.failureSummary}`);
        }
      }
    }
  }
  process.exitCode = totalCritical + totalSerious > 0 ? 1 : 0;
}

main()
  .catch((err) => {
    console.error('[a11y-scan] FAILED:', err.message);
    process.exitCode = 2;
  })
  .finally(() => {
    for (const child of [server, stub]) {
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
        } else {
          child.kill();
        }
      } catch {
        /* ignore */
      }
    }
  });
