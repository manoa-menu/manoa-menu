import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isSdxMenuBlank, parseSdxSpecialHours } from './sdxSpecialHours';

function wrapState(state: unknown): string {
  return `<html><body><script>window.__PRELOADED_STATE__ = ${JSON.stringify(state)};</script></body></html>`;
}

const sampleHtml = wrapState({
  composition: {
    subject: {
      regions: [{
        fragments: [{
          content: {
            main: {
              openingHours: {
                seasonalHours: [
                  {
                    from: '2026-05-16T06:00:00Z',
                    to: '2026-08-14T23:59:00Z',
                    openingHours: [{
                      days: [{ key: '1', value: 'Monday' }, { key: '0', value: 'Sunday' }],
                      hours: [{ allDay: false, label: 'Summer Break : ' }],
                    }],
                  },
                  {
                    from: '2026-08-17T06:00:00Z',
                    to: '2026-08-21T23:59:00Z',
                    openingHours: [{
                      days: [{ key: '1', value: 'Monday' }],
                      hours: [{
                        allDay: false,
                        startTime: { hour: '07', minute: '00', period: 'AM' },
                        finishTime: { hour: '08', minute: '30', period: 'AM' },
                        label: 'Breakfast',
                      }],
                    }],
                  },
                ],
              },
            },
          },
        }],
      }],
    },
  },
});

const timedHtml = wrapState({
  foo: {
    openingHours: {
      seasonalHours: [{
        from: '2026-05-26T06:00:00Z',
        to: '2026-08-14T23:59:00Z',
        openingHours: [
          {
            days: [{ value: 'Monday' }, { value: 'Friday' }],
            hours: [
              {
                label: 'Breakfast',
                startTime: { hour: '07', minute: '00', period: 'AM' },
                finishTime: { hour: '08', minute: '30', period: 'PM' },
              },
              {
                label: 'Lunch',
                startTime: { hour: '11', minute: '30', period: 'AM' },
                finishTime: { hour: '01', minute: '00', period: 'PM' },
              },
            ],
          },
          {
            days: [{ value: 'Saturday' }, { value: 'Sunday' }],
            hours: [{
              label: 'Brunch',
              startTime: { hour: '10', minute: '30', period: 'AM' },
              finishTime: { hour: '01', minute: '00', period: 'PM' },
            }],
          },
        ],
      }],
    },
  },
});

describe('parseSdxSpecialHours', () => {
  it('returns active summer closed hours', () => {
    const result = parseSdxSpecialHours(sampleHtml, new Date('2026-07-08T19:00:00Z'));
    assert.ok(result);
    assert.equal(result.dateRangeLabel, '05/16/2026 - 08/14/2026');
    assert.equal(result.blocks[0].daysLabel, 'Monday - Sunday');
    assert.equal(result.blocks[0].hours[0].label, 'Summer Break');
    assert.equal(result.blocks[0].hours[0].closed, true);
  });

  it('formats timed special-hour meals', () => {
    const result = parseSdxSpecialHours(timedHtml, new Date('2026-07-08T19:00:00Z'));
    assert.ok(result);
    assert.equal(result.blocks.length, 2);
    assert.equal(result.blocks[0].hours[0].timeRange, '07:00 AM - 08:30 PM');
    assert.equal(result.blocks[1].daysLabel, 'Saturday - Sunday');
  });

  it('returns null when no seasonal window matches today', () => {
    const result = parseSdxSpecialHours(sampleHtml, new Date('2026-09-01T19:00:00Z'));
    assert.equal(result, null);
  });
});

describe('isSdxMenuBlank', () => {
  it('detects empty week menus', () => {
    assert.equal(isSdxMenuBlank([]), true);
    assert.equal(isSdxMenuBlank([{ meals: [] }, { meals: [] }]), true);
    assert.equal(isSdxMenuBlank([{ meals: [{ name: 'Lunch', groups: [] }] }]), false);
  });
});
