import { chromium } from '../../../node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true}),sizes=[[1440,900],[1024,768],[390,844],[360,800]],errors=[];
for(const [width,height] of sizes){const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:width<500?2:1,isMobile:width<500,hasTouch:width<500});page.on('pageerror',e=>errors.push(`${width}x${height}: ${e.message}`));page.on('console',m=>m.type()==='error'&&errors.push(`${width}x${height}: ${m.text()}`));await page.goto('http://127.0.0.1:4173/sandbox-lentes/',{waitUntil:'networkidle'});await page.locator('#three-scene canvas').waitFor({state:'attached'});assert.equal(await page.locator('body').evaluate(e=>e.scrollWidth<=innerWidth),true,`${width}x${height} overflow`);
  await page.locator('[data-preset="at2f"]').click();assert.equal(await page.locator('#metric-di').textContent(),'+40,0 cm');assert.match(await page.locator('#status-text').textContent(),/real, invertida y igual/);
  await page.locator('[data-preset="atf"]').click();assert.equal(await page.locator('#metric-di').textContent(),'∞');
  await page.locator('[data-lens="diverging"]').click();assert.match(await page.locator('#status-text').textContent(),/virtual, derecha y menor/);
  assert.ok(await page.locator('#diagram .virtual-extension').count()>0);
  await page.locator('#step-mode').click();assert.equal(await page.locator('#steps').isVisible(),true);assert.equal(await page.locator('#step-count').textContent(),'1 / 9');await page.locator('#step-skip').click();assert.equal(await page.locator('#step-count').textContent(),'9 / 9');
  await page.getByRole('button',{name:'3D',exact:true}).click();assert.equal(await page.locator('#scene-shell').evaluate(e=>e.classList.contains('view-3d')),true);
  await page.locator('#profile').selectOption('plano');assert.equal(await page.locator('#profile').inputValue(),'plano');
  await page.screenshot({path:`../screenshots/lentes-${width}x${height}.png`,fullPage:true});await page.close();}
await browser.close();assert.deepEqual(errors,[]);console.log('Lens browser checks passed:',sizes.map(x=>x.join('x')).join(', '));
