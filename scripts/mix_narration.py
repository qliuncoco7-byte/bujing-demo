#!/usr/bin/env python3
"""Mix the three self-made TTS narration lines onto a 15 s timeline.

Usage: python3 scripts/mix_narration.py out.wav line1.wav line2.wav line3.wav
"""
from __future__ import annotations

import sys
import wave
from array import array
from pathlib import Path

TOTAL_SECONDS = 15.0
SAMPLE_RATE = 44100
OFFSETS = (0.55, 5.10, 9.40)
PEAK = 0.82


def read_mono(path: Path) -> array:
    with wave.open(str(path), "rb") as wf:
        if wf.getnchannels() != 1 or wf.getsampwidth() != 2:
            raise SystemExit(f"{path} must be mono 16-bit PCM")
        frames = wf.readframes(wf.getnframes())
    samples = array("h")
    samples.frombytes(frames)
    if sys.byteorder == "big":
        samples.byteswap()
    return samples


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
    if len(sys.argv) != 5:
        raise SystemExit(__doc__)
    out_path = Path(sys.argv[1])
    total = int(TOTAL_SECONDS * SAMPLE_RATE)
    mix = array("f", [0.0]) * total

    for offset, src in zip(OFFSETS, sys.argv[2:], strict=True):
        path = Path(src)
        with wave.open(str(path), "rb") as wf:
            src_rate = wf.getframerate()
        samples = resample(read_mono(path), src_rate)
        start = int(offset * SAMPLE_RATE)
        for i, sample in enumerate(samples):
            idx = start + i
            if idx >= total:
                break
            mix[idx] += sample / 32768.0

    peak = max(abs(v) for v in mix) or 1.0
    gain = PEAK / peak
    pcm = array("h", [0]) * total
    for i, value in enumerate(mix):
        # Gentle fade-in / fade-out to avoid clicks at the edges.
        fade = 1.0
        if i < int(0.12 * SAMPLE_RATE):
            fade = i / (0.12 * SAMPLE_RATE)
        tail = total - i
        if tail < int(0.35 * SAMPLE_RATE):
            fade = min(fade, tail / (0.35 * SAMPLE_RATE))
        pcm[i] = int(max(-1.0, min(1.0, value * gain * fade)) * 32767)

    if sys.byteorder == "big":
        pcm.byteswap()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm.tobytes())
    print(f"wrote {out_path} ({TOTAL_SECONDS:.1f}s)")


if __name__ == "__main__":
    main()
