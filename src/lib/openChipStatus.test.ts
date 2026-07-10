import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseOpenChipStatus } from './openChipStatus';

const currentClosedHtml = `
<body>
  <div class="open-chip-time">
    <div class="chip-block">
      <div class="OpenChipstyles__Wrapper-sc-1vubns5-0 XyKiu">
        <div class="container closed">
          <div class="dot null"></div>
          <div class="text">Closed</div>
        </div>
      </div>
    </div>
  </div>
</body>
`;

const currentOpenHtml = `
<body>
  <div class="OpenChipstyles__Wrapper-sc-1vubns5-0 XyKiu">
    <div class="container open">
      <div class="dot null"></div>
      <div class="text">Open</div>
    </div>
  </div>
</body>
`;

const legacyAriaLabelHtml = `
<body>
  <div class="OpenChipstyles__Wrapper-sc-1vubns5-0 XyKiu">
    <div class="container" aria-label="open">
      <div class="dot"></div>
    </div>
  </div>
</body>
`;

const classOnlyClosedHtml = `
<body>
  <div class="OpenChipstyles__Wrapper-sc-1vubns5-0 XyKiu">
    <div class="container closed">
      <div class="dot null"></div>
    </div>
  </div>
</body>
`;

describe('parseOpenChipStatus', () => {
  it('parses Closed from current Sodexo OpenChip markup', () => {
    assert.equal(parseOpenChipStatus(currentClosedHtml), 'Closed');
  });

  it('parses Open from current Sodexo OpenChip markup', () => {
    assert.equal(parseOpenChipStatus(currentOpenHtml), 'Open');
  });

  it('falls back to aria-label when text is missing', () => {
    assert.equal(parseOpenChipStatus(legacyAriaLabelHtml), 'Open');
  });

  it('falls back to container class when text and aria-label are missing', () => {
    assert.equal(parseOpenChipStatus(classOnlyClosedHtml), 'Closed');
  });

  it('returns null when the OpenChip wrapper is missing', () => {
    assert.equal(parseOpenChipStatus('<body><div>No chip here</div></body>'), null);
  });

  it('normalizes mixed-case chip text', () => {
    const html = `
      <div class="OpenChipstyles__Wrapper">
        <div class="container">
          <div class="text">cLoSeD</div>
        </div>
      </div>
    `;
    assert.equal(parseOpenChipStatus(html), 'Closed');
  });
});
