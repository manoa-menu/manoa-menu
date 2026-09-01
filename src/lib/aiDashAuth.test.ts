import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isAiDashAuthorized } from './aiDashAuth';

function withAiDash<T>(value: string | undefined, fn: () => T): T {
  const previous = process.env.AI_DASH;
  if (value === undefined) {
    delete process.env.AI_DASH;
  } else {
    process.env.AI_DASH = value;
  }
  try {
    return fn();
  } finally {
    if (previous === undefined) {
      delete process.env.AI_DASH;
    } else {
      process.env.AI_DASH = previous;
    }
  }
}

describe('isAiDashAuthorized', { concurrency: false }, () => {
  it('rejects missing env or missing key', () => {
    withAiDash(undefined, () => {
      assert.equal(isAiDashAuthorized('secret'), false);
    });
    withAiDash('secret', () => {
      assert.equal(isAiDashAuthorized(undefined), false);
      assert.equal(isAiDashAuthorized(''), false);
    });
  });

  it('accepts an exact match and rejects a mismatch', () => {
    withAiDash('dash-secret', () => {
      assert.equal(isAiDashAuthorized('dash-secret'), true);
      assert.equal(isAiDashAuthorized('other'), false);
    });
  });
});
