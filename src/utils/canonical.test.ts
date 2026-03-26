import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildCanonicalUrl, CANONICAL_HOSTNAME, CANONICAL_HASH } from './canonical.ts';

describe('buildCanonicalUrl', () => {
  it('should construct URL with default values when location properties are empty', () => {
    const location = { pathname: '', search: '', hash: '' };
    const url = buildCanonicalUrl(location);
    assert.strictEqual(url, `https://${CANONICAL_HOSTNAME}/${CANONICAL_HASH}`);
  });

  it('should use provided pathname and fallback for others', () => {
    const location = { pathname: '/about', search: '', hash: '' };
    const url = buildCanonicalUrl(location);
    assert.strictEqual(url, `https://${CANONICAL_HOSTNAME}/about${CANONICAL_HASH}`);
  });

  it('should use provided search string and fallback for others', () => {
    const location = { pathname: '', search: '?query=123', hash: '' };
    const url = buildCanonicalUrl(location);
    assert.strictEqual(url, `https://${CANONICAL_HOSTNAME}/?query=123${CANONICAL_HASH}`);
  });

  it('should use provided hash and fallback for others', () => {
    const location = { pathname: '', search: '', hash: '#section-1' };
    const url = buildCanonicalUrl(location);
    assert.strictEqual(url, `https://${CANONICAL_HOSTNAME}/#section-1`);
  });

  it('should construct URL with all provided properties', () => {
    const location = { pathname: '/blog/post-1', search: '?utm_source=test', hash: '#comments' };
    const url = buildCanonicalUrl(location);
    assert.strictEqual(url, `https://${CANONICAL_HOSTNAME}/blog/post-1?utm_source=test#comments`);
  });
});
