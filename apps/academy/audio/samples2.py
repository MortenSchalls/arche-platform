# Round 2 voice samples (Morten, 7 Nov 2026: "much better, but still robotic in the flow"). The lesson is rewritten as
# spoken narration (sample2.txt), and read by two free open models: Kokoro (Apache-2.0) with smoother pacing, and
# Chatterbox (MIT), which is built for natural, expressive delivery. Runs on GitHub; no key, no cost.
import sys, subprocess, numpy as np, soundfile as sf
text = open(sys.argv[1], encoding="utf-8").read().strip()
out = sys.argv[2]
paras = [p.strip() for p in text.split("\n\n") if p.strip()]
def mp3(wav, name):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", "loudnorm=I=-18:TP=-1.5:LRA=7", "-ac", "1", "-b:a", "80k", f"{out}/{name}.mp3"], check=True)
    print("made", name, flush=True)
def gap(sr, s): return np.zeros(int(sr * s), dtype=np.float32)

# Kokoro: one pass per paragraph (no sentence chopping), natural speed, shorter pauses
from kokoro import KPipeline
for lang, voice, name in [("a", "af_heart", "R2-A-free-american-female"), ("b", "bm_george", "R2-B-free-british-male")]:
    pipe = KPipeline(lang_code=lang); parts = []
    for p in paras:
        for _, _, a in pipe(p, voice=voice, speed=1.0, split_pattern=None): parts.append(np.asarray(a, dtype=np.float32))
        parts.append(gap(24000, 0.42))
    sf.write(f"{out}/{name}.wav", np.concatenate(parts), 24000); mp3(f"{out}/{name}.wav", name)

# Chatterbox: expressive model; moderate emotion, slightly slower, steadier pacing
import torch
from chatterbox.tts import ChatterboxTTS
m = ChatterboxTTS.from_pretrained(device="cpu"); torch.manual_seed(7)
for ex, cfg, name in [(0.45, 0.45, "R2-C-chatterbox-calm"), (0.6, 0.35, "R2-D-chatterbox-warm")]:
    parts = []
    for p in paras:
        w = m.generate(p, exaggeration=ex, cfg_weight=cfg)
        parts.append(w.squeeze(0).numpy().astype(np.float32)); parts.append(gap(m.sr, 0.4))
    sf.write(f"{out}/{name}.wav", np.concatenate(parts), m.sr); mp3(f"{out}/{name}.wav", name)
