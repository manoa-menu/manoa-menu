import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getTranslatedOpenStatus, isCurrentlyOpenStatus } from './openHoursStatus';

describe('isCurrentlyOpenStatus', () => {
  it('treats Open as open and Closed as closed', () => {
    assert.equal(isCurrentlyOpenStatus('Open'), true);
    assert.equal(isCurrentlyOpenStatus('Closed'), false);
  });

  it('does not treat upcoming or scheduled opening as currently open', () => {
    assert.equal(isCurrentlyOpenStatus('Opening soon'), false);
    assert.equal(isCurrentlyOpenStatus('Opens at 7:00 AM'), false);
  });

  it('treats closing-soon style text as not a live Open chip', () => {
    assert.equal(isCurrentlyOpenStatus('Closing soon'), false);
  });
});

describe('getTranslatedOpenStatus', () => {
  it('maps currently-open chips per language', () => {
    assert.equal(getTranslatedOpenStatus('Open', 'Japanese'), '営業中');
    assert.equal(getTranslatedOpenStatus('Opening soon', 'Japanese'), '営業終了');
    assert.equal(getTranslatedOpenStatus('Closed', 'Korean'), '영업 종료');
  });
});
