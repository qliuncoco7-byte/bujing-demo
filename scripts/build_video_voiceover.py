#!/usr/bin/env python3
"""Generate a macOS TTS voiceover for the recorded demo and mix it to WAV.

Usage: python3 scripts/build_video_voiceover.py docs/video-voiceover.json out.wav
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import wave
from array import array
from pathlib import Path

SAMPLE_RATE = 44100
VOICE = "Tingting"
PEAK = 0.86


def run(command: list[str]) -> None:
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def read_mono(path: Path) -> array:
    with wave.open(str(path), "rb") as wf:
        if wf.getnchannels() != 1 or wf.getsampwidth() != 2:
            raise SystemExit(f"{path} is not mono 16-bit PCM")
        rate = wf.getframerate()
        raw = wf.readframes(wf.getnframes())
    samples = array("h")
    samples.frombytes(raw)
    if sys.byteorder == "big":
        samples.byteswap()
    return resample(samples, rate)


def resample(samples: array, src_rate: int) -> array:
    if src_rate == SAMPLE_RATE:
        return samples
    ratio = SAMPLE_RATE / src_rate
    out_len = int(len(samples) * ratio)
    out = array("h", [0]) * out_len
    for i in range(out_len):
        pos = i / ratio
        left = int(pos)
        right = min(left + 1, len(samples) - 1)
        frac = pos - left
        out[i] = int(samples[left] * (1 - frac) + samples[right] * frac)
    return out


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    config = json.loads(Path(sys.argv[1]).read_text())
    output = Path(sys.argv[2])
    total_seconds = float(config["totalSeconds"])
    rate = int(config.get("rate", 195))
    lines = sorted(config["lines"], key=lambda item: item["at"])
    total = int(total_seconds * SAMPLE_RATE)
    mix = array("f", [0.0]) * total

    tmp = Path(tempfile.mkdtemp(prefix="bujing-vo-"))
    print(f"generating {len(lines)} TTS lines with {VOICE} at rate {rate}")
    measured: list[tuple[float, float]] = []
    for index, line in enumerate(lines):
        aiff = tmp / f"line-{index:02d}.aiff"
        wav = tmp / f"line-{index:02d}.wav"
        run(["say", "-v", VOICE, "-r", str(rate), "-o", str(aiff), line["text"]])
        run(["afconvert", "-f", "WAVE", "-d", f"LEI16@{SAMPLE_RATE}", "-c", "1", str(aiff), str(wav)])
        samples = read_mono(wav)
        start = int(float(line["at"]) * SAMPLE_RATE)
        end_sec = float(line["at"]) + len(samples) / SAMPLE_RATE
        measured.append((float(line["at"]), end_sec))
        for i, sample in enumerate(samples):
            pos = start + i
            if pos >= total:
                break
            mix[pos] += sample / 32768.0
        print(f"  {line['at']:7.2f}s  -> {end_sec:7.2f}s  ({len(samples)/SAMPLE_RATE:4.2f}s)  {line['text'][:34]}")

    for i, (start, end) in enumerate(measured):
        if i + 1 < len(measured):
            next_start = measured[i + 1][0]
            if end > next_start + 0.15:
                print(f"WARNING overlap: line {i+1} ends {end:.2f}s, next starts {next_start:.2f}s")
        if end > total_seconds - 0.1:
            print(f"WARNING line {i+1} ends after video: {end:.2f}s / {total_seconds:.2f}s")

    peak = max((abs(v) for v in mix), default=1.0) or 1.0
    gain = PEAK / peak
    pcm = array("h", [0]) * total
    for i, value in enumerate(mix):
        fade = 1.0
        if i < int(0.12 * SAMPLE_RATE):
            fade = i / (0.12 * SAMPLE_RATE)
        tail = total - i
        if tail < int(0.35 * SAMPLE_RATE):
            fade = min(fade, tail / (0.35 * SAMPLE_RATE))
        pcm[i] = int(max(-1.0, min(1.0, value * gain * fade)) * 32767)
    if sys.byteorder == "big":
        pcm.byteswap()
    output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm.tobytes())
    print(f"wrote {output} ({total_seconds:.1f}s)")


if __name__ == "__main__":
    main()
