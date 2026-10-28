# 本人声ナレーションの私的CPU試験

管理 [#137](https://github.com/Pui-core/-/issues/137)、親 [#93](https://github.com/Pui-core/-/issues/93) / [#106](https://github.com/Pui-core/-/issues/106)。2026-10-28のowner指示に基づく小規模試験の再現コードと非秘密metadataを保存する。完成動画・公開用音声の納品場所ではない。

本人の未MIX録音8秒から、公式Qwen3-TTS 0.6B Baseの話者特徴だけを使い、4.72秒の台詞を生成した。同文のVOICEVOX比較音声は3.616秒。直接試聴・本人らしさ・自然さ・集客効果は未評価で、動画への採用・公開はしていない。

## 保存範囲

- Gitにはコード、公式モデルrevision・依存・ライセンス参照、数値・出力hash・補助ASR・比較条件だけを保存する。
- 生音、参照・生成WAV、モデル、個人的歌詞、録音全文、認証情報は保存しない。参照WAVは実行者がCLIで指定する。
- 原音と試聴用WAVはprivateな制作素材として別保管。NASのvideosへ音源は保存しない。
- VOICEVOX音声は比較だけに使用し、クローン参照・学習・音響モデル生成には使っていない。

## 独立環境と再現

LinuxのPython3.14.4、CPU版PyTorch2.9.1、CPU4スレッドで実生成を確認した。モデル取得・ロード・生成94.92秒。RAM available約11GiB、ディスク空き348GiBを開始前に確認。既存GPU・DAW・ComfyUI・共有venvは変更しない。

以下の例のパスは利用者が所有するprivateな保存先に置き換える。出力・cacheをこのGitリポジトリ内に置く指定はCLIが拒否する。既存出力は上書きしない。

```bash
trial_root="$HOME/private-voice-trial"
uv venv --python /usr/bin/python3 "$trial_root/venv"
UV_CACHE_DIR="$trial_root/uv-cache" uv pip install --python "$trial_root/venv/bin/python" \
  torch==2.9.1 torchaudio==2.9.1 --index-url https://download.pytorch.org/whl/cpu
UV_CACHE_DIR="$trial_root/uv-cache" uv pip install --python "$trial_root/venv/bin/python" \
  -r requirements-runtime.txt
UV_CACHE_DIR="$trial_root/uv-cache" uv pip install --python "$trial_root/venv/bin/python" \
  --no-deps qwen-tts==0.1.1
timeout --signal=TERM --kill-after=15s 1200s "$trial_root/venv/bin/python" reproduce.py \
  --reference /absolute/private/owner-reference.wav \
  --out-dir "$trial_root/output-01" --model-cache "$trial_root/hf-cache"
```

モデルは公式revisionに固定し、必要な11ファイル計約2.51GBだけを取得する。音声はローカルで読み取り、外部音声APIは使わない。取得済みなら `--offline` を追加できる。学習やGPU推論は行わない。Web UIを起動しないためgradioは省略、未使用のSoX実行ファイルとflash-attnの警告は残るが、今回の直接API生成は正常終了した。

参照は本人の歌唱・ラップ原音で、自然な話し声の最適な参照区間とは未判定。文字起こしを推定して与えず `x_vector_only_mode=True` を使った。最大110 codec token、seed20261028。出力の自然終了を保持し、目安尺へ引き伸ばしていない。

## 同文A/Bの条件

両方の台詞は「このゲーム、あなたなら右と左、どっちを選ぶ？」。VOICEVOXは青山龍星ノーマル、0.25.1、speedScale1.12、intonationScale1.12、prePhonemeLength0.035、postPhonemeLength0.10、24kHz/mono。既存エンジンで生成し、エンジンを起動・停止していない。

```bash
"$trial_root/venv/bin/python" match_levels.py \
  --clone /absolute/private/clone-raw.wav --voicevox /absolute/private/voicevox-raw.wav \
  --out-dir "$trial_root/comparison-01" --ffmpeg /absolute/path/to/ffmpeg
```

両方を共通−20LUFS-Iへ定数ゲインのみで調整。時間伸縮・頭尾カット・無音追加・EQ・ノイズ除去・圧縮・フェードは加えない。速度・間・抑揚が異なるため、声色だけを完全に分離した実験ではない。実測とhashは [trial-result.json](trial-result.json)。全デコード、finite、F側コピー前後SHA、Windows存在を確認した。既存Whisper-smallのオフライン補助ASRは両方とも句読点を除く全文を認識した。これらを直接試聴や本人らしさの確認としない。

一般化したCLIを実素材・取得済みモデル・offlineで再実行し、元の生成WAVとSHAが完全一致した（54.70秒、正常終了）。比較CLIの再実行でもA/Bの最終SHAが両方一致した。検証用の音声・絶対パスをGitへ移していない。確認済み環境の全依存は `requirements-verified.txt` に記録し、最低限の直接API生成の導入手順とは区別する。

## 公式ライセンス

- [Qwen公式実装](https://github.com/QwenLM/Qwen3-TTS) / [公式0.6B Baseモデル](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-0.6B-Base)：Apache-2.0、日本語・参照音声からの声クローンに対応。モデルの商用利用を認めるライセンスと、本人声の採用・公開判断は区別する。今回の参照はownerが再現試験を許可した本人録音のみ。
- 比較音声のcreditは `VOICEVOX:青山龍星`。[VOICEVOX規約](https://voicevox.hiroshiba.jp/term/) と [VirVox公式話者規約](https://www.virvoxproject.com/voicevoxの利用規約) を2026-10-28に確認。青山龍星は企業・個人事業主や企業契約個人の利用に事前申請が必要。私用比較から、本番の事業利用や公開許諾済みへ読み替えない。

この記録の完了は、視聴維持・登録者・フォロワー目標の達成や声の採用を意味しない。
