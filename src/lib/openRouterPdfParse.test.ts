import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildOpenRouterPdfParseBody,
  pdfBytesToDataUrl,
  pdfFilenameFromUrl,
} from './openRouterPdfParse';

const schema = {
  name: 'day_menu_array',
  strict: true,
  schema: { type: 'object' },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

describe('pdfFilenameFromUrl', () => {
  it('decodes the Sodexo PDF basename', () => {
    assert.equal(
      pdfFilenameFromUrl(
        'https://media-prd.sodexomyway.net/web/en-us/media/26-0831%20printed%20menu%20a_tcm17-94179.pdf',
      ),
      '26-0831 printed menu a_tcm17-94179.pdf',
    );
  });
});

describe('buildOpenRouterPdfParseBody', () => {
  it('sends a file part with file_data, not OpenAI file_url', () => {
    const body = buildOpenRouterPdfParseBody({
      model: 'google/gemini-3.7-flash',
      reasoningEffort: 'medium',
      prompt: 'Parse the menu.',
      userText: 'Parse this PDF.',
      fileData: 'data:application/pdf;base64,abc',
      filename: 'menu.pdf',
      jsonSchema: schema,
      maxTokens: 12000,
    });
    const bodyJson = JSON.stringify(body);
    assert.equal(bodyJson.includes('"file_url"'), false);
    assert.equal(bodyJson.includes('"input_file"'), false);

    assert.ok(Array.isArray(body.messages));
    const user = body.messages[1];
    assert.ok(isRecord(user) && Array.isArray(user.content));
    const filePart = user.content.find((part) => isRecord(part) && part.type === 'file');
    assert.ok(isRecord(filePart) && isRecord(filePart.file));
    assert.equal(filePart.file.filename, 'menu.pdf');
    assert.equal(filePart.file.file_data, 'data:application/pdf;base64,abc');
  });
});

describe('pdfBytesToDataUrl', () => {
  it('prefixes base64 PDF bytes', () => {
    assert.equal(
      pdfBytesToDataUrl(Uint8Array.from([1, 2, 3])),
      `data:application/pdf;base64,${Buffer.from([1, 2, 3]).toString('base64')}`,
    );
  });
});
