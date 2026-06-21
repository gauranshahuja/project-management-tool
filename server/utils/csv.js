// Tiny CSV builder — no dependency. Handles commas, quotes, newlines safely.
// Usage: toCsv([{name:'A',qty:5}], [{key:'name',label:'Name'},{key:'qty',label:'Qty'}])

const escapeCell = (value) => {
  if (value === null || value === undefined) return '';
  let s = String(value);
  // Prevent CSV/formula injection in spreadsheet apps
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
};

// columns: [{ key, label, get? }] — get(row) optional custom accessor
const toCsv = (rows, columns) => {
  const header = columns.map((c) => escapeCell(c.label || c.key)).join(',');
  const lines = rows.map((row) =>
    columns
      .map((c) => escapeCell(c.get ? c.get(row) : row[c.key]))
      .join(',')
  );
  return [header, ...lines].join('\r\n');
};

// Express helper: send CSV as a downloadable file
const sendCsv = (res, filename, csv) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('﻿' + csv); // BOM so Excel reads UTF-8 correctly
};

module.exports = { toCsv, sendCsv };
