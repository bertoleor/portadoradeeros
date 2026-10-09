import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config for EROS (public booking happy path).
 *
 * The Next.js app is started by Playwright itself (`webServer`) in dev mode
 * with Supabase env vars pointing at a Playwright route-stub, so tests never
 * touch the live database, never send real emails, and never reach admin
 * devices. CI runs the same config (`npm run test:e2e`).
 *
 * Why `next dev` and not `next build && next start`: a production build of
 * this app takes ~26 minutes (Turbopack, 28 pages) which is impractical both
 * locally and in a 30-minute CI job; dev mode compiles pages on demand and
 * the happy path only touches 3 routes.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  // This machine has a slow filesystem (Turbopack on-demand compilation
  // takes seconds per route); 30s was too tight for the full 4-step flow.
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // One command, two servers: a zero-dep Supabase REST stub on
    // 127.0.0.1:54321 (tests/e2e/server.mjs) which then spawns `next dev`
    // as a child with Supabase env vars pointing at the stub. Server-side
    // fetches (server components/actions) can NOT be intercepted by
    // browser-level page.route(), so the stub must be a real HTTP server.
    command: 'node tests/e2e/server.mjs',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    // Cold `next dev` on this machine takes ~70s to Ready plus on-demand
    // Turbopack compilation of the first route (slow-filesystem warning in
    // the dev log) — 120s was not enough for the health-check GET to land.
    timeout: 300_000,
  },
});
