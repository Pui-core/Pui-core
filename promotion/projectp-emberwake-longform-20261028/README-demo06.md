# EMBERWAKE v06：鐘楼の読みを３句修正

対象はcourse1-15 / course2-01 / course5-12。表示の「鐘楼」を保ち、音声queryInputは「しょうろう」へ指定した。独立確認でショ(sh,o)→オ(o)→ロ(r,o)→オ(o)の４moraと全設定/実WAV SHA/旧cue枠内を確認した。v05/旧127WT/NAS/原本は保全している。

## 完成動画

- BGM入り：`\\100.105.2.75\private\work\videos\2026-10-29\エンバーウェイク\0057_芯石5コース_読み修正_v06\BGM版.mp4`
  - SHA256 `ff327308346a0c1b7f7b14f122a2adf443351a9882ce9ed063c7a5315f7d778e`。NAS直接全AV decode0、元ファイル不変。
- 声のみ：`\\100.105.2.75\private\work\videos\2026-10-29\エンバーウェイク\0057_芯石5コース_読み修正_v06\声のみ版.mp4`
  - SHA256 `03af92e6745333dbba17c0c158bcffa91c0219db186f9b74a4712e13fda8c612`。NAS直接全AV decode0、元ファイル不変。

２本とも606.466667秒・18194f。映像packetはpayload/PTS/DTS/duration/sizeまで全18194個が元v05と一致。新capture/映像再描画は0。masterは他73句および３cue枠以外のPCMがbyte一致、最終AACは76句の頭/中/尾を新PCMと照合した。元PCM一致と正読の４mora確認は別の検査である。

## 原本・再現・公開準備

- 再生入口：[index-demo06.html](index-demo06.html)。F制作領域：`/mnt/f/Videos/ProjectP-EMBERWAKE-Longform-2026-10-28/demo06-reading-fix`。
- [新公開準備metadata](metadata/youtube-demo06.json)、Fの`public-ready-demo06/`。タイトル/説明/章/表紙/creditはv05から変更せず、新finalSHA/NASを対応付けた。Rootのcanonical準備票/公開GUIはRoot専管。
- 再現：`source/demo06/generate.mjs`→`master.mjs`→`export.mjs voice|bgm`→`verify-audio.mjs voice|bgm`→`complete.mjs`。生成側`demo05/reading.mjs`と`voices.mjs`は表示text/spokenTextを分け、旧３誤読cacheを拒否し、他73のcacheを再利用できる。旧WAVを上書きしない。
- [読みと元73WAV](qa/demo06/reading-generation.json)、[masterのbyte照合](qa/demo06/master-binding.json)、[声AAC](qa/demo06/voice-audio-qa.json)、[BGM版AAC](qa/demo06/bgm-audio-qa.json)、[映像継承](qa/demo06/visual-continuity.json)、[NAS根拠](qa/demo06/nas-final-binding.json)。
- 新FilmCraft２原本は新master参照へ更新し、８素材online。旧F原本の映像素材を参照し続けるので、v05制作領域も保持する。Rootアップロード用のlocalfinal２本を削除しない。

全編通し視聴・主観試聴、公開後の成果は未実施。新規公開/GUI/lease操作は0。
