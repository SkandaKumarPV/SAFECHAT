const BASE_COLORS = [
  '#0ea5e9',
  '#22c55e',
  '#f97316',
  '#e11d48',
  '#8b5cf6',
  '#14b8a6',
];

function pickColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % BASE_COLORS.length;
  return BASE_COLORS[index];
}

export function avatarPlaceholder(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
  const bg = pickColor(name || initials);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="54%" font-size="64" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-weight="700">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function postPlaceholder(seed: string) {
  const color = pickColor(seed || 'post');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="52%" font-size="40" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-weight="600">Safe Post</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
