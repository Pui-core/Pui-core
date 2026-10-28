"""One private, CPU-only owner-voice trial; no training or external audio API."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import time

MODEL_ID = "Qwen/Qwen3-TTS-12Hz-0.6B-Base"
MODEL_REVISION = "5d83992436eae1d760afd27aff78a71d676296fc"
TEXT = "このゲーム、あなたなら右と左、どっちを選ぶ？"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reference", type=Path, required=True)
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument("--model-cache", type=Path, required=True)
    parser.add_argument("--offline", action="store_true")
    parser.add_argument("--mode", choices=("xvector", "icl"), default="xvector")
    parser.add_argument("--reference-text-file", type=Path)
    parser.add_argument("--subtalker-sampling", action="store_true")
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    reference = args.reference.resolve(strict=True)
    out_dir = args.out_dir.resolve()
    cache = args.model_cache.resolve()
    for destination in (out_dir, cache):
        if destination.is_relative_to(repo):
            parser.error("Output and model cache must be outside the Git repository")
    if not reference.is_file():
        parser.error("Reference must be an explicitly supplied local audio file")
    reference_text = None
    if args.mode == "icl":
        if args.reference_text_file is None:
            parser.error("ICL requires the matching private reference transcript file")
        transcript_path = args.reference_text_file.resolve(strict=True)
        if transcript_path.is_relative_to(repo):
            parser.error("Private reference transcripts must remain outside Git")
        reference_text = transcript_path.read_text(encoding="utf-8").strip()
        if not reference_text or len(reference_text) > 800:
            parser.error("Supply a short, nonempty matching reference transcript")
    elif args.reference_text_file is not None:
        parser.error("Reference transcript is only used in ICL mode")
    output = out_dir / ("owner-voice-clone-experiment-v2-icl.wav" if args.mode == "icl"
                        else "owner-voice-clone-experiment-v1.wav")
    receipt = out_dir / "trial-result.json"
    if output.exists() or receipt.exists():
        parser.error("Refusing to overwrite a previous trial")

    os.umask(0o077)
    out_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    cache.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.environ.update({"CUDA_VISIBLE_DEVICES": "", "HF_HOME": str(cache),
                       "HF_HUB_DISABLE_TELEMETRY": "1", "DO_NOT_TRACK": "1",
                       "OMP_NUM_THREADS": "4", "MKL_NUM_THREADS": "4",
                       "NUMBA_NUM_THREADS": "4", "TOKENIZERS_PARALLELISM": "false"})
    if args.offline:
        os.environ["HF_HUB_OFFLINE"] = "1"
    started = time.monotonic()
    import numpy as np
    import soundfile as sf
    import torch
    from huggingface_hub import snapshot_download
    from qwen_tts import Qwen3TTSModel

    torch.set_num_threads(4)
    torch.set_num_interop_threads(1)
    torch.manual_seed(20261028)
    if torch.cuda.is_available():
        raise RuntimeError("This trial must remain CPU-only")
    audio, sample_rate = sf.read(reference, dtype="float32")
    if audio.ndim != 1 or not np.isfinite(audio).all():
        raise ValueError("Supply a finite mono reference WAV")
    if not 3 <= len(audio) / sample_rate <= 15:
        raise ValueError("Supply only a short 3–15 second owner reference")
    snapshot = snapshot_download(
        MODEL_ID, revision=MODEL_REVISION, local_files_only=args.offline,
        allow_patterns=["*.json", "*.txt", "model.safetensors",
                        "speech_tokenizer/*.json", "speech_tokenizer/model.safetensors"],
        max_workers=2,
    )
    model = Qwen3TTSModel.from_pretrained(
        snapshot, device_map="cpu", dtype=torch.float32,
        attn_implementation="eager", local_files_only=True,
    )
    with torch.inference_mode():
        waves, rate = model.generate_voice_clone(
            text=TEXT, language="Japanese", ref_audio=(audio, sample_rate),
            ref_text=reference_text, x_vector_only_mode=(args.mode == "xvector"),
            max_new_tokens=110, do_sample=True,
            top_k=50, top_p=1.0, temperature=0.8,
            subtalker_dosample=args.subtalker_sampling,
        )
    wave = np.asarray(waves[0], dtype=np.float32)
    if not len(wave) or not np.isfinite(wave).all():
        raise RuntimeError("Generated audio is empty or nonfinite")
    sf.write(output, wave, rate, subtype="PCM_16")
    decoded, decoded_rate = sf.read(output, dtype="float32")
    db = lambda value: float(20 * np.log10(max(float(value), 1e-12)))
    result = {
        "status": "private-experiment-not-adopted-or-published", "modelId": MODEL_ID,
        "modelRevision": MODEL_REVISION, "license": "Apache-2.0", "device": "cpu",
        "pid": os.getpid(), "torchVersion": torch.__version__, "text": TEXT,
        "mode": args.mode, "training": False,
        "xVectorOnlyMode": args.mode == "xvector",
        "referenceTranscriptSupplied": reference_text is not None,
        "referenceTranscriptSha256": (hashlib.sha256(reference_text.encode()).hexdigest()
                                      if reference_text is not None else None),
        "subtalkerSampling": args.subtalker_sampling,
        "referenceDurationSeconds": len(audio) / sample_rate,
        "referenceSha256": hashlib.sha256(reference.read_bytes()).hexdigest(),
        "outputSha256": hashlib.sha256(output.read_bytes()).hexdigest(),
        "sampleRate": decoded_rate, "frames": len(decoded),
        "durationSeconds": len(decoded) / decoded_rate,
        "peakDbfs": db(np.max(np.abs(decoded))),
        "rmsDbfs": db(np.sqrt(np.mean(decoded * decoded))),
        "head100msPeakDbfs": db(np.max(np.abs(decoded[:int(rate * .1)]))),
        "tail100msPeakDbfs": db(np.max(np.abs(decoded[-int(rate * .1):]))),
        "allDecoded": True, "finite": bool(np.isfinite(decoded).all()),
        "directListening": False, "speakerSimilarityAssessed": False,
        "voicevoxUsedForTrainingOrReference": False,
        "elapsedSeconds": round(time.monotonic() - started, 2),
    }
    receipt.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(result, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
