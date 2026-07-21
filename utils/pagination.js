function normalizeLimit(value, fallback = 10, max = 50) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function normalizePage(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function buildPagination({ page = 1, limit = 10, total = 0 }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * limit;

  return {
    page: currentPage,
    limit,
    total,
    totalPages,
    offset,
    hasPrevious: currentPage > 1,
    hasNext: currentPage < totalPages,
    from: total ? offset + 1 : 0,
    to: Math.min(offset + limit, total)
  };
}

function buildQueryString(query = {}, updates = {}) {
  const params = new URLSearchParams();
  const merged = { ...query, ...updates };

  Object.entries(merged).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

module.exports = {
  normalizeLimit,
  normalizePage,
  buildPagination,
  buildQueryString
};
