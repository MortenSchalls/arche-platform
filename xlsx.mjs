// Minimal XLSX reader for the official list files (DFAT, EU Air Safety List, FAA Part 135). No dependency:
// reads the zip's central directory, inflates the parts with zlib, and returns each sheet as rows of cell text.
import { inflateRawSync } from "node:zlib";

function unzip(buf) {
  const files = {};
  let e = buf.length - 22;
  while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error("not a zip file");
  const n = buf.readUInt16LE(e + 10); let p = buf.readUInt32LE(e + 16);
  for (let i = 0; i < n; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("bad zip directory");
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nl).toString("utf8");
    const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28), data = buf.slice(start, start + csize);
    files[name] = () => (method === 0 ? data : inflateRawSync(data)).toString("utf8");
    p += 46 + nl + xl + cl;
  }
  return files;
}
const unxml = s => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&amp;/g, "&");
const colNo = ref => { let c = 0; for (const ch of ref.replace(/\d+/g, "")) c = c * 26 + ch.charCodeAt(0) - 64; return c - 1; };

// returns [{name, rows: [[cell text]]}] in workbook order
export function readXlsx(buf) {
  const f = unzip(Buffer.isBuffer(buf) ? buf : Buffer.from(buf));
  const shared = f["xl/sharedStrings.xml"] ? [...f["xl/sharedStrings.xml"]().matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => unxml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join(""))) : [];
  const wb = f["xl/workbook.xml"] ? f["xl/workbook.xml"]() : "", rels = f["xl/_rels/workbook.xml.rels"] ? f["xl/_rels/workbook.xml.rels"]() : "";
  const target = id => { const m = rels.match(new RegExp(`<Relationship[^>]*Id="${id}"[^>]*Target="([^"]+)"`)) || rels.match(new RegExp(`<Relationship[^>]*Target="([^"]+)"[^>]*Id="${id}"`)); return m ? "xl/" + m[1].replace(/^\/?xl\//, "").replace(/^\//, "") : null; };
  const sheets = [...wb.matchAll(/<sheet\b[^>]*>/g)].map(m => ({ name: unxml((m[0].match(/name="([^"]*)"/) || [])[1] || ""), path: target((m[0].match(/r:id="([^"]*)"/) || [])[1]) }));
  return sheets.filter(s => s.path && f[s.path]).map(s => {
    const rows = [...f[s.path]().matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(r => {
      const row = [];
      for (const c of r[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = c[1], body = c[2] || "", ref = (attrs.match(/r="([A-Z]+\d+)"/) || [])[1], t = (attrs.match(/t="(\w+)"/) || [])[1];
        const v = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        const text = t === "s" ? shared[+v] ?? "" : t === "inlineStr" ? unxml([...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join("")) : v != null ? unxml(v) : "";
        row[ref ? colNo(ref) : row.length] = text;
      }
      return Array.from(row, x => x ?? "");
    });
    return { name: s.name, rows };
  });
}
