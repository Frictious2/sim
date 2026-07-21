function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'item';
}

async function resolveUniqueSlug(input, existsFn) {
  const baseSlug = slugify(input);
  let candidate = baseSlug;
  let counter = 2;

  while (await existsFn(candidate)) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return candidate;
}

module.exports = {
  slugify,
  resolveUniqueSlug
};
