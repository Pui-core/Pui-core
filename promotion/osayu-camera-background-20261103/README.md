# v09 背景・音源同期の候補プレビュー

From.[ショート動画ディレクター] — Issue160の継続。

v08の背景・ポップアップに創作差戻しがあり、曲と使用区間を先に確認して通常／コラボ各無音・音ありを作る依頼へ更新された。この作業版は、PhotoCraftの素材レイヤー背景と実音源に同期した短いneutral見本を追加する。TikTok音源ID／同一versionは未確認で、全編4本の完成・創作承認・公開を意味しない。

実配信の原画像待ちは過去owner訂正で撤回済み。既知の人物なしV2背景を参照素材として使用し、PhotoCraftで単独ステージと二者のガラスwing構成を別に保存する。実配信原本と称さない。人物mediaは読み込まず、EffectCraftの予約矩形のみを用いる。

`OSAYU160_ROOT` は新しいprivate作業dirを指定する。`media/approved-v2-stage-background.png` と出所を照合した音源候補をprivateに置く。音源・画像・native・絶対private pathはこのrepoへ追加しない。

```text
node background.mjs
node preview-build-v09.mjs solo
node preview-build-v09.mjs collab
node preview-audit-v09.mjs
node preview-render-v09.mjs
```

見本は169frame／30fps、85・84frameの2cut。原盤の測定済みアクセントへ、popupの減速・着地、斜めcameraの急接近・引き、次shotを対応させる。人物なしPhotoCraft背景だけをimportした保存nativeを照合してから描画する。FilmCraftで同一の実音源候補を指定区間・-6dB・末尾3frame fadeで組み、音声ありMP4をexportする。数値検査は創作採用や実聴の代用ではない。

残工程: TikTok音源の同一版確認、必要な修正と全編構成、人物本番の非AI export、各企画の無音／音ありの映像一致、最終音源指定txt、同Reviewerの独立QA、通常merge、新NAS納品。既存v08/PR100と旧NASは保持する。

以下はv08以前の工程記録。v09の全編用pipelineとして実行しない。

---

# おさゆ11/3告知：曲線背景と斜め・寄り引きの改訂

