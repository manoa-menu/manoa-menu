import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  defaultReviewerLanguage,
  getConfiguredReviewers,
  getReviewerByToken,
  reviewerCanAccessLanguage,
  toPublicReviewer,
} from './translationReviewers';

const env = {
  TRANSLATION_REVIEW_JUSTIN: 'justin-token-aaa',
  TRANSLATION_REVIEW_YOUJIN: 'youjin-token-bbb',
  TRANSLATION_REVIEW_MATTHEW: 'matthew-token-ccc',
  TRANSLATION_REVIEW_MAX: 'max-token-ddd',
};

describe('translation reviewers', () => {
  it('loads only reviewers with tokens configured', () => {
    const reviewers = getConfiguredReviewers({
      TRANSLATION_REVIEW_YOUJIN: 'youjin-token-bbb',
    });
    assert.deepEqual(reviewers.map((reviewer) => reviewer.name), ['Youjin']);
  });

  it('resolves a reviewer from their invite token', () => {
    const reviewer = getReviewerByToken('matthew-token-ccc', env);
    assert.equal(reviewer?.name, 'Matthew');
    assert.deepEqual(reviewer?.languages, ['Korean']);
  });

  it('rejects unknown tokens', () => {
    assert.equal(getReviewerByToken('nope', env), null);
    assert.equal(getReviewerByToken('', env), null);
  });

  it('scopes languages per person', () => {
    const justin = toPublicReviewer(getReviewerByToken('justin-token-aaa', env)!);
    const max = toPublicReviewer(getReviewerByToken('max-token-ddd', env)!);

    assert.equal(reviewerCanAccessLanguage(justin, 'Japanese'), true);
    assert.equal(reviewerCanAccessLanguage(justin, 'Chinese'), true);
    assert.equal(reviewerCanAccessLanguage(max, 'Chinese'), true);
    assert.equal(reviewerCanAccessLanguage(max, 'Korean'), false);
    assert.equal(defaultReviewerLanguage(max), 'Chinese');
  });
});
