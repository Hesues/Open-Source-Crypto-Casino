// Standalone smoke test for src/lib/csv.ts
// Run with: node artifacts/api-server/scripts/test-csv-escape.mjs

import assert from "node:assert/strict";

// Inline copy of the escaper so this script has no build-step dependency.
const NEEDS_QUOTING = /[",\r\n]/;
const FORMULA_PREFIX = /^(?:[=@\t\r]|[-+](?![0-9.]))/;

function escapeCsvField(value) {
  if (value === null || value === undefined) return "";
  let str;
  if (value instanceof Date) str = value.toISOString();
  else if (typeof value === "number" || typeof value === "bigint") str = String(value);
  else if (typeof value === "boolean") str = value ? "true" : "false";
  else str = String(value);
  if (FORMULA_PREFIX.test(str)) str = "'" + str;
  if (NEEDS_QUOTING.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}
function csvRow(fields) { return fields.map(escapeCsvField).join(",") + "\r\n"; }

// 1. Plain values
assert.equal(escapeCsvField("hello"), "hello");
assert.equal(escapeCsvField(42), "42");
assert.equal(escapeCsvField(3.14), "3.14");
assert.equal(escapeCsvField(true), "true");
assert.equal(escapeCsvField(false), "false");
assert.equal(escapeCsvField(null), "");
assert.equal(escapeCsvField(undefined), "");

// 2. Date → ISO
assert.equal(escapeCsvField(new Date("2026-04-17T10:30:00Z")), "2026-04-17T10:30:00.000Z");

// 3. Comma forces quoting
assert.equal(escapeCsvField("a,b"), '"a,b"');

// 4. Internal quote is doubled and field is wrapped
assert.equal(escapeCsvField('say "hi"'), '"say ""hi"""');

// 5. Newlines force quoting
assert.equal(escapeCsvField("line1\nline2"), '"line1\nline2"');
assert.equal(escapeCsvField("line1\r\nline2"), '"line1\r\nline2"');

// 6. CSV-injection prefixes get a leading single quote
assert.equal(escapeCsvField("=SUM(A1)"), "'=SUM(A1)");
assert.equal(escapeCsvField("@user"), "'@user");
assert.equal(escapeCsvField("\tfoo"), "'\tfoo");
// Sign followed by non-digit is dangerous (e.g. "-cmd|...", "+R1C1")
assert.equal(escapeCsvField("-cmd"), "'-cmd");
assert.equal(escapeCsvField("+R1C1"), "'+R1C1");
// Plain numeric strings must NOT be prefixed (would corrupt accounting data)
assert.equal(escapeCsvField("-1234"), "-1234");
assert.equal(escapeCsvField("+1234"), "+1234");
assert.equal(escapeCsvField("-5.00"), "-5.00");
assert.equal(escapeCsvField("+0.5"), "+0.5");

// 7. Injection prefix combined with comma still escapes correctly
//    (prefix added first, then quoted because of the comma)
assert.equal(escapeCsvField("=A1,B1"), '"\'=A1,B1"');

// 8. csvRow assembles fields with CRLF terminator
assert.equal(
  csvRow(["id", "name", "amount"]),
  "id,name,amount\r\n",
);
assert.equal(
  csvRow([1, "Alice, the Great", 9.99]),
  '1,"Alice, the Great",9.99\r\n',
);

// 9. Excel-safe round-trip example
//    The injection-prefix `'` is added; field has no comma/quote/newline so
//    no wrapping quotes are needed. The leading `'` keeps Excel from
//    evaluating the formula.
const out = csvRow([42, new Date("2026-01-01T00:00:00Z"), "=cmd|' /C calc'!A1", "normal"]);
assert.equal(
  out,
  "42,2026-01-01T00:00:00.000Z,'=cmd|' /C calc'!A1,normal\r\n",
);

console.log("csv-escape: all assertions passed");
