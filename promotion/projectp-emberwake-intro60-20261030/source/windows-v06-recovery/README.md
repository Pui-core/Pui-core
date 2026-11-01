# v06 Windows復旧

Linuxの旧case・140f partial・旧ログを保全し、ownerの単独writer移管でWindows私有case `C:/Users/pui/private-use/emberwake-video156-20261101/attempt01/` へ復旧した。元head d4d05aba。編集内容・r6音声・65秒構成は保持。

EffectCraft0.14.0 `--gpu` / RTX4070SUPER Vulkan / Qt offscreen。4–6秒60fは4.56秒、全1950fは141.69秒で完走。CPU2/softwareGL/同じWSL条件の再試行ではない。FilmCraft0.10.0はnative CPU export、offlineMediaなし。PhotoCraftは旧v05カバーを保持し、別v06 packaging原本へresave/reopen/renderした（画像の刷新ではない）。

`stage.py` は新規attempt01だけを作り、53EC参照をexact valueでWindowsへ再リンク、r6 WAV/f32とSHA固定コピーする。既存attemptへ再実行しない。私有caseへ本ディレクトリのスクリプトをコピーして使う。`prepare-qa.py` はcase内だけのconfig/background/Windows絶対パス検査/ffmpeg metadata相対出力を適応する。元Linux scriptは保持。

`run.py` / `invoke.py` はCREATE_NO_WINDOW・Qt offscreen・所有Windows Job・timeoutと終了票で実行する。Jobにはkill-on-closeを設定。共有入力・clipboard・foreground操作0。呼出し例：`python run.py ec-help "C:/Program Files/EffectCraft/effectcraft-cli.exe" --help`。全renderは180秒上限で完走した。CLI argsと詳細原票は私有case `qa/`。

EC保存後のpicture/source bindingを`export.mjs`で固定し、元`v06-render.mjs --export-only`で2音版を作る。初回はPython stdin既定cp932による日本語metadata破損を検出。失敗MP4をqaへ保全しUTF-8へ修正、`resume-export.mjs`で既存の正常BGM native exportを再muxし、残るvoice版を生成。失敗版は最終bindingに含めない。

`v06-qa.mjs` / `v06-lamp-qa.mjs`（case内適応版）と`channels.mjs`を実行。全AV decode・65.002秒・1950f・1080x1920/30fps/H264/AAC・全decoded映像一致・53+4 unique依存欠損0。L/R別21句頭尾の相関min0.97917177、lag0、clip0。点灯523f、字幕layer523–567f、見え始め524f、終端遷移567f、有声17.5003–18.8177秒。

最終BGM SHA256 `9b2f622d74bb91bd8e40c3f28c9ca13aff8adce4e6e0cfb476f5518e3146fc06`、voice SHA256 `e579458970b8b04579206c5f5304632b3d476bb36beaebdd0cdc80bd7fdabf5c`。exact Windows path・native3Craft原本・依存SHA・数値QAは`qa/windows-v06-recovery-delivery-manifest.json`。実動画は私有case `attempt01/videos/`。投稿文は既存 `source/posting.json`。

全体シート・点灯字幕境界・53–56秒追従stripは目視した。全編実時間視聴・主観実聴・実モバイル・独立cross・公開受入は未確認。逆engineレビューを実施済みへ変更しない。TikTok native曲未選定、YouTubeへ流用0。NAS未書込、Rootの照合後工程。Draft維持・投稿/予約/lease/cron変更0。
