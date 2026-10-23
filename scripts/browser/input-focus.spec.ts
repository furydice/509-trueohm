import { expect, test } from "@playwright/test";

test("focused calculator fields keep readable type and labels inside the viewport", async ({ page }) => {
  await page.goto("/");
  const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
  expect(viewport).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\D|$)/i);

  for (const mode of ["Ohm's Law", "AC Power", "Power Triangle", "Energy Cost", "Efficiency"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    for (const rootSize of [16, 24]) {
      await page.evaluate((size) => { document.documentElement.style.fontSize = `${size}px`; }, rootSize);
      const inputs = page.locator(".vd-num-input");
      for (const input of await inputs.all()) {
        await input.click();
        const layout = await input.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const label = element.closest(".vd-input-row")?.querySelector("label")?.getBoundingClientRect();
          return {
            font: parseFloat(getComputedStyle(element).fontSize),
            left: rect.left, right: rect.right,
            labelLeft: label?.left ?? -1, labelRight: label?.right ?? Infinity,
            viewportWidth: document.documentElement.clientWidth,
          };
        });
        expect(layout.font, `${mode}, root ${rootSize}: input font`).toBeGreaterThanOrEqual(rootSize);
        expect(layout.left).toBeGreaterThanOrEqual(0);
        expect(layout.right).toBeLessThanOrEqual(layout.viewportWidth);
        expect(layout.labelLeft).toBeGreaterThanOrEqual(0);
        expect(layout.labelRight).toBeLessThanOrEqual(layout.left);
      }
    }
  }
});
