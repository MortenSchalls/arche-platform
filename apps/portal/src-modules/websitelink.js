/* ---------- Website: private look for the owner (30 Oct 2026) ----------
   Header button "Website ↗" (owner only). Asks /api/website for the address with Vercel's protection bypass and opens
   the locked archeaviation.com in a new tab, with no Vercel login. */
document.addEventListener("click", async ev => {
  const b = ev.target.closest && ev.target.closest('[data-act="website"]'); if (!b) return;
  ev.preventDefault();
  const w = window.open("about:blank", "_blank");   // opened at once, so phones do not block it
  try {
    const sess = (await window.__sb.auth.getSession()).data.session;
    const r = await fetch("/api/website", { method: "POST", headers: { authorization: "Bearer " + (sess ? sess.access_token : "") } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) throw new Error(j.error || "Could not open the website.");
    if (w) { try { w.opener = null; } catch (e) {} w.location.replace(j.url); } else location.href = j.url;
  } catch (e) { if (w) w.close(); if (typeof toast === "function") toast(e.message || String(e)); else alert(e.message || String(e)); }
});
