# EMBERWAKE：灯りで道が変わる実作品紹介

管理 [Issue156](https://github.com/Pui-core/-/issues/156) の新しい65秒縦動画1creative。ownerが8秒版を拒否した変更を反映し、8秒最終動画・既公開151の最終動画を使わず、実rawから構成を作り直した。2音版は同じ全映像であり、別の投稿2本にするためのものではない。**制作/NAS/Sourceの候補納品であり、未公開。主観の実聴取は未検証のため公開受入ではない。**

## 完成候補

NAS：`\\100.105.2.75\private\work\videos\2026-10-30\エンバーウェイク\1007_灯で変わる道_構成刷新_v05\`。制作日の作品別フォルダーに動画2本だけを保存。HHmmは主BGM版の実更新時刻をWindowsで取得した。

| ファイル | 実AV時間/映像frame | SHA-256 |
|---|---|---|
| BGM版.mp4 | 65.002秒 / 1950frame | 0a9a2d2991a886cea0c9c79555be5c814839366770ff7118339839a728c997db |
| 声・効果音版.mp4 | 65.002秒 / 1950frame | 6479c1e53a97dc5ae785e0ccd32dce653bcf9451b7179a506ca0d2745c8aa4de |

編集原本/依存は `F:\Videos\ProjectP-EMBERWAKE-Intro60-2026-10-30\intro65-v01\`。PhotoCraft0.15.1、EffectCraft0.14.0、FilmCraft0.10.0の実原本をその場所から保存・再open・描画・書出しした。SourceのprojectsはF参照の同SHAバックアップで、Gitだけに全raw/model/audioが同梱されるという意味ではない。旧版/原raw/モデル/全制作依存・133144未保存・129保留WT・F本体feature14を保持した。

## 構成と根拠

- 0–2秒：第一switch前後の足場出現を先出し。「この灯り、道になる？」を実映像で小さく回収。actorと左出現足場を同時に残す広角で、右側UIを避けた。
- 2–12秒：別の足場への移動、同条件短押し失敗/長押し着地、次の跳躍。短押しはf217でチェックポイント[95,1160]へ復帰し、出発足場へ戻ったとは記述しない。
- 12–24秒：序盤の移動→第一灯→第一switch→実際の新足場へ跳ぶ。結果を語る声cue08は足場を確認できる19.8秒より後に配置。
- 24–35秒：別の段差、点灯と足場変化、次の跳躍。dashの発動実演や記憶の全保持など未観測の主張をしない。
- 35–47秒：別の街の実場面4点を各3秒、原fpsで提示。「持って運ぶ」という未確認の解釈はやめ、実挙動の「次の足場へ飛び移る」にした。
- 47–65秒：別の実プレイを動かし続けながら、遊びの結論、作者、デモ見込み、本編時期未定、支援内容の確認と検索を提示。本人Revenant_Naturalの既存実Core120frame・無声idle/blinkを47–51秒の下部overlayに採用。口パク/新演技とは称さない。

全65秒に原fpsの実ゲーム映像があり、静止尾/8秒完成品の伸長やループは0。冒頭2秒は後の同イベントを見せる意図したteaser、ep2の短い同区間0.833秒も別の比較接続に重なる。全raw frameが65秒ぶん重複ゼロという意味ではない。原料はmain2raw（SHAはsource-binding.json）と、151が使った原料の別場面であり、151最終動画を再投稿していない。

通常gamepaneは1170px＝画面高60.9375%。タイトルを上へ詰め、技術的な収録/音説明とcreditは投稿文へ移動。hook/switchは原crop[180,430,1000,650]の広角例外でactor/足場の両方を読ませる。切れたSHIFT/Xだけ[0,1172,270,76]の局所matteで除外。moon-run/jump-cityはpan cropで主役を追う。最終CTAは上部y180/280に「CAMPFIREで」「EMBERWAKEを検索」を置く。HUDの全順序strip・結末・手帳/後半物語を避けている。

## 音・導線・限界

VOICEVOX玄野武宏21cue。実queryで「灯り」がトモリになる欠陥を検出し、表示と読み入力を分離して「あかり」へ修正。作品名は「エンバー、うぇいく」で実queryのウェイクを確認し、正式読み未確定の和題を声から除いて表示に残した。全旧WAV/queryはFに保全し、Sourceのeffective-queryとeffective-audio-bindingが最終音源への対応。CAMPFIRE句は実queryのプ=pを確認、補助offline ASRの「キャンクファイアー」という表記だけで実発音不良とは判定しない。

BGM：Cipher / Kevin MacLeod (incompetech.com)、ISRC USUAN1100844。公式Source https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1100844 、CC BY4.0 https://creativecommons.org/licenses/by/4.0/ 。0.835秒から抜粋し、音量・声区間ducking・fadeを編集。帰属をMP4 metadata/投稿案へ保持。原ゲーム音は未収録、SEは編集音。声SE版のTikTok native曲は未選択/JP metadata・mix未検証。

CTA：CAMPFIREでEMBERWAKEを検索してプロジェクトの内容・条件を確認。正確なURL https://camp-fire.jp/projects/993744/view を投稿文へ併記する。YouTube Shorts説明欄の外部URLをクリックできるとは訴求せず、Related/プロフィールlinkも未設定を設定済みとしない。デモ2026年12月提供見込み・本編時期未定、CAMPFIREページ編集0。65秒という尺を報酬条件達成/収益化/実売上に換算しない。

## 検証範囲

実Native作成・F原本再open/save/render・1950frame書出し、active依存欠損0、最終2MP4の全AVdecode0、全decoded映像一致、NASから直接全AVdecode0/SHA一致を確認。最終AACの21cue頭尾相関/lag/clip/peakと全尺はqa/final-quality.json。Rootの中間画像レビューで帯面積、見切れ、右UI、検索位置、切れ文字を修正。Rootが最終MP4由来の全体シートと3遷移stripも実見し、追加の必須画像修正0を確認。対応はqa/root-final-visual-review.json。

**全編の実時間視聴・主観の実聴取・実モバイルUI・owner創作採用・公開後の継続視聴/フォロー/支援流入/実売上は未検証。** 自動数値/静止目視/補助ASRを聴感PASSと呼ばず、投稿は親publisherの別工程に保持する。年商500万円は目標、実売上・対象年度・期限は未確認。

## 再開

sourceの制作recipeは既存の専用Linux CLI/Xvfb/XDG環境を使用し、既存成果がある場合は停止して保全する。同じrecipeをFパッケージへ無条件再実行しない。実行順はprepare/prepare-end、audioと読み/時刻の限定修正、picture、layout-repair-v02→v03→v04→v05、render v05、qa、deliver、curate。最終原本はintro65-v05.ecproj/2fcproj、対応する有効音はr5。初稿と修正履歴を保持し、共同Source/共通指示/他WTを変更しない。
