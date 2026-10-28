# EMBERWAKE v07：指定Naturalを締めへ追加

正式Cubism Coreで指定Revenant_Naturalを実ロードし、v06完成VOICEVOX声masterのRMSから口を動かす。瞬き・控えめな頭/呼吸は指定値による演出で、カメラ追跡・人間の演技収録・VTS物理再現ではない。旧v05/v06/旧127・140WT/モデル・SDK原本は保持する。

## 変更範囲

全18194f/30fpsのうち、締め[17509,18194)の685f＝22.833333秒だけを新EffectCraft原本で再制作。左580pxをモデル専用面、右を実ゲーム、下を概要欄案内・刻印図・クレジットに分ける。冒頭と5コースの6章picture、完成声/BGMmasterはSHA一致で新F領域へコピーし、FilmCraft2原本の全8素材を同領域へ再リンクした。

- F制作領域：F:/Videos/ProjectP-EMBERWAKE-Longform-2026-10-28/demo07-natural
- PhotoCraft：projects/demo07-model-close.pcraft（実Core合成keyframeを保存・再open-render）。
- EffectCraft：projects/demo07-close.ecproj（全685fの透過Core動画を合成）。
- FilmCraft：projects/emberwake-v07-{voice,bgm}.fcproj（8online/欠落0）。同一映像をvoice原本からnative全体書出しし、両最終音声はv06 AACをcopyして対応付ける。BGM原本の全編再exportを実施したという意味ではない。

## Coreと動作の根拠

Issue97の600f実装と同一SHAのAvatarCore.javaを再利用しMIT noticeを保持。指定Natural MOC SHAは6b63e0fc…ad03e、正式Core06.00.0513を使用。685姿勢を毎frame Core.updateし685PNGはすべて固有。全frame頭部alpha境界を検査し端接触0。v06声だけを1600sample/frameでRMS測定し、無声257fは口0。瞬きの閉眼5f、口/目の同姿勢・入力だけを変えた診断で実pixel変化も確認した。

原本/atlasはFのprivate/modelに独立コピー、Coreは既存インストールを参照する。モデル/SDKバイナリやraw PNGはGit/NASへ配布しない。

- [Core実行](qa/demo07/core-render.json)
- [RMS/姿勢685frame](source/demo07/model-cues.json)
- [PNG685SHAと実変形](qa/demo07/model-motion-proof.json)
- [全frame頭部余白](qa/demo07/model-alpha-bounds.json)
- [renderer再利用/限定preview独立目視](qa/demo07/renderer-reuse.json)
- [最終実画像](qa/demo07/final-images.json)

## 最終動画と再現

[index-demo07.html](index-demo07.html) と [公開準備metadata](metadata/youtube-demo07.json) に完成2MP4/NAS/SHAを対応付ける。NASは制作日/エンバーウェイク/時刻_芯石5コース_モデル追加_v07/へ完成MP4だけを保存。v06の正読3句・他73句は維持し、全AAC packetのpayload/PTS/DTS/duration/size一致を根拠に76句の検査を新finalへ継承する。全AVdecode・最終LUFS/TP・NAS直接decode/SHAも別に確認する。

再現はsource/demo07のmodel→model-proof→compose(build/preview/render)→assemble(build/render/mux)→qa→deliver→check-delivery。版付き成果がある場合は保全して別attemptへ進め、旧原本へ上書きしない。Core/MOC/atlasを別モデル・静止画で代用しない。初回EC buildが透過MOV完成前に実行され依存importで失敗した原本はFqaへ保全、以後は依存完了guardを追加し、Coreを再起動していない。

静止画像と連続frame sheetの目視、技術検査、Rootのメディア受入、ownerの創作採用、投稿後の成果は別である。全編通し視聴・主観試聴は未実施。共有GUI/lease/公開操作0。local finalはRoot次公開用に保持する。

完成2本の全AVdecode0、全AAC28430packetの時刻含むv06同一、最終連続画像、NAS2SHA/直接decode0を確認した。NAS：2026-10-29/エンバーウェイク/0503_芯石5コース_モデル追加_v07/。Coreのgeometry/UV/maskを既存CPU三角形サンプラーで描画し、VTSのGPU/physics描画を再現したとは主張しない。
