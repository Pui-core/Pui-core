# EMBERWAKE：実コードと丸印の経路をつなぐ v08

管理 [Pui-core/-#156](https://github.com/Pui-core/-/issues/156)、Source [PR96](https://github.com/Pui-core/Pui-core/pull/96) の**17秒の代表稿**。新規の通常入力収録から、切替前の丸印／線／輪郭→操作後の足場→その足場への実着地を見せ、現在のゲームで実行されるコードの部分抜粋を重ねた。作者の心情・制作意図を代弁しない。公開用広告、CTA、65秒本構成、創作採用ではない。

## 固定した実物

owner提示済みのMP4は変更せず、同じ私有caseに保全する。

| 項目 | 固定値 |
|---|---|
| Windows絶対path | `C:/Users/pui/private-use/emberwake-video156-20261101/v08/videos/emberwake-v08-code-circuit-preview17.mp4` |
| bytes | `2465514` |
| SHA-256 | `f036237e819b3b39e52d53bdaf6869f961bcaf52b183082628fa69c0c5c452d6` |
| 映像 | H.264、1080×1920、30fps、510f、17.000秒 |
| 音声／container | AAC stereo、音声17.002秒、container17.002秒 |

`v08/qa/delivery.json` のmetadata.duration=17は制作時の丸めた尺。正確な映像／音声／container別の値は [対象版binding.json](対象版binding.json) と保存済みffprobe原票を使う。動画の再描画・再muxはこのSource追加で行っていない。

旧commit `7d2d3aabaa0b71ff602a110e4c74cc6bb916e84b`、旧prefix `promotion/projectp-emberwake-design-v07-20261101/` の71files、owner提示済みv07初稿／v2、原票は改書き・削除しない。同じbranchへこの新prefixだけを追加する。旧PR本文は `history/PR96旧本文-v07.md` に保存した。旧技術QAや提示済みを新しい創作の採用へ読み替えない。

## 実ゲームとコードの対応

ゲーム製品0.12.0、Source `71584a6bd0c8852885157de71032fd9252e7a04c`、scene `res://scenes/campaign.tscn`、第2話・物語モード（内部名practice）。入力／trajectory／eventは `v08/circuit-capture01/capture.json`、隔離起動と終端は `launch.json`、Source照合とsave由来は `preflight.json`。

表示する原文は [code-pin.json](v08/code-pin.json) に、ファイル・commit・行・元ファイルSHA・行bytesのSHA・全行原文・部分表示の区分を固定した。`code-context/` は周辺の必要な行だけを**元のindent／改行も含めてbyte同一**で保存する。全製品Sourceや関係のないコードは含めない。

| 役割 | 現在の実装／表示区分 |
|---|---|
| 実スイッチ操作 | `scripts/main.gd:311–317` がswitch_litへ追加し、update_gatesを呼ぶ |
| 対応する状態 | `scripts/campaign/world.gd:36`。今回の第2switchはgroup1で、route8の先の3足場に対応 |
| 通れる判定 | 同`:38–40`。collision_layerとplatformsを切り替える。画面ではL38末尾 `collision_layer = 1 if on else 0` の**部分抜粋**を表示 |
| 配線／輪郭／刻印 | 同`:68–77`。配線の描画、非作動時の輪郭、同groupの刻印をそれぞれ実装。画面ではL77内の色の条件式だけを**部分抜粋**として表示 |
| スイッチ側の丸印 | `scripts/world.gd:163–168`。今回見せるgroup1と足場側の丸印を対応させる |

**L77の色の一式だけが配線・輪郭・判定全体を作る、という説明ではない。** L77は刻印の色を選ぶ式であり、配線はL73、輪郭はL76、接触判定はL38など別の処理である。画面の「見た目と、渡れる判定を、同じ切替でつなぐ」は上の実装と実収録に基づく編集解説。全groupの刻印が一意に対応するという一般化や、初見の分かりやすさの保証はしない。

`stone_circuit.gd` は同製品に存在するが、このcampaignの実行経路ではない。旧main.tscn／Wind等の実装や旧制作計画を、今回の本編第2話の実コード・作者直接発言として表示していない。特定実装の作者の直接意図は未取得。

## 新収録の条件

既存の正当な第1話クリアsaveをbyte同一で独立領域へコピーし、`completed=[1]` のまま第2話を通常メニュー入力から開始。物語モードpracticeをdriverでassertし、Eキーで第2switchを実際に作動させ、対象3bodyのcollisionが `[0,0,0]→[1,1,1]` になることと、route8への実着地を観測した。落下0・クリア無し。位置／記憶／足場をsetterで変更していない。外部driverの通常 `InputEventKey` 自動入力であり、人間の手動プレイや手作業によるeditor操作の収録とはしない。

Windows製品exeで外部capture scriptを実行できないため、**新規ゲーム収録だけ**既設Linux Godot `4.6.3.stable.official.7d41c59c4` と別Xvfb／別XDG saveを使用。共有マウス・global key・foreground・clipboardは0。WindowsでのPhotoCraft／FilmCraft／EffectCraft編集を維持した。新しいcaptureやgame改修はこのSource追加では実施しない。

71コード／scene／設定ファイルは実製品snapshot、固定Git Source、保存preflightの三者でbyte一致を再照合。launch code0／coreChanged=[]。実rawは1440×810、1113f。driver票の960×540は指定寸法であり、実stream寸法ではない。callback1112とmovie1113の差も原票を保持し、編集は実decodeフレームを基準にした。完全解法・全map・結末は映していない。

## 原本・依存・照合

- PhotoCraft0.15.1：`v08/projects/code-draw-v2.pcraft`、`code-collision.pcraft` が元コードの部分抜粋素材。`circle-before.pcraft`／`circle-after.pcraft` は新収録の実画面crop。
- FilmCraft0.10.0：`circuit-cut.fcproj` が新rawの切出し、`circuit-final.fcproj` が最終映像と実ゲームevent音の組立。
- EffectCraft0.14.0：`circuit-preview-v2.ecproj`／`source-circuit-v2.jsx` が現用の合成と画角。未提示の初回仮描画・誤って「輪郭の色」としたカードは私有caseで保全し、現用原本とは分ける。

原本は**私有caseの絶対path**を参照する。[依存manifest.json](依存manifest.json) に大きいraw／ProRes／native export／owner提示MP4のbytesとSHA、製品snapshotのmetadataを保存する。小さい画像と原本はSourceへbyte同一で格納。原本が参照する実pathとSHAは `v08/qa/delivery.json` のnativeMediaReferencesでも照合できる。

**clone単独で再生産できる全media同梱packageではない。** 大media・完全なゲーム製品・saveはuploadしていない。Root／Reviewerは私有caseの実参照先からmanifestと照合する。移動・再リンクが必要なら元の絶対参照とSHAを確認して別版へ行い、この版やownerリンクを上書きしない。

制作scriptは実際の制作工程の保存であり、同じ出力への一括再実行用ではない。`make-video.py` 内の初回仮描画と `make-graphics.py` の初回カードを現用版と混同しない。現用は保存済み `source-circuit-v2.jsx`／`render-correction.py` とnative原本。`v07/source-v07.jsx` は制作scriptが読み出す共通helperの元ファイルだけをbyte保全しており、旧ゲームrawは使用していない。

## 検証と残工程

制作時の同じ最終SHAで全AVdecode0／stderr空、左右AAC期待音とのlag0・相関0.999999781・clip0。切替30連続frame、着地30連続frame、全体sheet、320px幅の選定画像を抽出し実見した。原票は `v08/qa/`。これらを実時間全編視聴や聴感確認へ代用しない。追加先からのnative再読込とbyte／依存確認は `v08/qa/source-package-check.json` に束縛する。

音は新規収録の実ゲームevent音だけ。Dummy driverではambient開始が省かれるため通常再生音全体とはしない。コード説明の5–11秒は意図した無音。VOICEVOX／追加BGM／編集SE／新楽曲は不使用。

独立QA、全編実時間視聴、主観実聴、実mobile、owner創作採用、公開広告／CTA／65秒本構成は未確認。NAS／投稿／予約／lease／claim／cronはRoot専管で変更0。最新headと同MP4をRootへ渡し、既存Reviewerの新v08差分判定へ進める。
