
import { test, expect } from "@playwright/test";

const testEmail = `sweety_test_${Date.now()}@example.com`;
const testPassword = "SweetyTest@123";

test.describe("Sweety Authentication Tests", () => {

  test("1. Registration with valid details", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("Full name").fill("Sweety Test User");
    await page.getByLabel("Email address").fill(testEmail);
    await page.getByLabel("Password", { exact: true }).fill(testPassword);
    await page.getByLabel("Confirm password").fill(testPassword);

    await page.getByRole("button", {
      name: "Create account",
    }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    const token = await page.evaluate(() =>
      sessionStorage.getItem("token")
    );

    expect(token).toBeTruthy();
  });

  test("2. Registration with an existing email", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("Full name").fill("Duplicate User");
    await page.getByLabel("Email address").fill(testEmail);
    await page.getByLabel("Password", { exact: true }).fill(testPassword);
    await page.getByLabel("Confirm password").fill(testPassword);

    await page.getByRole("button", {
      name: "Create account",
    }).click();

    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("3. Login with valid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email address").fill(testEmail);
    await page.getByLabel("Password", { exact: true }).fill(testPassword);

    await page.getByRole("button", {
      name: /log in/i,
    }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    const token = await page.evaluate(() =>
      sessionStorage.getItem("token")
    );

    expect(token).toBeTruthy();
  });

  test("4. Login with incorrect password", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email address").fill(testEmail);
    await page.getByLabel("Password", { exact: true }).fill("WrongPassword@123");

    await page.getByRole("button", {
      name: /log in/i,
    }).click();

    await expect(page.locator('[role="alert"], .auth-error').first()).toBeVisible();

    await expect(page).toHaveURL(/\/login/);
  });

  test("5. Login with empty fields", async ({ page }) => {
    await page.goto("/login");

    const loginButton = page.getByRole("button", {
      name: /log in/i,
    });

    await expect(loginButton).toBeVisible();
    await loginButton.click();

    // Browser should prevent submission because required fields are empty.
    const emailInput = page.getByLabel("Email address");
    const passwordInput = page.getByLabel("Password", { exact: true });

    const emailInvalid = await emailInput.evaluate(
      (element) => !element.validity.valid
    );

    const passwordInvalid = await passwordInput.evaluate(
      (element) => !element.validity.valid
    );

    expect(emailInvalid || passwordInvalid).toBeTruthy();

    await expect(page).toHaveURL(/\/login/);
  });

});
