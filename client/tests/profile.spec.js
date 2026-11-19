
import { test, expect } from "@playwright/test";

const API_URL = "http://localhost:5000";

test.describe("Sweety Profile Tests", () => {

  test.describe.configure({ mode: "serial" });

  let userAToken;
  let userBToken;
  let userA;
  let userB;

  const unique = Date.now();

  const emailA = `profileA${unique}@test.com`;
  const emailB = `profileB${unique}@test.com`;
  const password = "TestPassword123";

  // Create two independent test accounts
  test.beforeAll(async ({ request }) => {

    // Register User A
    const registerA = await request.post(
      `${API_URL}/api/auth/register`,
      {
        data: {
          name: "Profile User A",
          email: emailA,
          password
        }
      }
    );

    expect(registerA.status()).toBe(201);

    // Login User A
    const loginA = await request.post(
      `${API_URL}/api/auth/login`,
      {
        data: {
          email: emailA,
          password
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
          name: "Profile User B",
          email: emailB,
          password
        }
      }
    );

    expect(registerB.status()).toBe(201);

    // Login User B
    const loginB = await request.post(
      `${API_URL}/api/auth/login`,
      {
        data: {
          email: emailB,
          password
        }
      }
    );

    expect(loginB.ok()).toBeTruthy();

    const bodyB = await loginB.json();

    userBToken = bodyB.token;
    userB = bodyB.user;

  });

  // Helper: Authenticate browser session
  async function authenticatePage(page, token, user) {

    await page.goto("/login");

    await page.evaluate(({ token, user }) => {

      sessionStorage.setItem("token", token);

      sessionStorage.setItem(
        "user",
        JSON.stringify(user)
      );

    }, { token, user });

  }

  // 1. Open Profile page
  test("1. Open Profile page successfully", async ({ page }) => {

    await authenticatePage(page, userAToken, userA);

    await page.goto("/profile");

    await expect(page).toHaveURL(/\/profile$/);

    await expect(
      page.getByRole("heading", { name: "My Profile" })
    ).toBeVisible();

  });

  // 2. Display correct user details
  test("2. Display correct user details", async ({ page }) => {

    await authenticatePage(page, userAToken, userA);

    await page.goto("/profile");

    await expect(
      page.locator(".profile-user-heading h2")
    ).toHaveText(userA.name);

    await expect(
      page.locator(".profile-user-heading p")
    ).toHaveText(userA.email);

    await expect(
      page.locator(".profile-details-card")
    ).toContainText(String(userA.id));

  });

  // 3. Edit profile name
  test("3. Edit profile name", async ({ page }) => {

    await authenticatePage(page, userAToken, userA);

    await page.goto("/profile");

    await page.getByRole("button", {
      name: "Edit"
    }).click();

    await expect(
      page.getByRole("textbox", { name: "Full name" })
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Save" })
    ).toBeVisible();

    await page.getByRole("button", {
      name: "Cancel"
    }).click();

    await expect(
      page.locator(".profile-user-heading h2")
    ).toHaveText(userA.name);

  });

  // 4. Save updated name
  test("4. Save updated profile name", async ({ page, request }) => {

    await authenticatePage(page, userAToken, userA);

    await page.goto("/profile");

    const updatedName = `Updated Profile ${unique}`;

    await page.getByRole("button", {
      name: "Edit"
    }).click();

    await page.getByRole("textbox", {
      name: "Full name"
    }).fill(updatedName);

    await page.getByRole("button", {
      name: "Save"
    }).click();

    await expect(
      page.locator(".profile-user-heading h2")
    ).toHaveText(updatedName);

    await expect(
      page.getByRole("status")
    ).toHaveText("Profile updated successfully!");

    // Verify updated name is stored in sessionStorage
    const storedUser = await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("user"))
    );

    expect(storedUser.name).toBe(updatedName);

    userA = storedUser;

    // Verify database update through login response
    const login = await request.post(
      `${API_URL}/api/auth/login`,
      {
        data: {
          email: emailA,
          password
        }
      }
    );

    expect(login.ok()).toBeTruthy();

    const loginBody = await login.json();

    expect(loginBody.user.name).toBe(updatedName);

  });

  // 5. Reject empty name
  test("5. Reject empty profile name", async ({ page }) => {

    await authenticatePage(page, userAToken, userA);

    await page.goto("/profile");

    await page.getByRole("button", {
      name: "Edit"
    }).click();

    await page.getByRole("textbox", {
      name: "Full name"
    }).fill("   ");

    await page.getByRole("button", {
      name: "Save"
    }).click();

    await expect(
      page.getByRole("alert")
    ).toHaveText("Name cannot be empty");

    await expect(
      page.locator(".profile-user-heading h2")
    ).toHaveText(userA.name);

  });

  // 6. Reject unauthenticated access
  test("6. Reject unauthenticated profile access", async ({ page, request }) => {

    // API request without token
    const response = await request.put(
      `${API_URL}/api/profile`,
      {
        data: {
          name: "Unauthorized User"
        }
      }
    );

    expect(response.status()).toBe(401);

    const body = await response.json();

    expect(body.success).toBe(false);

    // Browser access without authentication
    await page.goto("/profile");

    await expect(page).toHaveURL(/\/login$/);

  });

  // 7. Logout successfully
  test("7. Logout successfully", async ({ page }) => {

    await authenticatePage(page, userAToken, userA);

    await page.goto("/profile");

    const logoutButton = page.locator(".dashboard-logout");

    await expect(logoutButton).toBeVisible();

    await logoutButton.click();

    await expect(page).toHaveURL(/\/login$/);

    const session = await page.evaluate(() => ({
      token: sessionStorage.getItem("token"),
      user: sessionStorage.getItem("user")
    }));

    expect(session.token).toBeNull();
    expect(session.user).toBeNull();

  });

  // 8. Profile remains accessible after refresh
  test("8. Profile remains accessible after page refresh", async ({ page }) => {

    await authenticatePage(page, userAToken, userA);

    await page.goto("/profile");

    await expect(
      page.locator(".profile-user-heading h2")
    ).toHaveText(userA.name);

    await page.reload();

    await expect(page).toHaveURL(/\/profile$/);

    await expect(
      page.locator(".profile-user-heading h2")
    ).toHaveText(userA.name);

  });

  // 9. Prevent modification of another user's profile
  test("9. User B cannot modify User A's profile", async ({ request }) => {

    const attemptedName = "Unauthorized Profile Change";

    // User B attempts to supply User A's ID
    const response = await request.put(
      `${API_URL}/api/profile`,
      {
        headers: {
          Authorization: `Bearer ${userBToken}`
        },
        data: {
          id: userA.id,
          name: attemptedName
        }
      }
    );

    // The API updates only the authenticated user's record
    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.user.id).toBe(userB.id);
    expect(body.user.name).toBe(attemptedName);

    // Verify User A's profile remains unchanged
    const loginA = await request.post(
      `${API_URL}/api/auth/login`,
      {
        data: {
          email: emailA,
          password
        }
      }
    );

    const bodyA = await loginA.json();

    expect(bodyA.user.id).toBe(userA.id);
    expect(bodyA.user.name).toBe(userA.name);

  });

});
