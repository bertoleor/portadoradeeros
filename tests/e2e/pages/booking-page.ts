import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page object for the public 4-step booking wizard on `/servicios/{slug}`.
 *
 * Selector strategy (per the playwright skill): role/label-based locators
 * derived from the real DOM of `ServiceContactForm`/`BookingCalendar`/
 * `CustomTimePicker` — no CSS classes, no brittle ids. Buttons are addressed
 * by their visible uppercase name; form inputs by their accessible label.
 */
export class BookingPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async gotoService(slug: string): Promise<void> {
    await this.page.goto(`/servicios/${slug}`);
    await expect(this.startButton).toBeVisible();
  }

  // ── Step 0: intro ────────────────────────────────────────────────────────

  get startButton(): Locator {
    // "Comenzar Reserva" (trailing space in JSX renders trimmed by Playwright
    // name matching, but use a substring regex to be safe against i18n tweaks).
    return this.page.getByRole('button', { name: /Comenzar Reserva/ });
  }

  // ── Step 1: client info ──────────────────────────────────────────────────

  get nameInput(): Locator {
    return this.page.getByLabel('Nombre');
  }

  get surnameInput(): Locator {
    return this.page.getByLabel('Apellido');
  }

  get emailInput(): Locator {
    return this.page.getByLabel('Email');
  }

  get phoneInput(): Locator {
    // "WhatsApp" also matches the Navbar's wa.me link; the form field is
    // the only TEXTBOX with that accessible name.
    return this.page.getByRole('textbox', { name: 'WhatsApp' });
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: /^Continuar/ });
  }

  async fillClientInfo(data: {
    name: string;
    surname: string;
    email: string;
    phone: string;
  }): Promise<void> {
    await this.nameInput.fill(data.name);
    await this.surnameInput.fill(data.surname);
    await this.emailInput.fill(data.email);
    await this.phoneInput.fill(data.phone);
    await this.continueButton.click();
  }

  // ── Step 2: calendar ──────────────────────────────────────────────────────

  get chooseTimeButton(): Locator {
    return this.page.getByRole('button', { name: /Elegir Hora/ });
  }

  async selectFirstFutureDay(): Promise<string> {
    // Pick the first ENABLED (future, open) day button in the grid. Day
    // buttons carry only their number as accessible name, so qualify by
    // :not([disabled]) and take the first non-past one.
    const day = this.page.locator('button:not([disabled])', { hasText: /^\d+$/ }).first();
    await day.click();
    await expect(this.chooseTimeButton).toBeEnabled();
    // Advance to the time picker (step 3).
    await this.chooseTimeButton.click();
    await expect(this.page.getByRole('heading', { name: 'Horarios Disponibles' })).toBeVisible();
    return '';
  }

  // ── Step 3: time picker ──────────────────────────────────────────────────

  /**
   * The hour/minute buttons are plain text buttons with no aria context, and
   * the CALENDAR (step 2) also renders numeric day buttons ("10" etc.) that
   * would match a bare `button:has-text("10")`. Scoping under the step-3
   * heading "Horarios Disponibles" guarantees we only touch the picker.
   */
  get stepThreeScope(): Locator {
    return this.page.locator('div', {
      has: this.page.getByRole('heading', { name: 'Horarios Disponibles' }),
    });
  }

  async selectTime(hourLabel: string, minuteLabel: string): Promise<void> {
    const scope = this.stepThreeScope;
    await scope
      .locator('button', { hasText: new RegExp(`^${hourLabel}$`) })
      .first()
      .click();
    await scope
      .locator('button', { hasText: new RegExp(`^${minuteLabel}$`) })
      .first()
      .click();
    // Advance to the review step (step 4).
    await this.continueButton.click();
    await expect(this.page.getByRole('heading', { name: 'Confirmación y Pago' })).toBeVisible();
  }

  // ── Step 4: confirm ──────────────────────────────────────────────────────

  get legalCheckbox(): Locator {
    return this.page.locator('input[type="checkbox"]');
  }

  get confirmButton(): Locator {
    return this.page.getByRole('button', { name: /Confirmar Turno/ });
  }

  get successHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Turno Solicitado' });
  }

  get submitError(): Locator {
    return this.page.locator('text=/Error|error/');
  }

  async confirm(): Promise<void> {
    await this.legalCheckbox.check();
    await this.confirmButton.click();
    await expect(this.successHeading).toBeVisible({ timeout: 15_000 });
  }
}
