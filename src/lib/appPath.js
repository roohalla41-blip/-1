// appPath.js — Build application URLs that work both at the domain root and GitHub Pages subpaths.
const base = import.meta.env.BASE_URL || '/';
const normalizedBase = base.endsWith('/') ? base : `${base}/`;

export function appPath(path = '/') {
  const relativePath = String(path).replace(/^\/+/, '');
  return `${normalizedBase}${relativePath}`;
}
