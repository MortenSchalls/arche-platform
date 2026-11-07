// Research agent (Morten, 7 Nov 2026: "find a way we can do this on the web itself by creating an agent so I do not
// need to always rely on Claude"). The owner switches it on, picks how often, the focus areas and the monthly limit
// in the portal (Prospects > Research agent, stored in intel/agent), and can press "Run now". This check runs with the
// prospect rotation every 3 hours: it starts the daily research job (intel.mjs, all prospect rules enforced there)
// when a run is due or was asked for, and writes what happened back for the portal to show. No key, no run.
import { connect } from "./lib/db.mjs";
const DAY = 864e5;
// due? daily: once a day; weekdays: Monday to Friday; weekly: Mondays. Runs from 06:00 Bangkok time.
export function due(agent, lastRun, now = new Date()) {
  if (!agent || !agent.on) return false;
  const bkk = new Date(now.getTime() + 7 * 36e5), hour = bkk.getUTCHours(), dow = bkk.getUTCDay(), day = bkk.toISOString().slice(0, 10);
  const lastDay = lastRun ? new Date(Date.parse(lastRun) + 7 * 36e5).toISOString().slice(0, 10) : "";
  if (hour < 6 || lastDay === day) return false;
  const f = agent.freq || "daily";
  if (f === "weekdays") return dow >= 1 && dow <= 5;
  if (f === "weekly") return dow === 1 || (lastRun && now - Date.parse(lastRun) > 7 * DAY);
  return true;
}
export async function tick(db = connect(), log = console.log, runIntel = null, now = new Date()) {
  const agent = (await db.get("intel/agent")) || {}, status = (await db.get("intel/status")) || {};
  const asked = agent.runNow && agent.runNow.at && (!agent.lastStart || Date.parse(agent.runNow.at) > Date.parse(agent.lastStart));
  if (!asked && !due(agent, status.lastRun, now)) { log("Research agent: nothing due."); return { ran: false }; }
  if (!process.env.ANTHROPIC_API_KEY) {
    await db.set("intel/agent", { ...agent, state: "no-key", stateAt: db.now() });
    log("Research agent: due, but no ANTHROPIC_API_KEY secret on GitHub yet."); return { ran: false, noKey: true };
  }
  await db.set("intel/agent", { ...agent, state: "running", lastStart: db.now(), stateAt: db.now() });
  try {
    const intel = runIntel || (await import("./intel.mjs")).run;
    const r = await intel(db);
    const a2 = (await db.get("intel/agent")) || agent;
    await db.set("intel/agent", { ...a2, state: "done", stateAt: db.now(), last: { at: db.now(), added: (r.added || []).length, rejected: (r.rejected || []).length, operators: (r.operators || []).length, note: String(r.note || "").slice(0, 400), asked: !!asked } });
    log(`Research agent: ${(r.added || []).length} new organisations.`); return { ran: true, result: r };
  } catch (e) {
    const a2 = (await db.get("intel/agent")) || agent;
    await db.set("intel/agent", { ...a2, state: "failed", stateAt: db.now(), error: String(e && e.message || e).replace(/sk-ant-[A-Za-z0-9_-]+|sb_secret_[A-Za-z0-9_-]+/g, "[key]").slice(0, 300) });
    throw e;
  }
}
