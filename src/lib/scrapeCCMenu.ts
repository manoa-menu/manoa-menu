import { JSDOM } from 'jsdom';

export default async function getCCMenu(url: string): Promise<string> {
  const response = await fetch(url);
  const html = await response.text();
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const div = doc.querySelector('div.MenuAppstyles__MenuLinkContainer-sc-hftaq1-1');
  const anchor = div?.querySelector('a');

  if (anchor) {
    return (anchor as HTMLAnchorElement).href;
  }
  throw new Error('Anchor tag not found');
}
