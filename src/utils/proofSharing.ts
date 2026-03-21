export const SHARED_PROOF_QUERY_PARAM = 'proof';
export const PROOF_ENTRY_URL = 'https://token-forbes.vercel.app/#submit-proof';

export function getSharedProofUserId(search: string) {
  const value = new URLSearchParams(search).get(SHARED_PROOF_QUERY_PARAM);
  return value?.trim() || null;
}

export function buildProofSharePath(userId: string) {
  const params = new URLSearchParams();
  params.set(SHARED_PROOF_QUERY_PARAM, userId);
  return `/?${params.toString()}`;
}

export function buildProofShareUrl(userId: string) {
  const path = buildProofSharePath(userId);

  if (typeof window === 'undefined') {
    return path;
  }

  return `${window.location.origin}${path}`;
}

export function formatProofCode(userId: string) {
  const compact = userId.replace(/[^a-z0-9]/gi, '').toUpperCase();
  if (!compact) {
    return 'TF-0000';
  }

  if (compact.length <= 8) {
    return `TF-${compact}`;
  }

  return `TF-${compact.slice(0, 4)}-${compact.slice(-4)}`;
}

export function getProofDownloadFileName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `token-forbes-proof-${slug || 'compute-certificate'}.png`;
}

export async function copyTextToClipboard(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === 'undefined') {
    throw new Error('Clipboard is not available in this environment.');
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error('Failed to copy text.');
  }
}
