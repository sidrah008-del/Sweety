
import { test, expect } from "@playwright/test";

const testPassword = "SweetyTest@123";

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Create a separate authenticated user for each test
async function createAuthenticatedUser(page) {
  const email = `readings_test_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 7)}@example.com`;

  await page.goto("/register");

  await page.getByLabel("Full name").fill("Readings Test User");
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

  await expect(
    page.getByText("No readings yet")
  ).toBeVisible();
}

async function addReading(page, slot, value) {
  await page.getByLabel("Reading date").fill(getToday());

  await page.getByLabel("Reading time").selectOption(slot);

  await page.getByLabel("Glucose value (mg/dL)").fill(String(value));

  await page.getByRole("button", {
    name: "Save reading",
  }).click();
}

const API_URL = "http://localhost:5000";

async function createApiUser(request) {
  const email = `api_readings_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 7)}@example.com`;

  const response = await request.post(
    `${API_URL}/api/auth/register`,
    {
      data: {
        name: "API Test User",
        email,
        password: testPassword,
      },
    }
  );

  expect(response.status()).toBe(201);

  const data = await response.json();

  expect(data.success).toBe(true);
  expect(data.token).toBeTruthy();

  return data.token;
}

async function apiAddReading(request, token, reading = {}) {
  return request.post(`${API_URL}/api/readings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      reading_date: getToday(),
      slot: "Morning (fasting)",
      value: 108,
      ...reading,
    },
  });
}

async function getTomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

test.describe("Sweety Reading API Validation Tests", () => {

  test("6. Reject glucose value below 40 through API", async ({ request }) => {
    const token = await createApiUser(request);

    const response = await apiAddReading(request, token, {
      value: 39,
    });

    expect(response.status()).toBe(400);

    const data = await response.json();

    expect(data.message).toBe(
      "Glucose value must be a whole number between 40 and 600 mg/dL"
    );
  });

  test("7. Reject glucose value above 600 through API", async ({ request }) => {
    const token = await createApiUser(request);

    const response = await apiAddReading(request, token, {
      value: 601,
    });

    expect(response.status()).toBe(400);
    expect((await response.json()).success).toBe(false);
  });

  test("8. Reject decimal glucose values through API", async ({ request }) => {
    const token = await createApiUser(request);

    const response = await apiAddReading(request, token, {
      value: 108.5,
    });

    expect(response.status()).toBe(400);
    expect((await response.json()).success).toBe(false);
  });

  test("9. Reject missing reading date", async ({ request }) => {
    const token = await createApiUser(request);

    const response = await apiAddReading(request, token, {
      reading_date: undefined,
    });

    expect(response.status()).toBe(400);

    expect((await response.json()).message).toBe(
      "Please provide date, slot and glucose value"
    );
  });

  test("10. Reject missing reading slot", async ({ request }) => {
    const token = await createApiUser(request);

    const response = await apiAddReading(request, token, {
      slot: undefined,
    });

    expect(response.status()).toBe(400);
  });

  test("11. Reject missing glucose value", async ({ request }) => {
    const token = await createApiUser(request);

    const response = await apiAddReading(request, token, {
      value: undefined,
    });

    expect(response.status()).toBe(400);
  });

  test("12. Reject invalid calendar date", async ({ request }) => {
    const token = await createApiUser(request);

    const response = await apiAddReading(request, token, {
      reading_date: "2026-02-30",
    });

    expect(response.status()).toBe(400);

    expect((await response.json()).message).toBe(
      "Please provide a valid date"
    );
  });

  test("13. Reject future reading dates", async ({ request }) => {
    const token = await createApiUser(request);

    const response = await apiAddReading(request, token, {
      reading_date: await getTomorrow(),
    });

    expect(response.status()).toBe(400);

    expect((await response.json()).message).toBe(
      "Future dates are not allowed"
    );
  });

  test("14. Successfully edit an existing reading through API", async ({ request }) => {
    const token = await createApiUser(request);

    const addResponse = await apiAddReading(request, token);

    expect(addResponse.status()).toBe(201);

    const added = await addResponse.json();
    const readingId = added.reading.id;

    const updateResponse = await request.put(
      `${API_URL}/api/readings/${readingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          reading_date: getToday(),
          slot: "Morning (fasting)",
          value: 125,
        },
      }
    );

    expect(updateResponse.status()).toBe(200);

    const updated = await updateResponse.json();

    expect(updated.success).toBe(true);
    expect(updated.reading.value).toBe(125);
    expect(updated.reading.id).toBe(readingId);
  });

  test("15. Prevent editing another user's reading", async ({ request }) => {
    const ownerToken = await createApiUser(request);
    const otherUserToken = await createApiUser(request);

    const addResponse = await apiAddReading(request, ownerToken);

    expect(addResponse.status()).toBe(201);

    const added = await addResponse.json();
    const readingId = added.reading.id;

    const updateResponse = await request.put(
      `${API_URL}/api/readings/${readingId}`,
      {
        headers: {
          Authorization: `Bearer ${otherUserToken}`,
        },
        data: {
          reading_date: getToday(),
          slot: "Morning (fasting)",
          value: 150,
        },
      }
    );

    expect(updateResponse.status()).toBe(404);

    expect((await updateResponse.json()).message).toBe(
      "Reading not found"
    );
  });

});

