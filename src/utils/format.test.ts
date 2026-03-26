import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { formatNumber } from './format.ts';

describe('formatNumber', () => {
  it('formats positive integers with commas', () => {
    assert.strictEqual(formatNumber(1000), '1,000');
    assert.strictEqual(formatNumber(1000000), '1,000,000');
    assert.strictEqual(formatNumber(1234567890), '1,234,567,890');
  });

  it('formats negative integers with commas', () => {
    assert.strictEqual(formatNumber(-1000), '-1,000');
    assert.strictEqual(formatNumber(-1000000), '-1,000,000');
    assert.strictEqual(formatNumber(-1234567890), '-1,234,567,890');
  });

  it('formats numbers less than 1000 without commas', () => {
    assert.strictEqual(formatNumber(0), '0');
    assert.strictEqual(formatNumber(999), '999');
    assert.strictEqual(formatNumber(-999), '-999');
  });

  it('formats floating point numbers correctly', () => {
    assert.strictEqual(formatNumber(1234.56), '1,234.56');
    assert.strictEqual(formatNumber(-1234.56), '-1,234.56');
    assert.strictEqual(formatNumber(0.123), '0.123');
  });

  it('handles extremely large numbers correctly', () => {
    // Note: Numbers larger than Number.MAX_SAFE_INTEGER may lose precision,
    // but the formatter should still handle them based on their IEEE 754 value.
    assert.strictEqual(formatNumber(1e12), '1,000,000,000,000');
    assert.strictEqual(formatNumber(1e15), '1,000,000,000,000,000');
  });
});
