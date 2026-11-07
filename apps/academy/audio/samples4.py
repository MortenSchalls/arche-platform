# Round 4 (Morten, 7 Nov 2026: "I like Isabella, can I have one British male similar"). Same model and settings as
# Isabella (Kokoro, Apache-2.0), all four of its British male voices, same spoken lesson. No key, no cost.
import sys, subprocess, numpy as np, soundfile as sf
from kokoro import KPipeline
text = open(sys.argv[1], encoding="utf-8").read().strip(); out = sys.argv[2]
paras = [p.strip() for p in text.split("\n\n") if p.strip()]
pipe = KPipeline(lang_code="b")
for voice, name in [("bm_lewis", "R4-1-british-male-lewis"), ("bm_daniel", "R4-2-british-male-daniel"), ("bm_george", "R4-3-british-male-george"), ("bm_fable", "R4-4-british-male-fable")]:
    parts = []
    for p in paras:
        for _, _, a in pipe(p, voice=voice, speed=1.0, split_pattern=None): parts.append(np.asarray(a, dtype=np.float32))
        parts.append(np.zeros(int(24000 * 0.42), dtype=np.float32))
    sf.write(f"{out}/{name}.wav", np.concatenate(parts), 24000)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{out}/{name}.wav", "-af", "loudnorm=I=-18:TP=-1.5:LRA=7", "-ac", "1", "-b:a", "80k", f"{out}/{name}.mp3"], check=True); print("made", name, flush=True)
