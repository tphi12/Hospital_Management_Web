import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { expect, test } from '@playwright/test';

const meta = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'e2e/.seed-meta.json'), 'utf8'),
);

async function login(page, credentials) {
  await page.goto('/login');
  await page.getByTestId('login-username').fill(credentials.username);
  await page.getByTestId('login-password').fill(credentials.password);
  await page.getByTestId('login-submit').click();
  await page.waitForURL('**/');
}

async function acceptNextDialog(page) {
  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
}

test.describe.serial('Schedule workflows', () => {
  test('department clerk can submit a prepared duty schedule to KHTH', async ({ page }) => {
    await login(page, meta.users.clerk);
    await page.goto('/schedule/department');

    await expect(page.getByTestId('duty-clerk-page')).toBeVisible();
    await expect(page.getByTestId('submit-duty-schedule-button')).toBeVisible();

    await page.getByTestId('submit-duty-schedule-button').click();
    await page.locator('.ant-modal-confirm .ant-btn-primary').click();

    await expect(page.getByTestId('submit-duty-schedule-button')).toBeHidden();
    await expect(page.locator('body')).toContainText('Đã gửi KHTH');
  });

  test('KHTH can edit, approve, and export the submitted duty schedule', async ({ page }) => {
    await login(page, meta.users.khth);
    await page.goto('/schedule/master');

    await expect(page.getByTestId('duty-master-page')).toBeVisible();
    await expect(page.getByTestId('duty-review-queue')).toBeVisible();
    await expect(page.getByTestId('duty-review-queue')).toContainText(meta.duty.departmentName);

    const editButton = page.locator('[data-testid^="edit-shift-"]').first();
    await expect(editButton).toBeVisible();
    await editButton.click();

    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    await modal.locator('input[role="spinbutton"]').fill('4');
    await page.getByTestId('save-duty-shift-button').click();

    await expect(page.locator('body')).toContainText('1/4');

    await page.getByTestId('approve-duty-schedule-button').click();
    await expect(page.getByTestId('approve-duty-schedule-button')).toBeHidden();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-duty-pdf-button').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/Duty|Master/i);
  });

  test('staff can view and export the approved duty schedule', async ({ page }) => {
    await login(page, meta.users.staff);
    await page.goto('/schedule/master');

    await expect(page.getByTestId('duty-master-page')).toBeVisible();
    await expect(page.locator('body')).toContainText(meta.duty.departmentName);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-duty-pdf-button').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/Duty|Master/i);
  });

  test('KHTH can add, publish, and export a weekly work schedule', async ({ page }) => {
    await login(page, meta.users.khth);
    await page.goto('/schedule/weekly');

    await expect(page.getByTestId('weekly-schedule-page')).toBeVisible();
    await expect(page.getByTestId('weekly-draft-queue')).toBeVisible();
    await page.getByTestId('weekly-schedule-select').selectOption(String(meta.weekly.scheduleId));
    await page.getByTestId('show-add-weekly-item-form-button').click();

    await page.getByTestId('weekly-item-work-date').fill(`${meta.weekly.year}-01-02`);
    await page.getByTestId('weekly-item-time-period').selectOption('Sáng');
    await page.getByTestId('weekly-item-location').fill('Phong hop E2E');
    await page.getByTestId('weekly-item-content').fill('Hop giao ban E2E');
    await page.getByTestId('save-weekly-item-button').click();

    await expect(page.locator('body')).toContainText('Hop giao ban E2E');

    await acceptNextDialog(page);
    await page.getByTestId('publish-weekly-schedule-button').click();
    await expect(page.getByTestId('publish-weekly-schedule-button')).toBeHidden();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-weekly-pdf-button').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/Weekly|Schedule/i);
  });

  test('staff can view and export the published weekly work schedule', async ({ page }) => {
    await login(page, meta.users.staff);
    await page.goto('/schedule/weekly');

    await expect(page.getByTestId('weekly-schedule-page')).toBeVisible();
    await page.getByTestId('weekly-schedule-select').selectOption(String(meta.weekly.scheduleId));
    await expect(page.locator('body')).toContainText('Hop giao ban E2E');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-weekly-pdf-button').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/Weekly|Schedule/i);
  });

  test('staff can see approved duty assignments in MySchedule', async ({ page }) => {
    await login(page, meta.users.staff);
    await page.goto('/schedule/me');

    await expect(page.getByTestId('my-schedule-duty-list')).toBeVisible();
    await expect(page.getByTestId('my-schedule-duty-list')).toContainText(meta.duty.departmentName);
    await expect(page.getByTestId('my-schedule-duty-list')).toContainText('07:00');
  });
});
