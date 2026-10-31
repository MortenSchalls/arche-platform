const note = (k, s) => console.log(`::notice title=${k}::` + String(s).replace(/%/g, "%25").replace(/\r?\n/g, "%0A").slice(0, 3800));
try {
const r = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml"); const x = await r.text(); note("len", r.status + " " + x.length + " " + x.slice(0, 300));
const days = [...x.matchAll(/<Cube time=["'](\d{4}-\d\d-\d\d)["']>([\s\S]*?)<\/Cube>/g)].map(m => { const g = c => +((m[2].match(new RegExp(`currency=["']${c}["'] rate=["']([\\d.]+)["']`)) || [])[1]); return { d: m[1], thb: g("THB") / g("USD") }; }).filter(o => o.thb > 0);
const last = days[0].d, end = new Date(last), start = new Date(end); start.setFullYear(start.getFullYear() - 3);
const win = days.filter(o => new Date(o.d) > start);
const avg = win.reduce((a, o) => a + o.thb, 0) / win.length;
const byYear = {}; days.forEach(o => { const y = o.d.slice(0, 4); (byYear[y] = byYear[y] || []).push(o.thb); });
const ya = Object.fromEntries(Object.entries(byYear).filter(([y]) => y >= "2022").map(([y, a]) => [y, +(a.reduce((s, v) => s + v, 0) / a.length).toFixed(4)]));
note("fx", JSON.stringify({ latest: last, latestRate: +days[0].thb.toFixed(4), window: [win[win.length - 1].d, win[0].d], days: win.length, avg3y: +avg.toFixed(4), yearly: ya }));

} catch (e) { note("err", e.stack); }
