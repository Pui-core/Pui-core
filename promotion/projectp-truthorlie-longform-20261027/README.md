# 嘘か誠か / TruthOrLie — 2026-10-27用

Issue121の横本編と同題Short2版。実公開・予約はまだ行っていません。
本編は708秒の編集構成。最終実尺・AV検査の正本はqa/av-validation.json、Fのbyteと原本確認はqa/delivery.jsonです。

- videos/truthorlie-seven-rounds.mp4: 横1920×1080。本物のローカル通常4R（AA2-BB2の引分）と別ルール3R（AA1-BB2、BB勝利）、完了後の履歴2件。
- short/videos/truthorlie-short.mp4: 縦1080×1920。最初の問いと実投票/的中から本編へ。RelatedVideoの実IDとnative接続はRootが本編公開後に設定（現在null/pending）。
- short/videos/truthorlie-short-tt.mp4: 同題のTikTok版。末尾の行動はフォロー、@prop_pui。背景音は仮の自作BGM。人気曲・日本向けCMLはRoot未選曲、選曲/ネイティブ投稿は未完。
- covers/: 実PhotoCraftの横・縦カバー原本とPNG。
- projects/とshort/projects/: 実EffectCraft / FilmCraft原本。推理前4区間と履歴8秒の修正は、52秒の実EC correction stripをFCのV2に5区間で置く（qa/final-correction-*参照）。
- source/metadata.json / source/*description.txt / source/tiktok-caption.txt: 配信案。公開ID・実公開時刻・実フォロワー効果は未確認。

## 画面・音の正確性

収録は製品5b11516bba2be105f44c444eb6352eb757a8abd3、次期版1.03(23)のiOS Simulator17.2。公開版1.02の確認は2026-10-26T11:29:35.556ZのApple公式lookup。SDK26.2はテストのビルド環境であり、実端末/iOS26.2の動作実証ではありません。画面には「次期版の操作例・回答は架空」と表示しています。

架空の名前・回答を、通常のアクセシビリティUIで自動操作した実収録を編集しています。人間の実対戦・心理・反応・作者の感情・速度/RTA・オンライン通信を実証したものではありません。投票前は未選択の金色の実カードを使用し、入力中の嘘選択マークを推理前に見せません。35回答は各問いを読み比べる内容で、同一映像のループ・減速・長い入力待機による尺埋めはしません。2試合で同じ質問が出る箇所は通常のランダム出題のまま、全質問が異なるとは主張しません。

VOICEVOX:青山龍星（speaker13、speed1.06）。各句は丸ごと配置し、語頭・語尾をフェード/カットしていません。指定Revenant_Naturalを正式Cubism Coreから今回の音声に合わせ900フレーム描画し、横0–30秒とShort0–3秒で使用。ソフトウェア三角描画で、カメラ/physics/実機追跡ではありません。モデル/SDK/MOC/atlas原本は同梱しません。BGM108 Connecting Lightsは背景のみ、80秒の楽節と2秒の余韻をつなぎます。音楽主題投稿ではありません。

全AV decode・全句PCM/AAC頭尾同期・数値音量・指定静止画の確認と、主観での全編直接視聴/試聴は区別します。後者はfalseのままです。SNS投稿や成果指標の達成を納品完了に読み替えません。

## Fからの編集と依存

F内のEC/FCはF内のmediaを参照。PCは画像を埋め込んでいます。qa/native-dependencies.jsonがF再open/save/render/missing0の正本。再収録/再生成用の外部製品・Mac・Core/JRE・元Naturalモデルの所在説明は、届けた編集原本の依存とは別です。

history/inherited-staging-20261026は引継ぎ前の未凍結41ファイルを全byte/SHA保全した履歴です。旧白1フレーム/0test/失敗pilotは採用しません。新しい元収録の私有原票は別のcapture rootに保持し、公開Gitへ転載しません。旧112/117/118の原本は変更していません。

修正前の新しい動画・native snapshotと、不採用の過大WAVは私有productionのhistory/qaに保持し、F最終の編集依存へ混ぜません。引継ぎ時点のF旧staging41ファイルは別扱いで、history/inherited-staging-20261026をそのままF内に保全しています。

## 公開Gitの範囲と現在の受入

このフォルダはソースと最小QAのみです。動画・画像・PC/EC/FC原本・音源・SDK/MOC/atlas・rawUI・生save・認証をGitへ入れません。Fの凍結receiptはqa/delivery-summary.jsonから辿れます。技術QAとF納品は完了、Root指定の最終F画像・実尺受入は未回収なのでDraft PR/Issue/WTを保持します。公開・予約・RelatedVideoの実ID・TikTok人気曲選定はRoot担当で未完です。

再収録の現在入口はsource/capture/run-ui-capture.shとCaptureTests.swift。toolbar「閉じる」→keyboards.count0、native Select All→delete、入力value完全一致、実testCount1/失敗0/対象method passed/record finalizeを確認します。固定UDIDを他環境へ流用しません。source/capture/history/pilot-rejected-01.rbは不採用の旧経路をbyte保持した履歴で、現在の実行入口ではありません。
