#!/usr/bin/env python3
"""Turn a claude.ai portal backup (Settings > Backup > Download full backup) into one SQL file
that the owner runs in the Supabase SQL Editor.

    python3 scripts/import-backup.py "<backup>.json" apps/portal/guide.json > import.sql

What it imports: commission terms and other settings, prospects, and the FAQ (from guide.json).
Prospects assigned to people who do not exist in the new portal (for example the Example Broker)
go back to "new", so the rotation assigns them again.
People-linked records (trips, payouts, leads, training) need the new sign-in ids; they are
counted and listed, and are imported in a second step once those people have signed in.

The generated SQL holds real business data: never commit it. Re-running it is safe (upserts).
"""
import json, sys

def lit(v):
    return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"

def text(v):
    return "'" + str(v).replace("'", "''") + "'"

def main(backup_path, guide_path):
    b = json.load(open(backup_path, encoding="utf-8"))
    g = json.load(open(guide_path, encoding="utf-8"))
    out = [f"-- Archē portal import from {backup_path.split('/')[-1]}",
           f"-- exported {b.get('exportedAt','?')} by {b.get('exportedBy','?')}", "begin;"]

    for key, val in (b.get("config") or {}).items():
        if key == "launch" or not val:
            continue
        out.append(f"insert into public.config (key, value) values ({text(key)}, {lit(val)}) on conflict (key) do update set value = excluded.value, updated_at = now();")

    known_people = set((b.get("roster") or {}).keys())
    reset = 0
    for pid, p in (b.get("prospects") or {}).items():
        p = dict(p)
        if p.get("assignedTo") and p["assignedTo"] not in known_people:
            reset += 1
            p.update(status="new", assignedTo=None, assignedAt=None)
            p["history"] = [h for h in (p.get("history") or []) if not (h.get("to") or h.get("bid")) or (h.get("to") or h.get("bid")) in known_people]
        out.append(f"insert into public.prospects (id, data) values ({text(pid)}, {lit(p)}) on conflict (id) do update set data = excluded.data, updated_at = now();")

    for i, (q, a) in enumerate(g.get("faq") or [], start=1):
        fid = f"f{i:02d}"
        out.append(f"insert into public.faq (id, data) values ({text(fid)}, {lit({'q': q, 'a': a, 'source': 'guide ' + str(g.get('version','')), 'order': i})}) on conflict (id) do update set data = excluded.data, updated_at = now();")

    out.append("commit;")
    out.append("select 'prospects' as what, count(*) from public.prospects union all select 'faq', count(*) from public.faq union all select 'settings', count(*) from public.config;")

    def count(section):
        v = b.get(section) or {}
        return sum(len(x) for x in v.values() if isinstance(x, dict)) if isinstance(v, dict) else len(v)
    later = {s: count(s) for s in ("roster", "join", "desk", "status", "payouts", "leads", "asks", "train", "audit", "files")}
    sys.stderr.write(f"settings {len([k for k,v in (b.get('config') or {}).items() if v and k!='launch'])}, prospects {len(b.get('prospects') or {})} "
                     f"({reset} reset from people not in the new portal), faq {len(g.get('faq') or [])}\n"
                     f"left for step 2 (need new sign-in ids): {later}\n")
    print("\n".join(out))

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
