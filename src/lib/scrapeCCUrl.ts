import { JSDOM, VirtualConsole } from 'jsdom';

export default async function scrapeCCUrl(url: string): Promise<string> {
  // Fetch the most current data, bypassing caches
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate', // Forces a fresh response
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch the URL: ${response.statusText}`);
  }

  const html = await response.text();

  // Set up a VirtualConsole to handle and suppress specific errors
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', (error) => {
    if (error.message.includes('Could not parse CSS stylesheet')) {
      console.warn('Ignoring CSS parsing error:', error.message);
    } else {
      console.error(error);
    }
  });

  // Create the JSDOM instance
  const dom = new JSDOM(html, {
    resources: 'usable', // Loads resources like images or scripts
    runScripts: 'dangerously', // Executes inline scripts
    virtualConsole,
  });

  // Extract the desired <a> tag inside the specific <div>
  const doc = dom.window.document;
  const div = doc.querySelector('div.MenuAppstyles__MenuLinkContainer-sc-hftaq1-1');
  const anchor = div?.querySelector('a');

  if (anchor) {
    return (anchor as HTMLAnchorElement).href;
  }

  throw new Error('Anchor element not found');
}
