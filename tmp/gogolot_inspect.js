const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const outputDir = path.join(process.cwd(), 'tmp', 'gogolot-output');
fs.mkdirSync(outputDir, { recursive: true });

const username = 'TESTER';
const password = 'bb123456';

async function main() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1400 },
  });
  const page = await context.newPage();

  await page.goto('https://gogolot.com/#/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(3000);

  const inputs = page.locator('input');
  const inputCount = await inputs.count();
  if (inputCount < 2) {
    throw new Error(`Expected login inputs, found ${inputCount}`);
  }

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

  if (!textInput || !passwordInput) {
    throw new Error('Could not locate username/password inputs');
  }

  await textInput.fill(username);
  await passwordInput.fill(password);

  const loginButton = page.locator('button, [role="button"]').filter({ hasText: /เข้าสู่ระบบ|login|sign in/i }).first();
  if (await loginButton.count()) {
    await loginButton.click();
  } else {
    await passwordInput.press('Enter');
  }

  await page.waitForTimeout(4000);
  await page.goto('https://gogolot.com/#/mem/betting/szbet', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(5000);

  await page.screenshot({ path: path.join(outputDir, 'betting-page.png'), fullPage: true });
  fs.writeFileSync(path.join(outputDir, 'betting-page.html'), await page.content(), 'utf8');

  const data = await page.evaluate(() => {
    const visible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };

    const textBlocks = Array.from(document.querySelectorAll('body *'))
      .filter((element) => visible(element))
      .map((element) => (element.innerText || '').trim())
      .filter((text) => text && text.length > 0 && text.length < 200)
      .slice(0, 300);

    const uniqueTexts = [...new Set(textBlocks)];

    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
      .filter((element) => visible(element))
      .map((element) => ({
        text: (element.innerText || '').trim(),
        className: element.className,
      }))
      .filter((item) => item.text);

    const inputs = Array.from(document.querySelectorAll('input, textarea, select'))
      .filter((element) => visible(element))
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute('type') || '',
        placeholder: element.getAttribute('placeholder') || '',
        value: element.tagName === 'SELECT'
          ? Array.from(element.options).map((option) => option.textContent.trim()).slice(0, 20)
          : (element.value || ''),
        className: element.className,
      }));

    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, .title, .header, .panel-heading'))
      .filter((element) => visible(element))
      .map((element) => (element.innerText || '').trim())
      .filter(Boolean);

    const links = Array.from(document.querySelectorAll('a'))
      .filter((element) => visible(element))
      .map((element) => ({
        text: (element.innerText || '').trim(),
        href: element.getAttribute('href') || '',
      }))
      .filter((item) => item.text);

    return {
      url: location.href,
      title: document.title,
      headings,
      buttons,
      inputs,
      links,
      uniqueTexts,
    };
  });

  fs.writeFileSync(path.join(outputDir, 'betting-page.json'), JSON.stringify(data, null, 2), 'utf8');
  console.log(JSON.stringify({
    outputDir,
    url: data.url,
    title: data.title,
    headingCount: data.headings.length,
    buttonCount: data.buttons.length,
    inputCount: data.inputs.length,
  }, null, 2));

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
