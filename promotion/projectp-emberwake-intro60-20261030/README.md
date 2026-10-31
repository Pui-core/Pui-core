# EMBERWAKE：灯りで道が変わる実作品紹介

管理 [Issue156](https://github.com/Pui-core/-/issues/156) の新しい65秒縦動画1creative。ownerが8秒版を拒否した変更を反映し、8秒最終動画・既公開151の最終動画を使わず、実rawから構成を作り直した。2音版は同じ全映像であり、別の投稿2本にするためのものではない。**制作/NAS/Sourceの候補納品であり、未公開。主観の実聴取は未検証のため公開受入ではない。**

## 完成候補

NAS：`\\100.105.2.75\private\work\videos\2026-10-30\エンバーウェイク\1007_灯で変わる道_構成刷新_v05\`。制作日の作品別フォルダーに動画2本だけを保存。HHmmは主BGM版の実更新時刻をWindowsで取得した。

| ファイル | 実AV時間/映像frame | SHA-256 |
|---|---|---|
| BGM版.mp4 | 65.002秒 / 1950frame | 0a9a2d2991a886cea0c9c79555be5c814839366770ff7118339839a728c997db |
| 声・効果音版.mp4 | 65.002秒 / 1950frame | 6479c1e53a97dc5ae785e0ccd32dce653bcf9451b7179a506ca0d2745c8aa4de |

編集原本/依存は `F:\Videos\ProjectP-EMBERWAKE-Intro60-2026-10-30\intro65-v01\`。PhotoCraft0.15.1、EffectCraft0.14.0、FilmCraft0.10.0の実原本をその場所から保存・再open・描画・書出しした。SourceのprojectsはF参照の同SHAバックアップで、Gitだけに全raw/model/audioが同梱されるという意味ではない。旧版/原raw/モデル/全制作依存・133144未保存・129保留WT・F本体feature14を保持した。

## v06 限定修正（公開前・Issue156 RC-156-02 / CR-156-01）

v05の最終動画（上表）は保全し、公開前の独立レビューで出た指摘だけを新headのv06で直す。**v06の動画SHA・納品先・検証結果は、描画・書出し・QA完了後にこの節へ追記する（現時点は修正Source/原本/音声配置までで、動画は未生成）。**

- **RC-156-02（cue07が結果より先行）**: 最終MP4/原素材の30fps連続frameで、台座の点灯は**frame523＝17.4333秒が最初の点灯**（frame522は未点灯。台座周辺輝度85.57→97.14、原素材`light.mov`も73番で同時刻）。既存cue07 WAV（`voice-07.wav`）は再生成せず、`plan.mjs`のcue07 `at`を16.0→17.46へ移して有声開始を17.5003秒（点灯の約2frame後）、終端18.8177秒にした。cue08（19.8886秒開始）との間は約1.07秒、cue06終端との間も保持。SFXのchime（17.4秒）・他cue・BGM・全体の速度は不変で、再配置による音声の変化は15.95〜19.02秒のduckingのみ（共通gainはv05と同値0.78797）。
- **字幕**: 結果字幕「最初の灯が、点いた。」を点灯frame(17.4333秒)から18.9秒へ移し、点灯前の副行は外した（見出し「近づいて、点ける。」は維持）。元のlight shot（15〜18秒）内だけでは結果後に約0.57秒しか読めないため、次shot冒頭（スイッチ見出しの区間）まで保持し、スイッチ副行「スイッチの前後を、実画面で。」は18.9秒開始に遅らせた。映像素材・尺65秒/1950frame・その他layerは変更なし。
- **CR-156-01（12月見込み）**: 必須認定は独立Reviewerが撤回し条件付き限定（C1〜C4）へ。動画の画面・声（cue19）は変更しない（「見込み」とSteam審査通過後という条件は両立する）。投稿文2フィールド（YouTube説明・TikTok caption）へ「Windows向けデモはSteam審査通過後に提供予定／状況により変更／本編の提供時期は未定」を併記した（`source/posting.json`）。「準備中」は出典が無いため入れていない。「確定」「配信中」「審査通過済み」「審査中」と読める語は使わない。12月見込みの出所は`posting.json`の`provenance`、CAMPFIRE条件は公開直前に再取得（C4）。ページ編集・支援額の売上扱いは0。
- **検査scriptの修正（PM事前点検 RO-V06-01〜03）**: 判定を純粋関数 `source/v06-checks.mjs` に切り出し、`source/v06-checks.test.mjs` の合成fixture（メディア/ネイティブ非使用）で修正前の欠陥と修正後の拒否を記録した。(1) 音声: 範囲外/サンプル不足/非有限/無音/デコード長不足は例外（旧判定は期待2秒・実1秒でtail 0サンプル・NaNのまま通過）。(2) 字幕: 保存原本のlayer本文・in=523f・out=567f・fade-in key・後続副行の開始を独立照合し、最終MP4の連続frame統計(453〜600f)で開始(523〜525f)・保持・終端(567〜568f)・後続副行の別本文を照合（526f〜580fの誤字幕は拒否）。(3) 依存: EffectCraft/FilmCraftの参照を現Linux caseとFの両方で集めて存在検査し、FCの必須参照（picture・voice/sfx/music-r6）の欠落・許可root外・旧版(r5/v05)参照を拒否（公開資料には相対名のみ）。
- 検証の想定範囲: 実原本のreopen/save/render、修正区間の連続frame（`source/v06-lamp-qa.mjs`）、cue PCM配置・最終AAC頭尾/lag/clip・相対音量（`source/v06-qa.mjs`）、全AV decode、65秒/1950frame、2音版の映像同一、active依存の欠損0。声の再合成なし。実聴・全編視聴・JPnative曲・実モバイルUIは引き続き未検証で、この修正だけで公開受入にはしない。

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
