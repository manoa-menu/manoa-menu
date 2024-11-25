import { JSDOM, VirtualConsole } from 'jsdom';

export default async function scrapeCCUrl(url: string): Promise<string> {
  const response = await fetch(url);
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
    return (anchor as HTMLAnchorElement).href;
  }
  throw new Error('Anchor element not found');
}
