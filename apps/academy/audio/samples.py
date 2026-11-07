# Voice samples for the academy narration (Morten, 7 Nov 2026). Runs on GitHub (it needs the open-licence Kokoro
# model, Apache-2.0, downloaded there); writes one MP3 per voice for Morten to choose from. No key and no cost.
import sys, subprocess, numpy as np, soundfile as sf
from kokoro import KPipeline
text = open(sys.argv[1], encoding="utf-8").read().strip()
out = sys.argv[2]
VOICES = [("a", "af_heart", "1-american-female"), ("b", "bf_emma", "2-british-female"), ("b", "bm_george", "3-british-male"), ("b", "bm_fable", "4-british-male-warm")]
for lang, voice, name in VOICES:
    pipe = KPipeline(lang_code=lang)
    parts = []
    for para in [p for p in text.split("\n\n") if p.strip()]:
        for _, _, audio in pipe(para, voice=voice, speed=0.97):
            parts.append(audio)
        parts.append(np.zeros(int(24000 * 0.55), dtype=np.float32))   # a breath between paragraphs
    wav = f"{out}/{name}.wav"
    sf.write(wav, np.concatenate(parts), 24000)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-ac", "1", "-b:a", "64k", f"{out}/{name}.mp3"], check=True)
    print("made", name)
