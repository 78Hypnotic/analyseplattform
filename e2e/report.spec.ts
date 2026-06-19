import { expect, test } from "@playwright/test";

test.describe("Schwimmdiagnostik Report", () => {
  test("zeigt den Coaching-Report statt technischer Hauptdiagnostik", async ({ page }, testInfo) => {
    await page.goto("/e2e-report-preview");

    await expect(page.getByRole("heading", { name: /Deine CSS beträgt/i })).toBeVisible();
    await expect(page.getByText("Das ist aktuell deine Schwellenpace im Schwimmen.")).toBeVisible();
    await expect(page.getByText("Physiologisches Profil")).toBeVisible();
    await expect(page.getByText("Aerobe Kapazität", { exact: true })).toBeVisible();
    await expect(page.getByText("Anaerobe Kapazität", { exact: true })).toBeVisible();
    await expect(page.getByText("Schwimm-Mechanik", { exact: true })).toBeVisible();
    await expect(page.getByText("Dein aktuelles Schwimmmuster", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Trainingshebel", { exact: true })).toHaveCount(0);
    await expect(page.locator("section").filter({ hasText: /^ReTest/ }).first()).toBeVisible();

    const expertDetails = page.locator("details").filter({ hasText: "Expertenmodus / Details" });
    await expect(expertDetails).not.toHaveAttribute("open", "");
    await expect(page.getByText("Radar")).toHaveCount(0);
    await expect(page.getByText("VO2-Proxy")).toHaveCount(0);
    await expect(page.getByText("VLa-Proxy")).toHaveCount(0);
    await expect(page.getByText("Sprint-Reserve")).toHaveCount(0);

    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("standard-report.png"),
    });
  });

  test("zeigt Technique-only Reports ohne CSS-Hero", async ({ page }, testInfo) => {
    await page.goto("/e2e-report-preview?mode=technique");

    await expect(page.getByRole("heading", { name: "Erst Technik stabilisieren, dann physiologisch auswerten." })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Deine CSS beträgt/i })).toHaveCount(0);
    await expect(page.getByText("Schwimm-Mechanik", { exact: true })).toBeVisible();
    await expect(page.getByText("Dein aktuelles Schwimmmuster", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Trainingshebel", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Expertenmodus / Details", { exact: true })).toBeVisible();

    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("technique-report.png"),
    });
  });
});
