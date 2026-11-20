export function slugify(value) {
  const base = String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base || 'item'}-${Date.now().toString(36)}`;
}
