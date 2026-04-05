const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const outputDir = path.join(process.cwd(), 'tmp', 'gogolot-output');
fs.mkdirSync(outputDir, { recursive: true });

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
  await page.waitForTimeout(4000);
}

async function extractMenu(page, index) {
  const toggles = page.locator('.dropdown-toggle');
  const target = toggles.nth(index);
  await target.click();
  await page.waitForTimeout(800);
  const items = await page.evaluate(() => {
    const visible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };
    return Array.from(document.querySelectorAll('.dropdown-menu .dropdown-item, .dropdown-menu button, .dropdown-menu a, .dropdown-menu li'))
      .filter((element) => visible(element))
      .map((element) => (element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  });
  await target.click();
  await page.waitForTimeout(300);
  return items;
}

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1400 } });
  const page = await context.newPage();

  await login(page);
  await page.goto('https://gogolot.com/#/mem/betting/szbet', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(5000);

  const summary = await page.evaluate(() => {
    const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();
    return {
      statusText: normalize(document.body.innerText.match(/เปิดรับ|ปิดรับ|กำลังจะเปิด/)?.[0] || ''),
      quickTabText: Array.from(document.querySelectorAll('.nav-tabs .nav-link, .nav .nav-link'))
        .map((el) => normalize(el.textContent))
        .filter(Boolean),
      labels: Array.from(document.querySelectorAll('label, th, td, .badge, .btn, .card-header, .table th, .table td'))
        .map((el) => normalize(el.textContent))
        .filter(Boolean)
        .slice(0, 120),
    };
  });

  const rateMenu = await extractMenu(page, 0);
  const lotteryTypeMenu = await extractMenu(page, 1);
  const roundMenu = await extractMenu(page, 2);

  const twoThreeTab = page.locator('text=2ตัว / 3ตัว').first();
  if (await twoThreeTab.count()) {
    await twoThreeTab.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outputDir, 'betting-2d3d.png'), fullPage: true });
  }

  const twoThreeMode = await page.evaluate(() => {
    const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();
    return Array.from(document.querySelectorAll('body *'))
      .map((el) => normalize(el.textContent))
      .filter((text) => text && text.length > 0 && text.length < 160)
      .slice(0, 200);
  });

  const fullText = await page.evaluate(() => document.body.innerText);

  fs.writeFileSync(path.join(outputDir, 'betting-detail.json'), JSON.stringify({
    summary,
    rateMenu,
    lotteryTypeMenu,
    roundMenu,
    twoThreeMode,
    fullText,
  }, null, 2), 'utf8');

  console.log(JSON.stringify({
    rateMenuCount: rateMenu.length,
    lotteryTypeMenuCount: lotteryTypeMenu.length,
    roundMenuCount: roundMenu.length,
    quickTabText: summary.quickTabText,
    statusText: summary.statusText,
  }, null, 2));

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
