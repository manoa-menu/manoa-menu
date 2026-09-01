import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseCcMenuJson, unwrapJsonText } from './ccMenuResponse';

const validMenu = {
  weekOne: [{
    name: 'Monday',
    plateLunch: ['Kalua Pork'],
    grabAndGo: ['Chicken Wrap'],
    specialMessage: '',
  }],
  weekTwo: [],
};

describe('unwrapJsonText', () => {
  it('strips markdown json fences', () => {
    assert.equal(unwrapJsonText('```json\n{"a":1}\n```'), '{"a":1}');
  });
});

describe('parseCcMenuJson', () => {
  it('accepts a valid menu object', () => {
    assert.deepEqual(parseCcMenuJson(JSON.stringify(validMenu)), validMenu);
  });

  it('accepts fenced JSON', () => {
    const parsed = parseCcMenuJson(`\`\`\`json\n${JSON.stringify(validMenu)}\n\`\`\``);
    assert.equal(parsed.weekOne[0]?.name, 'Monday');
  });

  it('rejects JSON that is not a menu', () => {
    assert.throws(() => parseCcMenuJson('{"weekOne":[]}'), /did not match/);
  });
});
