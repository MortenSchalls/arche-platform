// Research agent schedule (Morten, 7 Nov 2026; research by a Claude scheduled task since 8 Nov 2026, no AI key: see
// prospectagent.mjs). The Director switches it on and picks how often and the focus areas in the portal (Prospects >
// Research agent, stored in intel/agent). The daily task asks prospectagent.mjs "plan" whether a run is due.
const DAY = 864e5;
// due? daily: once a day; weekdays: Monday to Friday; weekly: Mondays. Runs from 06:00 Bangkok time.
export const sessionOf = t => { const d = new Date(Date.parse(t) + 7 * 36e5); return d.toISOString().slice(0, 10) + (d.getUTCHours() >= 13 ? "pm" : "am"); };
export function due(agent, lastRun, now = new Date()) {
  if (!agent || !agent.on) return false;
  const bkk = new Date(now.getTime() + 7 * 36e5), hour = bkk.getUTCHours(), dow = bkk.getUTCDay(), day = bkk.toISOString().slice(0, 10);
  // two research sessions a day, morning (from 06:00 Bangkok) and afternoon (from 13:00), each with its own focus areas
  // (Morten, 24 Nov 2026, "yes" to running the research twice a day)
  if (hour < 6) return false;
  if (lastRun && sessionOf(lastRun) === sessionOf(now.toISOString())) return false;
  const f = agent.freq || "daily";
  if (f === "weekdays") return dow >= 1 && dow <= 5;
  if (f === "weekly") return (dow === 1 && hour < 13) || (lastRun && now - Date.parse(lastRun) > 7 * DAY);
  return true;
}
