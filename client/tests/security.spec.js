
import { test, expect } from "@playwright/test";

const API_URL = "http://localhost:5000";

test.describe("Sweety Security Tests", () => {

  test("5. Reject expired JWT token", async ({ request }) => {
   const jwt = await import("../../server/node_modules/jsonwebtoken/index.js");

    const expiredToken = jwt.default.sign(
      {
        id: 1,
        email: "expired@test.com"
      },
      process.env.JWT_SECRET,
      { expiresIn: "-1s" }
    );

    const response = await request.get(
      `${API_URL}/api/readings`,
      {
        headers: {
          Authorization: `Bearer ${expiredToken}`
        }
      }
    );

    expect(response.status()).toBe(401);

    const body = await response.json();

    expect(body.success).toBe(false);
    expect(body.message).toBe("Invalid or expired token");
  });

test("6. Reject tampered JWT token", async ({ request }) => {

  const parts = userAToken.split(".");

  // Modify the JWT signature
  const tamperedToken =
    `${parts[0]}.${parts[1]}.${parts[2].slice(0, -1)}x`;

  const response = await request.get(
    `${API_URL}/api/readings`,
    {
      headers: {
        Authorization: `Bearer ${tamperedToken}`
      }
    }
  );

  expect(response.status()).toBe(401);

  const body = await response.json();

  expect(body.success).toBe(false);
  expect(body.message).toBe("Invalid or expired token");
});


  let userAToken;
let userBToken;
let userAReadingId;
let userA;
  const unique = Date.now();

  test.beforeAll(async ({ request }) => {

    // Register User A
    const registerA = await request.post(
      `${API_URL}/api/auth/register`,
      {
        data: {
          name: "Security User A",
          email: `securityA${unique}@test.com`,
          password: "TestPassword123"
        }
      }
    );

    expect(registerA.ok()).toBeTruthy();

    const loginA = await request.post(
      `${API_URL}/api/auth/login`,
      {
        data: {
          email: `securityA${unique}@test.com`,
          password: "TestPassword123"
        }
      }
    );

    expect(loginA.ok()).toBeTruthy();

    const bodyA = await loginA.json();
userAToken = bodyA.token;
userA = bodyA.user;

    // Register User B
    const registerB = await request.post(
      `${API_URL}/api/auth/register`,
      {
        data: {
          name: "Security User B",
          email: `securityB${unique}@test.com`,
          password: "TestPassword123"
        }
      }
    );

    expect(registerB.ok()).toBeTruthy();

    const loginB = await request.post(
      `${API_URL}/api/auth/login`,
      {
        data: {
          email: `securityB${unique}@test.com`,
          password: "TestPassword123"
        }
      }
    );

    expect(loginB.ok()).toBeTruthy();

    const bodyB = await loginB.json();
    userBToken = bodyB.token;

    // Create a reading belonging to User A
    const reading = await request.post(
      `${API_URL}/api/readings`,
      {
        headers: {
          Authorization: `Bearer ${userAToken}`
        },
        data: {
          reading_date: "2026-11-17",
          slot: "Morning (fasting)",
          value: 108
        }
      }
    );

    expect(reading.status()).toBe(201);

    const readingBody = await reading.json();
    userAReadingId = readingBody.reading.id;

  });

  test("1. User B cannot see User A's readings", async ({ request }) => {

    const response = await request.get(
      `${API_URL}/api/readings`,
      {
        headers: {
          Authorization: `Bearer ${userBToken}`
        }
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.readings).toHaveLength(0);

  });

  test("2. User B cannot update User A's reading", async ({ request }) => {

    const response = await request.put(
      `${API_URL}/api/readings/${userAReadingId}`,
      {
        headers: {
          Authorization: `Bearer ${userBToken}`
        },
        data: {
          reading_date: "2026-11-17",
          slot: "After breakfast",
          value: 200
        }
      }
    );

    expect(response.status()).toBe(404);

    const body = await response.json();

    expect(body.success).toBe(false);
    expect(body.message).toBe("Reading not found");

  });

  test("3. User B cannot delete User A's reading", async ({ request }) => {

    const response = await request.delete(
      `${API_URL}/api/readings/${userAReadingId}`,
      {
        headers: {
          Authorization: `Bearer ${userBToken}`
        }
      }
    );

    expect(response.status()).toBe(404);

    const body = await response.json();

    expect(body.success).toBe(false);
    expect(body.message).toBe("Reading not found");

  });

  test("4. User A's reading remains unchanged", async ({ request }) => {

    const response = await request.get(
      `${API_URL}/api/readings`,
      {
        headers: {
          Authorization: `Bearer ${userAToken}`
        }
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.readings).toHaveLength(1);
    expect(body.readings[0].id).toBe(userAReadingId);
    expect(body.readings[0].value).toBe(108);

  });

test("7. Logout clears session and redirects to login", async ({ page }) => {

  // Open the application
  await page.goto("/login");

  // Set the authenticated session
  await page.evaluate(({ token, user }) => {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));
  }, {
    token: userAToken,
    user: userA
  });

  // Open dashboard
  await page.goto("/dashboard");

  // Verify logout button
  const logoutButton = page.locator(".dashboard-logout");
  await expect(logoutButton).toBeVisible();

  // Logout
  await logoutButton.click();

  // Verify redirect
  await expect(page).toHaveURL(/\/login$/);

  // Verify session is cleared
  const session = await page.evaluate(() => ({
    token: sessionStorage.getItem("token"),
    user: sessionStorage.getItem("user")
  }));

  expect(session.token).toBeNull();
  expect(session.user).toBeNull();

  // Verify dashboard cannot be accessed again
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
});

});
