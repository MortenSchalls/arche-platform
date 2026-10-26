/* Portal flow diagram: one source for the portal Help page and the manual (rendered to PNG). */
function flowSVG(accent){
  const A = accent || "currentColor";
  const W = 1384, H = 520, lanes = [["AI and automation",70],["Broker",190],["Operations",310],["Client and payment",430]];
  const bw = 132, bh = 54;
  const x = c => 168 + c * 152;
  const box = (c, r, t1, t2, hi) => { const X = x(c), Y = lanes[r][1] - bh / 2; return `<rect x="${X}" y="${Y}" width="${bw}" height="${bh}" rx="6" fill="none" stroke="${hi ? A : "currentColor"}" stroke-width="${hi ? 2 : 1.2}"/><text x="${X + bw / 2}" y="${Y + 23}" text-anchor="middle" font-size="12.5" font-weight="600" fill="currentColor">${t1}</text>${t2 ? `<text x="${X + bw / 2}" y="${Y + 40}" text-anchor="middle" font-size="11" fill="currentColor" opacity=".75">${t2}</text>` : ""}`; };
  const R = (c) => x(c) + bw, L = (c) => x(c), M = c => x(c) + bw / 2, ly = r => lanes[r][1];
  const arrow = (x1, y1, x2, y2, label, dash, lx, ly2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="1.2" ${dash ? 'stroke-dasharray="5 4"' : ""} marker-end="url(#ah)"/>${label ? `<text x="${lx ?? (x1 + x2) / 2}" y="${ly2 ?? ((y1 + y2) / 2 - 6)}" text-anchor="middle" font-size="11" fill="currentColor" opacity=".8">${label}</text>` : ""}`;
  const path = (d, label, lx, ly2, dash) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.2" ${dash ? 'stroke-dasharray="5 4"' : ""} marker-end="url(#ah)"/>${label ? `<text x="${lx}" y="${ly2}" text-anchor="middle" font-size="11" fill="currentColor" opacity=".8">${label}</text>` : ""}`;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="How a trip moves through the Archē portal, from prospect to commission, across AI, broker, operations and client" style="max-width:100%;height:auto;font-family:Inter,Hanken Grotesk,Arial,sans-serif">
  <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>`;
  lanes.forEach(([n, y], i) => { s += `<rect class="flowlane-${i + 1}" x="8" y="${y - 58}" width="${W - 16}" height="116" fill="currentColor" opacity="0.10"/><text x="20" y="${y + 4}" font-size="12" font-weight="700" fill="currentColor" letter-spacing=".04em">${n.toUpperCase().replace(" AND ", " &amp; ")}</text>`; });
  // AI lane
  s += box(0, 0, "Daily research", "new organisations") + box(1, 0, "Prospects", "with sources") + box(2, 0, "Rotation", "every 3 hours", true) + box(6, 0, "Daily backup", "Google Drive");
  // Broker lane
  s += box(2, 1, "Lead", "contact in 48 h") + box(3, 1, "Enquiry", "airport search") + box(4, 1, "Requests, extras", "and quote ÷ 0.91") + box(5, 1, "7 checks", "documents") + box(6, 1, "Commission", "month flown");
  // Ops lane
  s += box(5, 2, "Operations check", "Avinode, KYC, payment") + box(6, 2, "Confirmation", "issued, PDF saved", true) + box(7, 2, "Record", "payments, flight");
  // Client lane
  s += box(6, 3, "Signs, deposit", "25%, min USD 2,500") + box(7, 3, "Balance, flight", "7 days before") ;
  // arrows
  s += arrow(R(0), ly(0), L(1), ly(0)) + arrow(R(1), ly(0), L(2), ly(0));
  s += arrow(M(2), ly(0) + bh / 2, M(2), ly(1) - bh / 2, "assigns", false, M(2) + 34, (ly(0) + ly(1)) / 2 + 4);
  s += arrow(L(2) + 22, ly(1) - bh / 2, L(2) + 22, ly(0) + bh / 2, "no contact in time: back to rotation", true, L(2) - 70, (ly(0) + ly(1)) / 2 + 4);
  s += arrow(R(2), ly(1), L(3), ly(1)) + arrow(R(3), ly(1), L(4), ly(1)) + arrow(R(4), ly(1), L(5), ly(1));
  s += arrow(M(5), ly(1) + bh / 2, M(5), ly(2) - bh / 2, "send", false, M(5) + 22, (ly(1) + ly(2)) / 2 + 4);
  s += path(`M ${L(5)} ${ly(2)} C ${L(5) - 60} ${ly(2)}, ${M(4)} ${ly(2) - 20}, ${M(4)} ${ly(1) + bh / 2 + 2}`, "returned", L(5) - 64, ly(2) + 4, true);
  s += arrow(R(5), ly(2), L(6), ly(2)) + arrow(M(6), ly(2) + bh / 2, M(6), ly(3) - bh / 2, "signs", false, M(6) + 24, (ly(2) + ly(3)) / 2 + 4);
  s += arrow(R(6), ly(3), L(7), ly(3)) + arrow(M(7), ly(3) - bh / 2, M(7), ly(2) + bh / 2, "flies", false, M(7) + 22, (ly(2) + ly(3)) / 2 + 4);
  s += path(`M ${M(7)} ${ly(2) - bh / 2} L ${M(7)} ${ly(1)} L ${R(6) + 2} ${ly(1)}`, "paid and flown", M(7) - 4, ly(1) - 10);
  s += `<text x="${W - 20}" y="${H - 10}" text-anchor="end" font-size="10.5" fill="currentColor" opacity=".7">Dashed: loops back. Highlighted: steps the portal controls.</text></svg>`;
  return s;
}
if (typeof module !== "undefined") module.exports = {flowSVG};
