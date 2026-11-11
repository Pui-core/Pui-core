"""Supplementary local ASR of the final BGM MP4; this is not subjective listening."""
import os
os.environ.update({'CUDA_VISIBLE_DEVICES': '', 'HF_HUB_OFFLINE': '1',
                   'HF_HUB_DISABLE_TELEMETRY': '1', 'OMP_NUM_THREADS': '4'})
import hashlib
import json
import sys
import time
from pathlib import Path
import numpy as np
from scipy.signal import resample_poly
from faster_whisper import WhisperModel

root = Path(sys.argv[1])
source = root / 'videos/truthorlie-real-v9-bgm.mp4'
snapshots = Path('/home/pui/.cache/huggingface/hub/models--Systran--faster-whisper-medium/snapshots')
model_path = next(snapshots.iterdir())
started = time.monotonic()
model = WhisperModel(str(model_path), device='cpu', compute_type='int8',
                     cpu_threads=4, num_workers=1, local_files_only=True)
pcm = np.fromfile(root / 'qa/pcm-real-v9/actual-bgm.f32', dtype=np.float32)
audio = resample_poly(pcm, 1, 3).astype(np.float32)
segments, _ = model.transcribe(audio, language='ja', beam_size=5,
                              vad_filter=False, condition_on_previous_text=False)
rows = [{'start': s.start, 'end': s.end, 'text': s.text,
         'avgLogprob': s.avg_logprob} for s in segments]
result = {'kind': 'Supplementary offline ASR, not direct listening',
          'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'modelPath': str(model_path), 'fullText': ''.join(s['text'] for s in rows),
          'segments': rows, 'elapsedSeconds': time.monotonic() - started,
          'noExternalUpload': True}
(root / 'qa/real-v9-final-bgm-asr.json').write_text(
    json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False), flush=True)
