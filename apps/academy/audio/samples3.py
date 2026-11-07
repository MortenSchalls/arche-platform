# Round 3 voice samples (Morten, 7 Nov 2026: "give me a British female as well"). Same spoken narration as round 2.
# Kokoro has two British female voices; Chatterbox has no British voice of its own, so it is given a short Kokoro
# British-female clip as its reference voice (both open licences: Apache-2.0 and MIT). Runs on GitHub; no key, no cost.
import sys, subprocess, numpy as np, soundfile as sf
text = open(sys.argv[1], encoding="utf-8").read().strip(); out = sys.argv[2]
paras = [p.strip() for p in text.split("\n\n") if p.strip()]
def mp3(wav, name):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", "loudnorm=I=-18:TP=-1.5:LRA=7", "-ac", "1", "-b:a", "80k", f"{out}/{name}.mp3"], check=True); print("made", name, flush=True)
def gap(sr, s): return np.zeros(int(sr * s), dtype=np.float32)
from kokoro import KPipeline
pipe = KPipeline(lang_code="b")
for voice, name in [("bf_emma", "R3-E-british-female-emma"), ("bf_isabella", "R3-F-british-female-isabella")]:
    parts = []
    for p in paras:
        for _, _, a in pipe(p, voice=voice, speed=1.0, split_pattern=None): parts.append(np.asarray(a, dtype=np.float32))
        parts.append(gap(24000, 0.42))
    sf.write(f"{out}/{name}.wav", np.concatenate(parts), 24000); mp3(f"{out}/{name}.wav", name)
# reference clip for Chatterbox: about 12 seconds of the Emma voice reading neutral text
ref = []
for _, _, a in pipe("Good morning, and thank you for calling. I will check the aircraft, the airports and the schedule for you, and come back to you in writing within the hour.", voice="bf_emma", speed=1.0): ref.append(np.asarray(a, dtype=np.float32))
sf.write("ref_emma.wav", np.concatenate(ref), 24000)
import torch
from chatterbox.tts import ChatterboxTTS
m = ChatterboxTTS.from_pretrained(device="cpu"); torch.manual_seed(7)
parts = []
for p in paras:
    w = m.generate(p, audio_prompt_path="ref_emma.wav", exaggeration=0.5, cfg_weight=0.4)
    parts.append(w.squeeze(0).numpy().astype(np.float32)); parts.append(gap(m.sr, 0.4))
sf.write(f"{out}/R3-G-british-female-chatterbox.wav", np.concatenate(parts), m.sr); mp3(f"{out}/R3-G-british-female-chatterbox.wav", "R3-G-british-female-chatterbox")
