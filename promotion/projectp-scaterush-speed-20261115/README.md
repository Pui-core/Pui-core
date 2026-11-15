# ScateRush — 加速と減速の新収録（Issue 162）

[codex] From.[一般動画編集者]

[Pui-core/-#162](https://github.com/Pui-core/-/issues/162) に対応する65秒・1080×1920・30fpsの制作候補。Web試作を通常キー入力だけで新収録し、ブーストを保持した走行の衝突、別走行での減速・回避・再加速、実際の衝突結果、iPhone版の検索導線、別作EMBERWAKEの支援案内を組む。

独立したLinux worktreeの専管prefixのみ変更する。製品iOSソース、元HTML、他promotion、共有入口、共有runtimeを変更しない。公開・予約・プロフィール編集・外部アップロード・新認証・課金・PCのキー/マウス操作は行わない。

## 編集原本と依存

`projects/` は実PhotoCraft/EffectCraft/FilmCraft原本、`source/` は収録・制作・検査の再現手順。生素材、音声、区間ProRes、全ログは専用制作領域 `/home/pui/private-use/projectp-scaterush162-20261115/` に保全する。依存とSHAは `dependency-manifest.json`、最終動画とNASの対応は `qa/acceptance.json` を参照する。原本はこの実在する制作領域を参照するため、別PCへ移す際は依存素材を揃えて再リンクする。

PhotoCraftのレイヤー保持原本から見出し・短い注記・字幕を透過PNGとして出力し、EffectCraftで新収録の画角・実HUD・操作表示・キーを合成。短い区間ごとにNative描画し、FilmCraftで65秒と音声を組み立てる。FilmCraftの正式custom rangeで6.5秒ずつ書き出した10映像区間をstream-copyで保全接続し、FilmCraftから全65秒を1本のPCMへ書き出して最終AACへ形式変換する。全65秒のEC一括renderを繰り返さず、各区間の端点とframe数を検証する。FFmpegは音工程・形式変換・検査に使用する。

元収録は1280×720・25fps・原ゲーム音なし。最終30fpsへの変換は原速のまま行い、スローや反復で尺を増やさない。17カットはそれぞれ5秒以下。実映像の選択区間は `source/plan.json` に固定する。通常入力のevent時刻は収録開始からの実時計で、映像との対応は推定offsetだけで保証せず、採用した接近・跳躍・衝突の実画像で照合する。

## 事実と案内の範囲

最初の走行はブーストを保持し、ジャンプ/スライドで回避しながら約12秒後に衝突。後半に使う別走行も切替の末に約22秒で衝突した。走行間の障害物列は異なり、成績差を操作の因果や最適解として扱わない。画面SPEEDと内部state.speedの単位を混同しない。

iPhone版の正式App Storeリンクは投稿文に保持し、映像内は検索を案内する。映像はWeb試作・自動操作と明記し、iPhone版実映像と称さない。末尾のEMBERWAKEは別作と明示する。支援額・期限・提供日を追加しない。

既存BGM ScateRush-NeonVelocityの160BPM Sonar/Cakewalk原本とWAVを確認して再利用。旧完了票 `/home/pui/.local/share/scaterush-video-20261025/issue65-completion.md`、製品PR66 head `fb69701dd98bda83a4e83cbe72f397f44b5ae6d0` に出典がある。VOICEVOXは既存localhost engineでspeaker13＝青山龍星を実照合し生成。新音楽制作や外部音源取得へ広げない。

## 検証の扱い

最終ファイルの形式、全AV decode、フレーム数、字幕と重要遷移、320px表示、AACの頭尾・音量・時間対応、Native再open/save/render、依存欠損を検査し、実施結果を `qa/acceptance.json` に残す。数値検査と抽出画像の目視を、直接の全編視聴や主観試聴へ読み替えない。ownerの創作採用・公開・実ID・フォロワー・収益の達成は別工程。
