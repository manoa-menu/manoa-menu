import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  allowMenuRequest,
  resetMenuRateLimit,
} from './menuRateLimit';

describe('allowMenuRequest', () => {
  it('allows up to the max then rejects until the window resets', () => {
    resetMenuRateLimit();
    const now = 1_000_000;
    for (let i = 0; i < 3; i += 1) {
      assert.equal(allowMenuRequest('ip-1', now, 3, 60_000), true);
    }
    assert.equal(allowMenuRequest('ip-1', now + 10, 3, 60_000), false);
    assert.equal(allowMenuRequest('ip-1', now + 60_000, 3, 60_000), true);
  });

  it('tracks keys independently', () => {
    resetMenuRateLimit();
    assert.equal(allowMenuRequest('a', 0, 1, 60_000), true);
    assert.equal(allowMenuRequest('a', 0, 1, 60_000), false);
    assert.equal(allowMenuRequest('b', 0, 1, 60_000), true);
  });
});
