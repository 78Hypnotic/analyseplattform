import { expect, test } from "@playwright/test";

test.describe("Rad-Diagnostik Dominanzmodell", () => {
  test("berechnet und zeigt die glykolytische Dominanz im Report", async ({ page }, testInfo) => {
    await page.goto("/e2e-report-preview?discipline=bike");

    await expect(page.getByRole("heading", { name: /Deine Schwelle \(FTP\): 305 W/ })).toBeVisible();
    await page.getByText("Expertenmodus / Details", { exact: true }).click();
    await expect(page.getByText("Dominanz D")).toBeVisible();
    await expect(page.getByText("1.769")).toBeVisible();
    await expect(page.getByText("Alte Modellversion")).toHaveCount(0);

    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("bike-dominance-report.png"),
    });
  });
});
