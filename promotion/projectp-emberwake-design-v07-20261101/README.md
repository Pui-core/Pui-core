# EMBERWAKE：落下と中継点の新収録・v07代表カット

同じ管理Issue [Pui-core/-#156](https://github.com/Pui-core/-/issues/156) の創作差戻しに対する、**16秒の部分稿 v07-v2**。新しい第2話収録で「落ちたら、思い出も消える？」を問い、別の中継点からの落下・復帰と、クリアしない前後の「失った記憶 1 / 15」を見せる。65秒完成版、創作採用、公開受入ではない。

owner指摘「ほとんど前と一緒」に対し、旧v05/v06の短押し／長押し・点灯同期修正を再配列せず、通常入力で新しいゲーム映像を収録した。旧第1話の落下rawや、落下の無い旧第2話rawを新しい比較へ転用していない。旧PR95・v05/v06・NAS・partial・原本・過去レビューは保持し、旧技術APPROVEをこの創作の採用へ転用しない。

## 現在の実物

私有caseは `C:/Users/pui/private-use/emberwake-video156-20261101/v07/`。

| 版 | case内パス | bytes | SHA-256 |
|---|---|---:|---|
| owner提示済み初稿・保持 | `videos/emberwake-v07-checkpoint-preview16.mp4` | 2357801 | `713209531a563549132bd2ab97ed4203fa3527f07908f657958a138d6171c524` |
| 主人公追従修正版 | `videos/emberwake-v07-checkpoint-preview16-v2.mp4` | 2776122 | `5cadde6d29a96d80d4c58add22242384d413ec0bbe6802725aca3413d717c3ce` |

両版1080×1920 / 30fps / 480f / 16.000秒 / H.264＋AAC stereo。初稿のリンク先を変更せず、v2は別ファイル・別native原本に保存した。v2では最初の7秒だけEffectCraftのanchorを210キーで追従させ、落下中の編集cropによる右端の見切れを解消。問い・比較・ゲーム映像の時間順序・音配置は同一。

新収録の全体は `episode2-capture01/capture.avi`（38秒、1140f、1440×810、MJPEG＋PCM）。ゲーム製品の参照元は `\\wsl.localhost\Ubuntu\home\pui\tmp\projectp112-capture-20261026\product`、0.12.0 / Source `71584a6bd0c8852885157de71032fd9252e7a04c` / `res://scenes/campaign.tscn`。現origin/mainの古い物語資料や結末を説明の根拠にしない。

## 画面と根拠

| 編集時間 | 実物・説明 |
|---|---|
| 0–7秒 | 新収録f739–948の中継点→落下→同じ地点への復帰を原速で連続表示 |
| 7–9秒 | 同じ収録の実pause表示。クリアや再挑戦を挟まない |
| 9–11秒 | 落下前の実メニューから「失った記憶 1 / 15」をPhotoCraftで切り出し |
| 11–16秒 | 同モード・同profileで落下後も1/15の実表示と比較。最後2秒は比較カードを保ち、音は無音 |

新収録は正当な既存第1話クリアsaveをbyte同一で独立領域へ複製し、`completed=[1]` の第2話・物語モード（内部名practice）で一続きに行った。Enter／Tab／右／Space／E／Escape等をprocess内 `InputEventKey` に送る外部driverで、製品の位置・記憶・中継点などをsetterで変更していない。別話クリアや再挑戦を落下比較へ接続していない。

`v07/episode2-capture01/capture.json` が通常入力・trajectory・前後メニュー・落下1・hearths `[0,1]`・クリア無しを保存。`launch.json` はcode0、`coreChanged=[]`。`preflight.json` は製品71コード／scene／設定ファイルのSource byte照合とseed SHAを保持する。全製品素材の固定metadataは [依存manifest.json](依存manifest.json) に保存。

実装根拠は固定Sourceの `scripts/campaign/main.gd:193`（記憶表示はcompleted.size）、`scripts/campaign/save.gd:100–115`（practiceの新規話クリアでcompleted追加）、`scripts/main.gd:218–225`（落下でcheckpointへ復帰）、同`:331`（点灯した中継点へ更新）。「落下で記憶を失う」「何をしても失わない」とは説明しない。

MovieWriterの実出力は1440×810。driver票の960×540は指定値で、実出力サイズではない。callback1139対movie1140の差も原票を保持し、編集は実decodeフレームで決めた。復帰直後のraw f861–862はゲーム自身のcamera移動で主人公が元画面上端へ外れる。編集の追従修正でこの実挙動を描き足したり隠して連続可視と主張したりしない。復帰cameraの追従中は元HUDの文字の一部もcrop内に入る。主役の編集見切れとは分けて残し、独立視覚QAの確認対象とする。

## 3Craft原本と再読込

- FilmCraft 0.10.0：`v07/projects/v07-cut.fcproj` が新rawの切出し、`v07-final-tracked.fcproj` がv2映像と原ゲーム音の最終組立。旧 `v07-final.fcproj` も保持。
- EffectCraft 0.14.0：`v07/projects/v07-preview-tracked.ecproj` がv2追従／字幕／比較。旧 `v07-preview.ecproj` も保持。Windows RTX4070 SUPER / Vulkanで31.64秒の有界render完走。
- PhotoCraft 0.15.1：`v07-heading.pcraft` と `v07-memory-before/after.pcraft`。見出しは編集文字、記憶比較は実画面のcrop。書き換えたゲームUIではない。

原本は私有caseの絶対メディアpathを参照する。Sourceだけをcloneして依存無しで開けるbundleではない。大きいraw／ProRes／動画／ゲーム製品／saveはこのPRへuploadせず、元caseを保全して [依存manifest.json](依存manifest.json) のbytes/SHAで固定する。再現scriptは実際に使った工程の保存であり、同じ既存出力へ盲目に再実行しない。`prepare-capture.py` とLinux launcherは単一attemptの排他guardを持つ。

新収録のみ既設Godot4.6.3 / 独立Xvfb / 独立save / nice10を使用した。Windows製品exeは外部capture scriptを実行できず、共有focus無しの実描画に既存Linux engineが必要だったため。編集・合成・書出し・検品はWindows native。共有PCのマウス・global key・foreground・clipboardは使用していない。

## 音・確認範囲・残工程

この代表カットにはVOICEVOX、ナレーション、外付けBGM、編集SEを使っていない。新MovieWriter内の実ゲームevent音だけを原速／同時刻で配置した。`scripts/audio.gd` 内で合成する音が由来。Dummy audio driverではambient.playが分岐で省かれるため、完全な通常再生の環境音収録とはしない。旧v06のVOICEVOX／音楽creditを本稿の使用実績へ転記しない。

v2同SHAで全AVdecode exit0／stderr空、16秒・480f、L/R個別の期待音とのlag0／相関0.999999694／clip0を確認。v2の1秒間隔全体シートと落下前後72連続frameを抽出して実画像を確認した。画面幅320px相当の画像確認は実端末の通し視聴とは別に記録する。native再読込・依存照合の原票は `v07/qa/` に保存する。

**未確認**：全編の実時間視聴、主観実聴、実mobile、独立QA、owner創作採用、65秒本構成、最終CTA／声／TikTok native曲、NAS新稿納品、公開受入。投稿・予約・publisher／lease／claim／cron・認証ACLは変更していない。Rootへこの代表カットと最新Sourceを引き渡し、独立QAとowner判断を分けて次工程へ進める。NAS最終copyはRootの単独handoff後のみ。

支援先の既存指定はCAMPFIRE `https://camp-fire.jp/projects/993744/view`。デモ2026年12月提供見込み、本編時期未定という条件を保持する。本16秒は設計の代表カットで、公開用CTAを組んだ完成広告ではない。