test.describe("Sweety Glucose Readings Tests", () => {

  test.beforeEach(async ({ page }) => {
    await createAuthenticatedUser(page);
  });

  // TEST 1: ADD READING
  test("1. Add a valid glucose reading", async ({ page }) => {

    await addReading(page, "Morning (fasting)", 108);

    await expect(
      page.getByRole("status")
    ).toHaveText("Glucose reading added successfully!");

    await expect(
      page.getByRole("cell", { name: "Morning (fasting)" })
    ).toBeVisible();

    await expect(
      page.getByRole("cell", { name: /108 mg\/dL/ })
    ).toBeVisible();

    await expect(
      page.locator(".readings-summary-card").first().locator("strong")
    ).toHaveText("1");
  });

  // TEST 2: DUPLICATE READING
  test("2. Reject duplicate reading for the same date and slot", async ({ page }) => {

    await addReading(page, "Morning (fasting)", 108);

    await expect(page.getByRole("status")).toBeVisible();

    await addReading(page, "Morning (fasting)", 115);

    await expect(
      page.getByRole("alert")
    ).toHaveText("A reading already exists for this slot and date");

    await expect(
      page.locator(".readings-summary-card").first().locator("strong")
    ).toHaveText("1");
  });

  // TEST 3: INVALID GLUCOSE VALUE
  test("3. Reject glucose values below the allowed range", async ({ page }) => {

    await page.getByLabel("Reading time").selectOption("Morning (fasting)");

    const glucoseInput = page.getByLabel("Glucose value (mg/dL)");

    await glucoseInput.fill("39");

    const isInvalid = await glucoseInput.evaluate(
      (element) => element.validity.rangeUnderflow
    );

    expect(isInvalid).toBe(true);

    await page.getByRole("button", {
      name: "Save reading",
    }).click();

    await expect(
      page.getByText("No readings yet")
    ).toBeVisible();

    await expect(
      page.locator(".readings-summary-card").first().locator("strong")
    ).toHaveText("0");
  });

  // TEST 4: DAILY READING LIMIT
  test("4. Enforce maximum four readings per day", async ({ page }) => {

    const slots = [
      "Morning (fasting)",
      "After breakfast",
      "After lunch",
      "After dinner",
    ];

    for (let i = 0; i < slots.length; i++) {
      await addReading(page, slots[i], 100 + i);

      await expect(
        page.getByRole("status")
      ).toHaveText("Glucose reading added successfully!");
    }

    await expect(
      page.locator(".readings-summary-card").first().locator("strong")
    ).toHaveText("4");

    // Try adding a fifth reading
    await addReading(page, "Morning (fasting)", 150);

    await expect(
      page.getByRole("alert")
    ).toHaveText("Maximum 4 readings allowed per day");

    await expect(
      page.locator(".readings-summary-card").first().locator("strong")
    ).toHaveText("4");
  });

  // TEST 5: DELETE READING
  test("5. Delete an existing glucose reading", async ({ page }) => {

    await addReading(page, "Morning (fasting)", 108);

    await expect(
      page.getByRole("cell", { name: /108 mg\/dL/ })
    ).toBeVisible();

    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toBe(
        "Are you sure you want to delete this reading?"
      );

      await dialog.accept();
    });

    await page.getByRole("button", {
      name: "Delete",
    }).click();

    await expect(
      page.getByRole("status")
    ).toHaveText("Reading deleted successfully!");

    await expect(
      page.getByText("No readings yet")
    ).toBeVisible();

    await expect(
      page.locator(".readings-summary-card").first().locator("strong")
    ).toHaveText("0");
  });

});
