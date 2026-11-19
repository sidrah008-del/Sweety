
import { test, expect } from "@playwright/test";

const testPassword = "SweetyTest@123";

const getDateOffset = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getToday = () => getDateOffset(0);

// Create a fresh user for each test
async function createAuthenticatedUser(page) {
  const email = `reports_test_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 7)}@example.com`;

  await page.goto("/register");

  await page.getByLabel("Full name").fill("Reports Test User");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(testPassword);
  await page.getByLabel("Confirm password").fill(testPassword);

  await page.getByRole("button", {
    name: "Create account",
  }).click();

  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/readings");

  await expect(
    page.getByRole("heading", { name: "My readings" })
  ).toBeVisible();
}

// Add a glucose reading
async function addReading(page, slot, value) {
  await page.getByLabel("Reading date").fill(getToday());
  await page.getByLabel("Reading time").selectOption(slot);
  await page.getByLabel("Glucose value (mg/dL)").fill(String(value));

  await page.getByRole("button", {
    name: "Save reading",
  }).click();

  await expect(page.getByRole("status")).toHaveText(
    "Glucose reading added successfully!"
  );
}

test.describe("Sweety Reports Tests", () => {
  test.beforeEach(async ({ page }) => {
    await createAuthenticatedUser(page);
  });

  // TEST 1: REPORTS PAGE
  test("1. Open reports page successfully", async ({ page }) => {
    await page.goto("/reports");

    await expect(
      page.getByRole("heading", { name: "Glucose reports" })
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Daily report" })
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Monthly report" })
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Previous month" })
    ).toBeVisible();
  });

  // TEST 2: EMPTY REPORTS
  test("2. Display empty-state messages when no readings exist", async ({ page }) => {
    await page.goto("/reports");

    await expect(
      page.getByText("No readings recorded during this period.")
    ).toHaveCount(3);

    await expect(
      page.getByText(
        "No trend data available yet. Add glucose readings to see your trend chart."
      )
    ).toBeVisible();
  });

  // TEST 3: REPORT SUMMARY
  test("3. DISPLAY correct glucose summary statistics", async ({ page }) => {
    await addReading(page, "Morning (fasting)", 108);
    await addReading(page, "After breakfast", 112);

    await page.goto("/reports");

    const dailyReport = page.locator(".report-card").filter({
      has: page.getByRole("heading", { name: "Daily report" }),
    });

    await expect(dailyReport).toBeVisible();

    const stats = dailyReport.locator(".report-stat");

    await expect(stats.nth(0).locator("strong")).toHaveText("2");
    await expect(stats.nth(1).locator("strong")).toHaveText("110.0");
    await expect(stats.nth(2).locator("strong")).toHaveText("112");
    await expect(stats.nth(3).locator("strong")).toHaveText("108");

    const monthlyReport = page.locator(".report-card").filter({
      has: page.getByRole("heading", { name: "Monthly report" }),
    });

    await expect(
      monthlyReport.locator(".report-stat").nth(0).locator("strong")
    ).toHaveText("2");
  });

  // TEST 4: GLUCOSE TREND CHART
  test("4. Display glucose trend chart when readings exist", async ({ page }) => {
    await addReading(page, "Morning (fasting)", 108);
    await addReading(page, "After breakfast", 112);

    await page.goto("/reports");

    const trendCard = page.locator(".trend-card");

    await expect(
      trendCard.getByRole("heading", { name: "Glucose trends" })
    ).toBeVisible();

    await expect(
      trendCard.locator(".recharts-wrapper")
    ).toBeVisible();

    await expect(
      trendCard.locator("svg")
    ).toBeVisible();

    await expect(
      trendCard.locator(".recharts-line-dots circle")
    ).toHaveCount(1);
  });

  // TEST 5: TREND API
  test("5. Return correct glucose trend data from the API", async ({ page }) => {
    await addReading(page, "Morning (fasting)", 108);
    await addReading(page, "After breakfast", 112);

    const token = await page.evaluate(() =>
      sessionStorage.getItem("token")
    );

    const response = await page.request.get(
      "http://localhost:5000/api/reports/trend",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.trend).toHaveLength(1);

    expect(body.trend[0].reading_date).toBe(getToday());
    expect(Number(body.trend[0].average)).toBe(110);
    expect(Number(body.trend[0].lowest)).toBe(108);
    expect(Number(body.trend[0].highest)).toBe(112);
    expect(Number(body.trend[0].total_readings)).toBe(2);
  });

  // TEST 6: DATE FILTER
  test("6. Update report summaries when the selected date changes", async ({ page }) => {
    await addReading(page, "Morning (fasting)", 108);

    await page.goto("/reports");

    const datePicker = page.getByLabel("Select report date");

    await expect(datePicker).toHaveValue(getToday());
    await expect(datePicker).toHaveAttribute("max", getToday());

    const dailyReport = page.locator(".report-card").filter({
      has: page.getByRole("heading", { name: "Daily report" }),
    });

    // Verify today's report
    await expect(
      dailyReport.locator(".report-stat").nth(0).locator("strong")
    ).toHaveText("1");

    // Select a date 10 days ago
    const emptyDate = getDateOffset(-10);

    await datePicker.fill(emptyDate);

    await expect(datePicker).toHaveValue(emptyDate);

    // Verify backend response for the selected date
    const token = await page.evaluate(() =>
      sessionStorage.getItem("token")
    );

    const response = await page.request.get(
      `http://localhost:5000/api/reports?date=${emptyDate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.success).toBe(true);
    expect(Number(body.reports.daily.total_readings)).toBe(0);

    // Verify frontend updates to the empty state
    await expect(
      dailyReport.locator(".report-no-data")
    ).toBeVisible();

    // Return to today's report
    await datePicker.fill(getToday());

    await expect(
      dailyReport.locator(".report-stat").nth(0).locator("strong")
    ).toHaveText("1");
  });

  // TEST 7: REPORTS API WITH SELECTED DATE
  test("7. Return correct daily report data for the requested date", async ({ page }) => {
    await addReading(page, "Morning (fasting)", 108);
    await addReading(page, "After breakfast", 112);

    const token = await page.evaluate(() =>
      sessionStorage.getItem("token")
    );

    const response = await page.request.get(
      `http://localhost:5000/api/reports?date=${getToday()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.success).toBe(true);
    expect(Number(body.reports.daily.total_readings)).toBe(2);
    expect(Number(body.reports.daily.average)).toBe(110);
    expect(Number(body.reports.daily.highest)).toBe(112);
    expect(Number(body.reports.daily.lowest)).toBe(108);
  });
});
