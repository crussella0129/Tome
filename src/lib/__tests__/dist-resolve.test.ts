import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { resolveDistPath, contentTypeFor } from '../../../scripts/dist-resolve.mjs';

// A fixed absolute distRoot keeps these tests pure (no filesystem access).
const DIST = join('/srv', 'tome', 'dist');

describe('resolveDistPath', () => {
  it('test_resolve_root_index: root path resolves to index.html', () => {
    expect(resolveDistPath('/', DIST)).toBe(join(DIST, 'index.html'));
    expect(resolveDistPath('', DIST)).toBe(join(DIST, 'index.html'));
  });

  it('test_resolve_route_index: an extensionless route resolves to its directory index.html', () => {
    expect(resolveDistPath('/getting-started', DIST)).toBe(
      join(DIST, 'getting-started', 'index.html'),
    );
    // A nested route resolves the same way.
    expect(resolveDistPath('/components/panels', DIST)).toBe(
      join(DIST, 'components', 'panels', 'index.html'),
    );
    // A trailing slash resolves identically to the extensionless form.
    expect(resolveDistPath('/getting-started/', DIST)).toBe(
      join(DIST, 'getting-started', 'index.html'),
    );
  });

  it('test_resolve_asset_passthrough: an extensioned asset passes through, query/hash stripped', () => {
    expect(resolveDistPath('/_astro/app.js', DIST)).toBe(join(DIST, '_astro', 'app.js'));
    expect(resolveDistPath('/fonts/mekzantine.woff2', DIST)).toBe(
      join(DIST, 'fonts', 'mekzantine.woff2'),
    );
    // Query and hash are ignored (the search index is fetched with a cache-buster).
    expect(resolveDistPath('/search-index.json?v=1', DIST)).toBe(
      join(DIST, 'search-index.json'),
    );
    expect(resolveDistPath('/search-index.json#top', DIST)).toBe(
      join(DIST, 'search-index.json'),
    );
  });

  it('test_resolve_escape_null: a path escaping distRoot returns null', () => {
    expect(resolveDistPath('/../secret', DIST)).toBeNull();
    expect(resolveDistPath('/a/../../etc/passwd', DIST)).toBeNull();
    expect(resolveDistPath('/../../..', DIST)).toBeNull();
    // Malformed percent-encoding is rejected rather than read.
    expect(resolveDistPath('/%ZZ', DIST)).toBeNull();
  });

  it('keeps an encoded path with an embedded space inside dist', () => {
    expect(resolveDistPath('/my%20image.png', DIST)).toBe(join(DIST, 'my image.png'));
  });
});

describe('contentTypeFor', () => {
  it('maps known extensions and falls back to octet-stream', () => {
    expect(contentTypeFor(join(DIST, 'index.html'))).toBe('text/html; charset=utf-8');
    expect(contentTypeFor(join(DIST, 'app.js'))).toBe('text/javascript; charset=utf-8');
    expect(contentTypeFor(join(DIST, 'search-index.json'))).toBe('application/json; charset=utf-8');
    expect(contentTypeFor(join(DIST, 'x.woff2'))).toBe('font/woff2');
    expect(contentTypeFor(join(DIST, 'x.unknownext'))).toBe('application/octet-stream');
  });
});
