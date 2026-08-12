import { chromium } from "../../../node_modules/playwright/index.mjs";
import assert from "node:assert/strict";

const browser = await chromium.launch({ headless: true });
const sizes = [[1440,900],[1024,768],[390,844],[360,800]];
const errors = [];

for (const [width,height] of sizes) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: width < 500 ? 2 : 1 });
  page.on("console", message => { if (message.type() === "error") errors.push(`${width}x${height}: ${message.text()}`); });
  page.on("pageerror", error => errors.push(`${width}x${height}: ${error.message}`));
  await page.goto("http://127.0.0.1:4173/sandbox-reflexion/", { waitUntil: "networkidle" });
  await page.locator("#scene canvas").waitFor();
  assert.equal(await page.locator(".wordmark").getAttribute("href"), "../");
  assert.equal(await page.locator("#medium-1").inputValue(), "water");
  assert.equal(await page.locator("#medium-2").inputValue(), "air");
  assert.equal(await page.locator("#animate").getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator("body").evaluate(el => el.scrollWidth <= innerWidth), true, `${width}x${height} desborda horizontalmente`);
  await page.getByRole("button", { name: "3D", exact: true }).click();
  assert.equal(await page.locator("#annotations").isVisible(), false, "Las anotaciones 2D deben ocultarse en 3D");
  assert.equal(await page.getByRole("button", { name: "3D", exact: true }).getAttribute("aria-pressed"), "true");
  await page.getByRole("button", { name: "Agua → aire" }).click();
  await page.locator("#angle-number").fill("60");
  await page.locator("#angle-number").press("Enter");
  assert.equal(await page.locator("#animate").getAttribute("aria-pressed"), "false");
  assert.equal(await page.locator("#status-text").textContent(), "Reflexión total interna");
  assert.equal(await page.locator("#metric-2").textContent(), "Sin solución");
  await page.locator("#scene").focus();
  await page.keyboard.press("ArrowLeft");
  assert.equal(await page.locator("#angle-number").inputValue(), "59.0");
  await page.screenshot({ path: `../screenshots/${width}x${height}.png`, fullPage: true });
  await page.close();
}

await browser.close();
assert.deepEqual(errors, []);
console.log("Browser checks passed:", sizes.map(size => size.join("x")).join(", "));
