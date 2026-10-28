// GDPR review copy (branch gdpr-review, 28 Oct 2026): this function is switched off. Nothing is stored, sent or read
// from the live database. The live version is on the main branch.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ ok: true, review: true, note: "Review copy: nothing is saved or sent." });
}
