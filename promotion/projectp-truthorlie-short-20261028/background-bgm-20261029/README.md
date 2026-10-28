# 嘘か誠か v11：背景処理のBGM確認版

受入済み143のv10（19.2秒・576フレーム）へ、Cipher / Kevin MacLeodのBGMを追加した確認版。実画面・正式Coreの末尾72フレーム・声・SE・尺を保持し、映像はpacket-copyした。TikTok144のnative音源選択や投稿とは別の成果物で、同タブと旧133は操作しない。

最終動画SHA：`280cf05c0d3a0b9f7b10d7d84ef0bccfbf21125f15f1969035e97f65601a2289`。
F制作stage：`F:\Videos\ProjectP-TruthOrLie-Short-2026-10-28\background-bgm-20261029`。
NAS：`\\100.105.2.75\private\work\videos\2026-10-29\嘘か誠か\0801_投票と得点_声優先BGM_v11\BGM確認版.mp4`。
Rootが転送・SHA一致・NASからの直接全AV decode0を確認した。5,949,676bytes、当該フォルダーは完成動画1本だけ。公開/予約操作は0。

## 画面を奪わない制作経路

ownerの「バックグラウンド」「マウスを奪わない」を適用した。Native Craftのexeはconsole/Rust実体まで静的に見たが、noWindow/noFocusの入口コードを特定できなかったため、helpも含め一回も起動していない。既存143の3Craft原本・素材は保持した。

`projectp-video/references/production.md` の音だけ修正に従い、Rootが認めたFFmpegの背景処理を使用した。Linux PATHに無かったため、[FFmpeg公式download](https://ffmpeg.org/download.html)から案内される[BtbN Linux build](https://github.com/BtbN/FFmpeg-Builds/releases)をprivate領域へ取得し、公開asset SHAと照合。Linux ELFだけを使用し、全childはnice10・ionice idle・FFmpeg threads2。Windows exe・GUI・focus・マウス/キー・lease・投稿の操作は0。ツールをシステムへ導入したり、他のjobを停止したりしていない。

新stage内に既知schema15のFilmCraft JSONをofflineで複製し、v10 ProRes画と原声・SE・BGMの全依存をそろえた。新A3トラックには処理済みBGMを置く。これはoffline準備原本で、**Nativeでの再読込・保存・描画は未実施**。FFmpegの実書出しと混同しない。

NAS転送は制作workerとは別にRootが行った。静的確認したWSLのnoPTY/pipes経路で背景PowerShellを起動し、純粋なfile copy/hashとCreateNoWindowのWindows decoderを使用した。**工程全体のWindows exeが0という意味ではない**。Root実測は親console前後0、foreground HWND前後同一、入力・focus/前面化write0。`qa/nas-delivery.json` と非秘密の `source/deliver-background.ps1` を保存した。

## 音の変更

[正式曲ページ](https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1100844)、ISRC `USUAN1100844`、150BPMの同一録音を、134の取得済みSHA `d3d0614535a61d748e2fd8d5117fc4d781022a7624794802a2462d8af3fdd522` と照合した。[CC BY4.0](https://creativecommons.org/licenses/by/4.0/) の商用share/adaptと、[legalcode](https://creativecommons.org/licenses/by/4.0/legalcode.en)のworldwide・映像同期の範囲を確認。クレジットと変更表示は[caption](metadata/caption.txt)に保存する。今回の公式曲indexはloading shell、remote endpointはtimeoutだったため、新たに曲メタデータを取得できたとはしない。既存134とRoot145の正規録音・ISRC確認を引き継ぐ。

- 原曲0.824–20.024秒の19.2秒、150BPMの48拍。旧134のtrim/声連動sidechain/fadeを保持し、gapsで旧bed+6.02dBにした。
- 初稿でtitle句の声/BGM差が0.54dBと近かったため、声を変えず、各句の実有声範囲へ追加BGM duckを入れた。語頭20ms前までにduckが着地し、実語尾+40msまで保持して180msで戻す。最終の声/BGM RMS差は**12.45–13.18dB**。初稿はstageのhistory/firstpassに保全した。
- 原声・SEのamplitudeと相対時刻は保持、master gain1、PCM合成差0。曲の導入fadeは0–0.03秒、終了fadeは18.8–19.2秒で、語頭0.192秒より前・最後の語尾17.943秒より後に分離した。

## 検証範囲

- 最終H.264/AAC、1080×1920、30fps、19.2秒・576f、48kHz stereo。全AV decode成功。
- 元v10と全576 packetのpayload hash・PTS/DTS秒・duration・flagsが一致。container timebaseは変わるため、整数tickをそのまま比較しない。末尾Core72fも同一で、既存v10の限定画像レビューを継続できる。
- 6句の最終AACの頭/中/尾と実mixを照合し、相関最小0.99926、lag0。最終−24.3 LUFS、true peak−1.7 dBFS。
- 原曲の正のRMS attackを10ms刻みで測り、冒頭grid0.824秒に対してattack0.825秒。固定150BPM gridの48点中40点が検出attack±60ms内、全点の平均絶対差38.1ms。すべての拍が完全一致する証明や直接聴感ではない。

全編の直接視聴/試聴・ownerの創作採用・成長への効果は未確認。native TikTok sound ID選択/JP曲別実表示/投稿を済ませたとはしない。動画の実フレーム、音、元Native原本の受入と今回の背景確認版の検証は区別する。

## 再現用の原本

`source/produce.mjs` が新stage作成・入力SHA照合・BGM-only duck・mix・映像copy・offline FilmCraft準備、`source/verify.mjs` がpacket/全decode/PCM/AAC/拍の検証。`source/refine-music.mjs` は初稿のみに適用する一回修正の記録で、完成版へ再実行しない。既存出力とlockがあれば無断上書きせず停止する。QAには小さな非秘密の集約JSONだけをGit保存し、動画/音声/モデルSDK・MOC/画像のraw UIは含めない。

Linuxツールは`qa/linux-tool-provenance.json`のURL/SHAと、private `/home/pui/tmp/projectp145-tools/ffmpeg-n9.0-latest-linux64-gpl-shared-9.0`を使用。`source/get-linux-tools.mjs`で同一artifactだけを取得・検証できる。再制作は別のF専用stageを指定して行い、現在の完成stage・共有GUI・未マージWTへ上書きしない。

[Rootの受入](https://github.com/Pui-core/-/issues/145#issuecomment-6483009268)とcanonical納品票のコピーは `qa/root-delivery.json`。本件145の背景BGM確認版は完成、144のnative投稿とは完了を分ける。
