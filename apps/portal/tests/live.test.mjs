// /api/live server checks: the caller always shares, watchers only from active people, never Security or Settings,
// only holders of the train right (or owners). Example data only.
import { buildLive, cleanSyl, mayTrain, mayEnd } from "../api/live.mjs";
const ok = (k, v) => { console.log((v ? "PASS " : "FAIL ") + k); if (!v) process.exitCode = 1; };
const A = "00000000-0000-0000-0000-0000000000b2", B = "00000000-0000-0000-0000-0000000000b1", X = "00000000-0000-0000-0000-0000000000ff";
const people = [{ id: B, name: "Example Junior", role: "broker" }];
const l = buildLive({ owner: X, watchers: [B, X, A, "not-an-id"], scope: ["trips", "security", "settings", "Bad!"], hours: 4, syl: { on: true, course: "full", idx: 3, done: { m1: true, "<x>": true } } }, { id: A, name: "Example Senior" }, people, { id: "abc", nowMs: Date.parse("2026-10-29T10:00:00Z") });
ok("the caller always shares, whatever is sent", l.owner === A && l.ownerName === "Example Senior");
ok("watchers only from the active people, never the caller", l.watchers.join() === B);
ok("Security and Settings are never shared", l.scope.join() === "trips");
ok("the session ends after the chosen hours", l.until === "2026-10-29T14:00:00.000Z");
ok("syllabus cleaned", l.syl.course === "full" && l.syl.idx === 3 && l.syl.done.m1 && !("<x>" in l.syl.done));
ok("odd hours fall back to 2", Date.parse(buildLive({ watchers: [B], scope: ["trips"], hours: 99 }, { id: A }, people, { id: "x", nowMs: 0 }).until) === 2 * 3600e3);
let e1 = false; try { buildLive({ watchers: [X], scope: ["trips"] }, { id: A }, people, { id: "x" }); } catch (e) { e1 = /who may watch/.test(e.message); } ok("refused without a valid watcher", e1);
let e2 = false; try { buildLive({ watchers: [B], scope: ["settings"] }, { id: A }, people, { id: "x" }); } catch (e) { e2 = /one page/.test(e.message); } ok("refused without a page that may be shared", e2);
ok("unknown course becomes the familiarisation", cleanSyl({ course: "x", idx: -5 }).course === "fam" && cleanSyl({ idx: -5 }).idx === 0);
ok("the train right or the owner role is needed", mayTrain({ role: "broker", active: true, data: { rights: { train: true } } }) && mayTrain({ role: "owner", active: true }) && !mayTrain({ role: "broker", active: true, data: { rights: { supervise: true } } }) && !mayTrain({ role: "broker", active: false, data: { rights: { train: true } } }));
ok("only the one who shares, or an owner, ends a session", mayEnd({ owner: A }, { id: A, role: "broker" }) && mayEnd({ owner: A }, { id: X, role: "owner" }) && !mayEnd({ owner: A }, { id: B, role: "broker" }));
