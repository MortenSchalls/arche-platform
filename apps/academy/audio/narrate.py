# Records the academy narration in one voice and keeps it in the portal's private storage (Morten, 7 Nov 2026).
# Input: audio/screens.int.json (every screen, made by screens.js) and audio/narration/*.json (hand-written spoken
# versions, {key: text}, used instead of the automatic text where present). Each screen is recorded once; a screen is
# re-recorded only when its words change. Free open model (Kokoro, Apache-2.0); runs on GitHub with the server key.
# Usage: python narrate.py <kokoro voice> <name>     e.g. bf_isabella isabella
import sys, os, json, glob, hashlib, subprocess, urllib.request, urllib.error, numpy as np, soundfile as sf
VOICE, NAME = sys.argv[1], sys.argv[2]
URL, KEY = os.environ["SUPABASE_URL"].rstrip("/"), os.environ["SUPABASE_SECRET_KEY"]
HERE = os.path.dirname(os.path.abspath(__file__)); BUCKET = "academy-audio"
def req(method, path, body=None, ctype="application/json", extra=None):
    h = {"authorization": "Bearer " + KEY, "apikey": KEY, "content-type": ctype}; h.update(extra or {})
    r = urllib.request.Request(URL + path, data=body, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=120) as x: return x.status, x.read()
    except urllib.error.HTTPError as e: return e.code, e.read()
# the bucket (private) exists, or is made; reading rights come from SQL 0022
st, b = req("GET", f"/storage/v1/bucket/{BUCKET}")
if st != 200: print("bucket", req("POST", "/storage/v1/bucket", json.dumps({"id": BUCKET, "name": BUCKET, "public": False}).encode())[0])
st, b = req("GET", f"/storage/v1/object/{BUCKET}/{NAME}/index.json")
index = json.loads(b) if st == 200 else {"voice": NAME, "keys": {}}
screens = json.load(open(os.path.join(HERE, "screens.int.json"), encoding="utf-8"))
over = {}
for f in sorted(glob.glob(os.path.join(HERE, "narration", "*.json"))): over.update(json.load(open(f, encoding="utf-8")))
def words(s):
    paras = list(s["say"])
    if s["kind"] in ("lesson", "keypoints") and len(paras) > 1: paras = paras[1:]          # the module title is on every screen; say it once, on the intro
    t = over.get(s["key"]) or "\n\n".join(paras)
    return t.replace("ar Kay", "Arkay").replace("Archē", "Arkay")
from kokoro import KPipeline
pipe = KPipeline(lang_code="b" if VOICE.startswith("b") else "a")
todo = [(s, words(s)) for s in screens]
todo = [(s, t, hashlib.sha1((VOICE + "|" + t).encode()).hexdigest()[:12]) for s, t in todo]
todo = [x for x in todo if index["keys"].get(x[0]["key"], {}).get("h") != x[2]]
print(f"{NAME}: {len(screens)} screens, {len(todo)} to record", flush=True)
done = 0
for s, t, h in todo:
    parts = []
    for p in [p.strip() for p in t.split("\n\n") if p.strip()]:
        for _, _, a in pipe(p, voice=VOICE, speed=1.0, split_pattern=None): parts.append(np.asarray(a, dtype=np.float32))
        parts.append(np.zeros(int(24000 * 0.42), dtype=np.float32))
    if not parts: continue
    wav = "/tmp/n.wav"; sf.write(wav, np.concatenate(parts), 24000)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", "loudnorm=I=-18:TP=-1.5:LRA=7", "-ac", "1", "-b:a", "56k", "/tmp/n.mp3"], check=True)
    dur = round(sum(len(x) for x in parts) / 24000, 1)
    code, msg = req("POST", f"/storage/v1/object/{BUCKET}/{NAME}/{s['key']}.mp3", open("/tmp/n.mp3", "rb").read(), "audio/mpeg", {"x-upsert": "true", "cache-control": "3600"})
    if code not in (200, 201): print("upload failed", s["key"], code, msg[:200]); continue
    index["keys"][s["key"]] = {"h": h, "d": dur}; done += 1
    if done % 25 == 0:
        req("POST", f"/storage/v1/object/{BUCKET}/{NAME}/index.json", json.dumps(index).encode(), "application/json", {"x-upsert": "true", "cache-control": "60"}); print(f"{NAME}: {done}/{len(todo)}", flush=True)
# screens that no longer exist drop out of the index (their files stay until the next clean-up)
live = {s["key"] for s in screens}; index["keys"] = {k: v for k, v in index["keys"].items() if k in live}
code, msg = req("POST", f"/storage/v1/object/{BUCKET}/{NAME}/index.json", json.dumps(index).encode(), "application/json", {"x-upsert": "true", "cache-control": "60"})
print(f"{NAME}: recorded {done}, index {code}, total {len(index['keys'])} screens, {round(sum(v['d'] for v in index['keys'].values())/60)} minutes")
