# missyou：飾った日記は、アプリを閉じても残る？

[再生一覧](index.html)からYouTube Short版とTikTok follow版を開けます。指定Naturalの正式Core描画と今回音声への口パク・表情を追加したrevision-02です。

- YouTube：`videos/missyou118.mp4`
- TikTok候補：`videos/missyou118-tt.mp4`（原BGMの仮音源版、Root選曲・公開待ち）
- PhotoCraft：`covers/missyou118-cover.pcraft` とPNG
- EffectCraft/FilmCraft：`projects/missyou118{,-tt}.{ecproj,fcproj}`
- 素材：`media/`。検査と全payload SHA：`qa/delivery.json`

missyou開発中のアプリを、専用iOS Simulator上で通常UI tapにより操作したオフライン検証データです。額・折り紙の花へ飾る→終了→resetなし再起動→同じ日記を開く実収録を抜粋しました。冒頭は保存復帰後の結果を先に示し、額の確認表示は一部静止して読みやすく保持しています。fixtureの内部識別子だけを局所maskし、スタンプ・額/花の操作・保存結果を変更していません。相手・日記は端末内のQA用データで、TestFlight実配布・本番2端末通信・APNsは未検証です。

ナレーション：VOICEVOX:青山龍星。旧版の7元WAVを全文保持してsample時刻で組み、音声再生成はしていません。Revenant_Naturalを今回WAVから正式Coreで新規288f描画し、画面に表示する区間へ同期しました。モデルはアプリ画像に重ねず別レーンに置いています。PhotoCraftで実画面を使う編集可能なcoverを制作しました。BGMは自作Connecting Lightsをアプリ動画の背景として使用し、音楽を主題とする動画ではありません。

両MP4は900f、30.016秒、1080×1920/30fps、48kHz stereo AAC、-18.8 LUFS/-1.4 dBTP。全AVdecode成功、7句の全文PCMと最終AACの有声頭尾を照合し、lag 0 samples・全文相関最小0.999601を確認しました。内部marker位置の165フレーム画素検査と重要連続画像を残しています。Fでの3Craft再open/save/render・欠損素材0・SHAの結果は `qa/delivery.json` と `qa/native-dependencies.json` を参照してください。直接の全編実時間視聴・主観試聴は未実施です。Root最終画像受入は後続の受入記録、公開は別の運用記録として区別します。

公開ID・関連動画実設定は未確定です。対応app横動画は無く、別のゲーム動画へ続きとして繋ぎません。TikTok人気曲・日本CML選定は未確認でRoot担当です。配布・視聴・フォロワー等の成果は未証明です。

旧revision-01・元の実capture・先行PR51は保全しています。再収録・製品機能変更・共有WindowsGUI/browser/SNS/runtime/lease操作は行っていません。元モデル/MOC/atlas/SDKは同梱せず、原本を開くための描画済み素材を揃えます。
