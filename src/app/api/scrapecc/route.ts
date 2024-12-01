import { NextRequest, NextResponse } from 'next/server';
import { JSDOM, VirtualConsole } from 'jsdom';
import fetch from 'node-fetch';

async function scrapeCCUrl(url: string): Promise<string> {
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
    return (anchor as HTMLAnchorElement).href;
  }

  throw new Error('Anchor element not found');
}

// eslint-disable-next-line import/prefer-default-export
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const result = await scrapeCCUrl(url);
    return NextResponse.json({ href: result });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
