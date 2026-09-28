import { expect, test } from '@playwright/test';

import { BookingPage } from './pages/booking-page';

/**
 * E2E happy path for the public booking wizard.
 *
 * Infrastructure: `playwright.config.ts` → `webServer` starts
 * `tests/e2e/server.mjs`, a zero-dep Supabase REST stub on 127.0.0.1:54321
 * that spawns `next dev` with Supabase env vars pointing at the stub. All
 * server-side data (services, admin_settings, appointments, auth getUser)
 * is deterministic; emails/push fail silently by design. No live systems
 * are touched.
 */
test.describe('Booking happy path (public wizard)', () => {
  test(
    'visitor books a tarot session end to end',
    { tag: ['@critical', '@e2e', '@booking', '@BOOKING-E2E-001'] },
    async ({ page }) => {
      const booking = new BookingPage(page);

      // 1. Service detail page renders the wizard intro.
      await booking.gotoService('tarot');
      await booking.startButton.click();

      // 2. Client info step → next.
      await booking.fillClientInfo({
        name: 'Valentina',
        surname: 'Prueba',
        email: 'valentina.prueba@example.com',
        phone: '+54 9 11 5555 5555',
      });

      // 3. Calendar step → first available day.
      await booking.selectFirstFutureDay();

      // 4. Time picker step → 10:00.
      await booking.selectTime('10', '00');

      // 5. Review step → accept legal terms and confirm.
      await booking.confirm();

      // 6. Success state reached (server action returned ok).
      await expect(booking.successHeading).toBeVisible();
    }
  );
});
