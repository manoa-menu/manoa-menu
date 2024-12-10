import { JSDOM, VirtualConsole } from 'jsdom';
import fetch from 'node-fetch';

export default async function scrapeCCUrl(url: string): Promise<string> {
  if (typeof window !== 'undefined') {
    throw new Error('scrapeCCUrl can only be run in a Node.js environment');
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch the URL: ${response.statusText}`);
  }

  const html = await response.text();

  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', (error) => {
    if (error.message.includes('Could not parse CSS stylesheet')) {
      console.warn('Ignoring CSS parsing error:', error.message);
    } else {
      console.error(error);
    }
  });

  const dom = new JSDOM(html, {
    resources: 'usable',
    runScripts: 'dangerously',
    virtualConsole,
  });

  const doc = dom.window.document;
  const div = doc.querySelector('div.MenuAppstyles__MenuLinkContainer-sc-hftaq1-1');
  const anchor = div?.querySelector('a');

  if (anchor) {
    console.log(`Found anchor element: ${anchor.href}`);
    return (anchor as HTMLAnchorElement).href;
  }

  throw new Error('Anchor element not found');
}
