import { JSDOM, VirtualConsole } from 'jsdom';

/**
 * Parse Sodexo OpenChip open/closed status from page HTML.
 * Current markup uses `.text` inside `.OpenChipstyles__Wrapper`;
 * older markup used `aria-label` on `div.container`.
 */
export function parseOpenChipStatus(html: string): string | null {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', () => {});

  const dom = new JSDOM(html, { virtualConsole });
  const doc = dom.window.document;

  const allDivs = doc.querySelectorAll('div[class]');
  let statusWrapper: Element | null = null;

  for (let i = 0; i < allDivs.length; i++) {
    const div = allDivs[i];
    if (div.className && String(div.className).includes('OpenChipstyles__Wrapper')) {
      statusWrapper = div;
      break;
    }
  }

  if (!statusWrapper) {
    return null;
  }

  const containerDiv = statusWrapper.querySelector('div.container');
  if (!containerDiv) {
    return null;
  }

  const textEl = containerDiv.querySelector('.text');
  const textStatus = textEl?.textContent?.trim();
  const ariaStatus = containerDiv.getAttribute('aria-label')?.trim();
  const className = String(containerDiv.className || '').toLowerCase();
  const classStatus = className.includes('closed')
    ? 'Closed'
    : className.includes('open')
      ? 'Open'
      : null;

  const rawStatus = textStatus || ariaStatus || classStatus;
  if (!rawStatus) {
    return null;
  }

  return rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
}
