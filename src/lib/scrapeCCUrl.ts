import { JSDOM } from 'jsdom';

export default async function scrapeCCUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html, {
      resources: 'usable',
      runScripts: 'dangerously',
    });
    const doc = dom.window.document;
    const div = doc.querySelector('div.MenuAppstyles__MenuLinkContainer-sc-hftaq1-1');
    const anchor = div?.querySelector('a');

    if (anchor) {
      return (anchor as HTMLAnchorElement).href;
    }
    throw new Error('Anchor element not found');
  } catch (error) {
    console.warn('Error parsing CSS stylesheet:', error);
    throw error;
  }
}
