import { expect, test } from "@playwright/test";

test("nominee can request OTP from the login page", async ({ page }) => {
  await page.route("**/api/proxy/api/auth/request-otp", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        maskedPhone: "******3210",
        expiresAt: "2026-04-15T12:00:00.000Z",
        debugOtp: "123456"
      })
    });
  });

  await page.goto("/login");
  await page.getByPlaceholder("Enter nominee phone number").fill("9876543210");
  await page.getByRole("button", { name: "Request OTP" }).click();

  await expect(page).toHaveURL(/\/verify/);
});
