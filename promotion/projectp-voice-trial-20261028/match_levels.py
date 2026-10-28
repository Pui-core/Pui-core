"""Match private A/B loudness with constant gain, retaining duration and delivery."""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import subprocess


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--clone", type=Path, required=True)
    parser.add_argument("--voicevox", type=Path, required=True)
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument("--ffmpeg", default="ffmpeg")
    parser.add_argument("--clone-name", default="本人声クローン_v01.wav")
    parser.add_argument("--voicevox-name", default="VOICEVOX比較_v01.wav")
    args = parser.parse_args()
    for name in (args.clone_name, args.voicevox_name):
        if (Path(name).name != name or Path(name).suffix.lower() != ".wav"
                or any(c in name for c in '/\\:*?"<>|')):
            parser.error("Comparison names must be plain WAV file names")
    if args.clone_name.casefold() == args.voicevox_name.casefold():
        parser.error("Comparison file names must differ")
    dest = args.out_dir.resolve()
    if dest.is_relative_to(Path(__file__).resolve().parents[2]):
        parser.error("Audio outputs must remain outside the Git repository")
    if (dest / "comparison.json").exists():
        parser.error("Refusing to overwrite an existing comparison record")
    os.umask(0o077)
    dest.mkdir(parents=True, exist_ok=True, mode=0o700)

    def native(p):
        p = str(p.resolve())
        if args.ffmpeg.lower().endswith(".exe"):
            p = subprocess.check_output(["wslpath", "-w", p], text=True).strip()
        return p

    def run(arguments):
        return subprocess.run([args.ffmpeg, *arguments], capture_output=True,
                              text=True, check=True, timeout=30)

    def measure(source):
        result = run(["-hide_banner", "-i", native(source), "-af",
                      "loudnorm=I=-20:TP=-1:LRA=11:print_format=json", "-f", "null", "-"])
        matches = re.findall(r'\{\s*"input_i"[\s\S]*?\}', result.stderr)
        return json.loads(matches[-1])

    files = [{"input": args.clone.resolve(strict=True), "name": args.clone_name},
             {"input": args.voicevox.resolve(strict=True), "name": args.voicevox_name}]
    for f in files:
        if (dest / f["name"]).exists():
            parser.error("Refusing to overwrite an existing comparison")
        f["before"] = measure(f["input"])
    target = math.floor(min(-20, *(-1 - (float(f["before"]["input_tp"]) -
                                                float(f["before"]["input_i"])) for f in files)) * 10) / 10
    for f in files:
        gain = target - float(f["before"]["input_i"])
        output = dest / f["name"]
        run(["-hide_banner", "-loglevel", "error", "-n", "-i", native(f["input"]),
             "-af", f"volume={gain:.6f}dB", "-ac", "1", "-ar", "24000",
             "-c:a", "pcm_s16le", native(output)])
        f["gainDb"] = gain
        f["after"] = measure(output)
        run(["-hide_banner", "-loglevel", "error", "-i", native(output), "-f", "null", "-"])
        f["sha256"] = hashlib.sha256(output.read_bytes()).hexdigest()
        del f["input"]
    result = {"targetLufs": target, "method": "constant gain only; no time/pitch/fade/trim changes",
              "directListening": False, "files": files}
    (dest / "comparison.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
