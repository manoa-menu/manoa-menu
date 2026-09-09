import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PdfDomMatrix, installPdfJsDomPolyfills } from './pdfJsDomPolyfill';

describe('PdfDomMatrix', () => {
  it('translates a point with a 6-number constructor', () => {
    const matrix = new PdfDomMatrix([1, 0, 0, 1, 10, 20]);
    const point = matrix.transformPoint({ x: 3, y: 4 });
    assert.equal(point.x, 13);
    assert.equal(point.y, 24);
  });

  it('multiplies a translate by a scale', () => {
    const scaled = new PdfDomMatrix([2, 0, 0, 2, 0, 0])
      .multiply(new PdfDomMatrix([1, 0, 0, 1, 5, 7]));
    const point = scaled.transformPoint({ x: 1, y: 1 });
    assert.equal(point.x, 12);
    assert.equal(point.y, 16);
  });
});

describe('installPdfJsDomPolyfills', () => {
  it('defines DOMMatrix on globalThis in Node', () => {
    installPdfJsDomPolyfills();
    assert.equal(typeof globalThis.DOMMatrix, 'function');
    const matrix = new globalThis.DOMMatrix([1, 0, 0, 1, 8, 9]);
    const point = matrix.transformPoint({ x: 0, y: 0 });
    assert.equal(point.x, 8);
    assert.equal(point.y, 9);
  });
});
