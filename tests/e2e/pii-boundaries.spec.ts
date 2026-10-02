import { test, expect } from "@playwright/test";

const forbiddenStorageKeys = /(?:auth-token|auth-store|user-store|verify-token|p2p-|password|otp|access.?token|refresh.?token)/i;
const forbiddenUrlParts = /(?:auth-token|access[_-]?token|refresh[_-]?token|password|otp|email|phone|kyc)/i;

test.describe("PII browser boundaries", () => {
  test("does not seed credentials or identity state in browser storage", async ({ page }) => {
    await page.goto("/auth/login");
    const keys = await page.evaluate(() => [
      ...Object.keys(localStorage),
      ...Object.keys(sessionStorage),
    ]);
    expect(keys.filter((key) => forbiddenStorageKeys.test(key))).toEqual([]);
  });

  test("does not expose prohibited credential or identity values in the initial URL", async ({ page }) => {
    await page.goto("/auth/login");
    expect(new URL(page.url()).search).not.toMatch(forbiddenUrlParts);
    expect(new URL(page.url()).hash).not.toMatch(forbiddenUrlParts);
  });

  test("preserves only non-sensitive navigation state", async ({ page }) => {
    await page.goto("/auth/login");
    await page.evaluate(() => {
      history.replaceState({}, "", "/auth/login?pair=BTC_USDT");
    });
    const url = new URL(page.url());
    expect(url.searchParams.get("pair")).toBe("BTC_USDT");
    expect(url.search).not.toMatch(forbiddenUrlParts);
  });
});
