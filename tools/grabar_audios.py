#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
grabar_audios.py · graba con voces neuronales chinas (edge-tts) los audios
de la portada: los cuatro tonos (妈 麻 马 骂) y las palabras del día
(js/palabras.js).

    pip install edge-tts
    python3 tools/grabar_audios.py            # graba lo que falte
    python3 tools/grabar_audios.py --force    # lo regraba todo

Deja los MP3 en audio/ y el índice en audio/manifest.js. La página lo
detecta sola; si no existe, usa la voz del navegador.
"""
import argparse
import asyncio
import hashlib
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
AUDIO = os.path.join(ROOT, "audio")

# Mismas voces que las apps HSK1 y HSK2. Se pueden cambiar aquí.
VOZ_TONOS = "zh-CN-XiaoxiaoNeural"
VOCES_PALABRAS = ["zh-CN-XiaoxiaoNeural", "zh-CN-YunxiNeural"]
TONOS = [("妈", "t1"), ("麻", "t2"), ("马", "t3"), ("骂", "t4")]


def palabras():
    src = io.open(os.path.join(ROOT, "js", "palabras.js"), encoding="utf-8").read()
    data = src[src.index("=") + 1:].strip().rstrip(";")
    return [w[0] for w in json.loads(data)]


async def synth(text, voice, rate):
    import edge_tts
    last = None
    for intento in range(4):
        try:
            chunks = []
            async for item in edge_tts.Communicate(text, voice, rate=rate).stream():
                if item["type"] == "audio":
                    chunks.append(item["data"])
            if chunks:
                return b"".join(chunks)
        except Exception as exc:                       # noqa: BLE001
            last = exc
        await asyncio.sleep(1.5 * (intento + 1))
    raise RuntimeError("no se pudo grabar %r: %s" % (text, last))


async def main_async(force):
    os.makedirs(AUDIO, exist_ok=True)
    trabajos = [(zh, fid + ".mp3", VOZ_TONOS, "-25%") for zh, fid in TONOS]
    for i, zh in enumerate(palabras()):
        fid = "w-" + hashlib.sha1(zh.encode("utf-8")).hexdigest()[:10] + ".mp3"
        trabajos.append((zh, fid, VOCES_PALABRAS[i % 2], "-15%"))
    manifest, fallos = {}, 0
    for zh, fname, voz, rate in trabajos:
        path = os.path.join(AUDIO, fname)
        if force or not os.path.exists(path):
            try:
                audio = await synth(zh, voz, rate)
            except RuntimeError as exc:
                print("  ERROR", exc)
                fallos += 1
                continue
            with open(path, "wb") as fh:
                fh.write(audio)
            print("  grabado  %-6s %s" % (zh, fname))
        manifest[zh] = fname
    with io.open(os.path.join(AUDIO, "manifest.js"), "w", encoding="utf-8") as fh:
        fh.write("/* Generado por tools/grabar_audios.py */\nwindow.CHINO_AUDIO = ")
        json.dump(manifest, fh, ensure_ascii=False)
        fh.write(";\n")
    print("\nListo: %d audios en audio/ (%d fallos)" % (len(manifest), fallos))
    return 1 if fallos else 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="regrabar aunque ya existan")
    args = ap.parse_args()
    try:
        import edge_tts                                # noqa: F401
    except ImportError:
        print("Falta edge-tts:  pip install edge-tts", file=sys.stderr)
        return 1
    return asyncio.run(main_async(args.force))


if __name__ == "__main__":
    sys.exit(main())
