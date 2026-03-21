const GITHUB_AVATAR_BASE = 'https://avatars.githubusercontent.com';
const GITHUB_PROFILE_BASE = 'https://github.com';

export function getGitHubAvatarUrl(login: string, size = 160) {
  return `${GITHUB_AVATAR_BASE}/${encodeURIComponent(login)}?size=${size}`;
}

export function getGitHubProfileUrl(login: string) {
  return `${GITHUB_PROFILE_BASE}/${encodeURIComponent(login)}`;
}

export function extractGitHubLogin(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (hostname === 'github.com' || hostname === 'www.github.com') {
      const pathname = url.pathname.replace(/^\/+|\/+$/g, '');
      return pathname || null;
    }

    if (hostname === 'avatars.githubusercontent.com') {
      const pathname = url.pathname.replace(/^\/+|\/+$/g, '');
      const firstSegment = pathname.split('/')[0];

      if (firstSegment && firstSegment !== 'u') {
        return firstSegment;
      }
    }
  } catch {
    if (/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(value)) {
      return value;
    }
  }

  return null;
}

export function getAvatarFallback(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

export function normalizeAvatarUrl(avatarUrl?: string | null, fallbackSeed = 'token-forbes') {
  if (!avatarUrl) {
    return getAvatarFallback(fallbackSeed);
  }

  try {
    const url = new URL(avatarUrl);
    const hostname = url.hostname.toLowerCase();

    if (hostname === 'github.com' || hostname === 'www.github.com') {
      const pathname = url.pathname.replace(/^\/+|\/+$/g, '');
      const login = pathname.replace(/\.png$/i, '');

      if (login) {
        return getGitHubAvatarUrl(login);
      }
    }

    if (hostname === 'avatars.githubusercontent.com' && !url.searchParams.has('size')) {
      url.searchParams.set('size', '160');
      return url.toString();
    }

    return url.toString();
  } catch {
    return /^[a-z0-9-]+$/i.test(avatarUrl) ? getGitHubAvatarUrl(avatarUrl) : getAvatarFallback(fallbackSeed);
  }
}
