import puppeteer from 'puppeteer-core';
import { executablePath } from 'puppeteer';

export default async function scrapeCCUrl(url: string): Promise<string> {
  const browser = await puppeteer.launch({
    executablePath: executablePath(), // Use the path to your custom Chromium binary
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const href = await page.evaluate(() => {
    const div = document.querySelector('div.MenuAppstyles__MenuLinkContainer-sc-hftaq1-1');
    const anchor = div?.querySelector('a');
    return anchor ? (anchor as HTMLAnchorElement).href : null;
  });

  await browser.close();

  if (href) {
    return href;
  }
  throw new Error('No href found');
}
