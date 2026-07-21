function sanitizeCsvValue(value) {
  const stringValue = value === null || value === undefined ? '' : String(value);
  const protectedValue = /^[=+\-@]/.test(stringValue) ? `'${stringValue}` : stringValue;
  return `"${protectedValue.replace(/"/g, '""')}"`;
}

function rowsToCsv(headers, rows) {
  const headerLine = headers.map((header) => sanitizeCsvValue(header.label)).join(',');
  const dataLines = rows.map((row) => headers.map((header) => sanitizeCsvValue(row[header.key])).join(','));
  return [headerLine].concat(dataLines).join('\n');
}

module.exports = {
  sanitizeCsvValue,
  rowsToCsv
};