管理 [Issue 160](https://github.com/Pui-core/-/issues/160)。旧通常版・コラボ版はownerが等速、高低差不足、直線主体の背景を理由に不採用。旧PR94と既存私物/NASは保持し、新しいPhotoCraft背景・EffectCraft原本・FilmCraft最終版を別prefixへ作る。

通常版は中央の楕円ステージと丸い告知面、コラボ版は高さの違う二つのステージと交差する曲線、重なる吹き出し面を使う。カメラは場面別に斜めの接近→読める停止→短時間の引き、二段階の接近、高さを変えて次の対象へ移る動きから構成する。背景だけを3D平面と実nativeカメラで遠近変形し、人物と文字は別の共通2D親で通常pan/zoomを行う。人物に3D、回転、ワイプ、マスク、ブラーを適用しない。

実配信背景の安全な原本は未特定。既知の候補は告知画像由来であり参照しない。背景はPhotoCraftのgradient、Bezier path、roundedRect、ellipseのみで新規制作した配信風デザインで、外部画像のimportはない。実配信原本の再現を主張しない。

本文は既存の「11/3」「チュートリアルバトル」「先生は セラ・ネージュ」「プロフィールから配信へ」等を維持。年、開始時刻、ルール、スコア、新音楽、投稿/予約は追加しない。2本とも19秒、1080×1920、30fps、音声stream 0。

## 実行

Windowsの専用worktreeと私的caseを使う。既存のPhotoCraft 0.15.1 / EffectCraft 0.14.0 / FilmCraft 0.10.0のCLIを実helpで確認した。`OSAYU160_ROOT` は新しい絶対パス、`OSAYU160_BINDING` は原人物素材のSHA/bytesを持つ既存私的bindingへ指定する。人物素材・映像・私的bindingはGitへ入れない。`runtime.mjs` とWindows Job launcherは既存PR94でreviewされた実行経路を再利用し、専用一時領域・CPU2個・BelowNormal・終了証跡を持つ。

```powershell
$env:OSAYU160_ROOT = 'C:/Users/pui/private-use/<new-case>'
$env:OSAYU160_BINDING = 'C:/Users/pui/private-use/<existing-binding>.json'
node background.mjs
foreach ($variant in @('solo','collab')) {
  node build.mjs $variant neutral
  node audit.mjs $variant neutral
  node cut-audit.mjs $variant neutral
  node render.mjs $variant neutral 6
  # 最初の区切りを提出し、実描画を確認してから通し制作する。
  node render.mjs $variant neutral 19
  node pixel-safety.mjs $variant neutral 19
  node build.mjs $variant production
  node audit.mjs $variant production
  node cut-audit.mjs $variant production
  node compare.mjs $variant
  node character-proof.mjs $variant
  node render.mjs $variant production 19
  node pixel-safety.mjs $variant production 19
  node film.mjs $variant
}
```

既存ファイルは上書きせず、修正は別case/revisionへ保存する。PowerShellで連続実行する際は各Nodeプロセスの非0を後続工程前に拒否する。

## 検証境界

- `build` は保存→native再読込、参照mediaのallowlistとSHAを確認。neutralは人物をimportしない。AIへ渡せるのは来歴を照合したPhotoCraft背景とneutral出力のみ。
- `audit` は保存原本のcameraキーを各frameで読み戻し、文字・人物のcrop、人物の親・ローカルtransform・effect等を照合する。親子付けはcameraが恒等の時点で行い、その後にキーを追加する。初回試作で先にキーを入れると`compensate:true`が非恒等の初期cameraを子へ焼き込みcropを起こしたため修正した。
- 人物と親cameraの表示/合成/マスク/時間範囲、固定anchor/opacityも検査する。親のposition/scale以外のキーやexpressionを拒否し、人物非表示・Multiply合成・親anchor/opacity変更を含む16種類×2版の変異で見逃しを確認する。原本と動画を変更しない検査補強は全renderを繰り返さず、対象SHAと既存の描画証拠を照合する。
- `compare` は人物の予約形状と本番人物レイヤーだけを除き、neutralと本番の全共有layer構造を比較する。
- `character-proof` は人物を表示せず、等倍の完全不透明RGBと、3時点の本番合成/人物のみの参照描画を数値比較する。後者は元画像のalphaから補間範囲全体が不透明な画素だけを選ぶ。出力alphaの8bit丸めを使うと半透明の縁を誤って含むため、差分許容値を広げず元alphaで判定する。検査用PNGをAIへ入力しない。
- `render` は出力の全decodeと570frame/無音/寸法を確認。`pixel-safety` は背景平面の外側のmagenta sentinelを非AIのRGB数値処理で検出し、人物入りframeを出力・表示しない。
- `film` は検証済みmasterのみを参照し、19秒を無変形・無音で配置、原本再読込、最終出力の全decodeとhash鎖を確認する。
- 構造/数値検査は演出の採用を保証しない。安全neutralの見た目、動きの連続性、人物入り本番のowner私的再生、異モデルnative独立QA、owner創作採用、実NAS照合は別に記録する。未実施を合格へ変更しない。

完成動画だけを新しい私的NAS版へ置き、NAS側bytes/SHA/full decodeを確認する。Source mergeだけでは全体完了にしない。NAS設定/認証/ACLは担当範囲外。

## v08：新しいカット長条件

静止の連続提示は3秒未満、実際に見える動きのあるカットは5秒以下。v07の告知面切替をカットと数えた独立QAは保持する。v08では共通背景の連続カメラを19秒の一ショットと読める余地をなくし、既存の告知切替4点で画角も切り替える。次場面へ移る補間区間だけを出側の最終poseで保持し、境界で入側poseへ切り替える。各場面内の斜めの接近、引き、高さ、緩急、本文、尺は保持する。

通常版の5カットは3.2/4.0/3.9/3.7/4.2秒、コラボ版は3.0/3.5/4.3/4.0/4.2秒。新規背景生成は行わず、v07の背景PNG/.pcraft/provenanceをSHA照合して新caseへコピーする。背景ファイル名のv07は素材の出自を表す。

`cut-audit.mjs <variant> <neutral|production>` は保存原本のカメラを全570frame読み、4境界の実pose不連続、cut長、連続停止、文字面の時間を確認する。画角の数値変化だけで見えるcutとは断定せず、安全neutralの境界前後と最終映像の非AI数値probeも照合する。新しい最終SHAで同Reviewerの必要deltaを受け、新NAS v08へ納品する。旧v07/旧QA/NAS原票は上書きしない。新条件による未計測旧稿のBAD加算は行わない。
