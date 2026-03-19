export const CANONICAL_HOSTNAME = 'token-forbes.vercel.app';
export const CANONICAL_HASH = '#rankings';

const ALIAS_HOSTNAMES = new Set([
  'token-forbes-vercel.vercel.app',
]);

export function shouldRedirectToCanonicalHost(hostname: string) {
  return ALIAS_HOSTNAMES.has(hostname);
}

export function buildCanonicalUrl(location: Pick<Location, 'pathname' | 'search' | 'hash'>) {
  const pathname = location.pathname || '/';
  const hash = location.hash || CANONICAL_HASH;
  return `https://${CANONICAL_HOSTNAME}${pathname}${location.search || ''}${hash}`;
}

export function redirectToCanonicalHost() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!shouldRedirectToCanonicalHost(window.location.hostname)) {
    return false;
  }

  window.location.replace(buildCanonicalUrl(window.location));
  return true;
}
