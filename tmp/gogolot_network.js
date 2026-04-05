const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const outputDir = path.join(process.cwd(), 'tmp', 'gogolot-output');
fs.mkdirSync(outputDir, { recursive: true });

const events = [];

const normalizeText = (text) => String(text || '').replace(/\s+/g, ' ').trim();

function pushEvent(event) {
  events.push({
    at: new Date().toISOString(),
    ...event,
  });
}

async function login(page) {
  await page.goto('https://gogolot.com/#/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(3000);

  const inputs = page.locator('input');
  const inputCount = await inputs.count();
  let textInput = null;
  let passwordInput = null;
  for (let i = 0; i < inputCount; i += 1) {
    const input = inputs.nth(i);
    const type = await input.getAttribute('type');
    if (!passwordInput && type === 'password') {
      passwordInput = input;
      continue;
    }
    if (!textInput && (!type || ['text', 'tel', 'email'].includes(type))) {
      textInput = input;
    }
  }

  await textInput.fill('TESTER');
  await passwordInput.fill('bb123456');
  await passwordInput.press('Enter');
  await page.waitForTimeout(5000);
}

async function recordUiState(page, label) {
  const state = await page.evaluate(() => {
    const normalizeText = (text) => String(text || '').replace(/\s+/g, ' ').trim();
    return {
      url: location.href,
      title: document.title,
      texts: Array.from(document.querySelectorAll('body *'))
        .map((el) => normalizeText(el.textContent))
        .filter((text) => text && text.length > 0 && text.length < 180)
        .slice(0, 220),
      buttons: Array.from(document.querySelectorAll('button,[role="button"],.btn'))
        .map((el) => normalizeText(el.textContent))
        .filter(Boolean),
      inputs: Array.from(document.querySelectorAll('input,textarea,select'))
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute('type') || '',
          placeholder: el.getAttribute('placeholder') || '',
          value: el.value || '',
        })),
    };
  });

  pushEvent({
    type: 'ui-state',
    label,
    state,
  });
}

async function safeClick(locator) {
  if (await locator.count()) {
    await locator.first().click();
    return true;
  }
  return false;
}

async function main() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1400 },
  });
  const page = await context.newPage();

  page.on('request', async (request) => {
    const resourceType = request.resourceType();
    if (!['xhr', 'fetch', 'document'].includes(resourceType)) return;

    const url = request.url();
    if (!/gogolot\.com/i.test(url)) return;

    pushEvent({
      type: 'request',
      method: request.method(),
      resourceType,
      url,
      postData: request.postData() || '',
      headers: request.headers(),
    });
  });

  page.on('response', async (response) => {
    const request = response.request();
    const resourceType = request.resourceType();
    if (!['xhr', 'fetch', 'document'].includes(resourceType)) return;

    const url = response.url();
    if (!/gogolot\.com/i.test(url)) return;

    const headers = response.headers();
    const contentType = headers['content-type'] || '';
    let body = '';
    if (/json|text|javascript|html/i.test(contentType)) {
      try {
        body = await response.text();
      } catch (error) {
        body = `[[unreadable: ${error.message}]]`;
      }
    }

    pushEvent({
      type: 'response',
      status: response.status(),
      resourceType,
      url,
      contentType,
      body: body.slice(0, 5000),
    });
  });

  await login(page);
  await page.goto('https://gogolot.com/#/mem/betting/szbet', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(5000);
  await recordUiState(page, 'initial-szbet');

  const dropdowns = page.locator('.dropdown-toggle');
  const dropdownCount = await dropdowns.count();
  pushEvent({ type: 'meta', label: 'dropdown-count', value: dropdownCount });

  if (dropdownCount >= 2) {
    await dropdowns.nth(1).click();
    await page.waitForTimeout(800);
    const menuItems = page.locator('.dropdown-menu .dropdown-item, .dropdown-menu li, .dropdown-menu a, .dropdown-menu button');
    const itemCount = await menuItems.count();
    pushEvent({ type: 'meta', label: 'lottery-type-menu-count', value: itemCount });
    if (itemCount >= 2) {
      const secondItemText = normalizeText(await menuItems.nth(1).textContent());
      pushEvent({ type: 'meta', label: 'lottery-type-selected', value: secondItemText });
      await menuItems.nth(1).click();
      await page.waitForTimeout(3000);
      await recordUiState(page, 'after-lottery-type-change');
    } else {
      await dropdowns.nth(1).click();
      await page.waitForTimeout(300);
    }
  }

  const quickTab = page.locator('text=แทงเร็ว').first();
  const gridTab = page.locator('text=2ตัว / 3ตัว').first();

  if (await safeClick(gridTab)) {
    await page.waitForTimeout(2000);
    await recordUiState(page, 'grid-mode');
  }

  if (await safeClick(quickTab)) {
    await page.waitForTimeout(2000);
    await recordUiState(page, 'quick-mode');
  }

  const visibleInputs = page.locator('input[type="text"], input:not([type]), textarea');
  const visibleInputCount = await visibleInputs.count();
  pushEvent({ type: 'meta', label: 'visible-input-count', value: visibleInputCount });
  if (visibleInputCount >= 1) {
    await visibleInputs.first().fill('12');
    await page.waitForTimeout(1000);
    await recordUiState(page, 'after-input-12');
  }

  fs.writeFileSync(path.join(outputDir, 'gogolot-network.json'), JSON.stringify(events, null, 2), 'utf8');
  await page.screenshot({ path: path.join(outputDir, 'gogolot-network-final.png'), fullPage: true });
  console.log(JSON.stringify({ eventCount: events.length, outputDir }, null, 2));

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
