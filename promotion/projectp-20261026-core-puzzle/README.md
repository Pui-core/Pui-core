# 芯石をはめると、何が変わる？ / revision04 licensed classic

[現在の20秒候補](videos/core-puzzle-voice-licensed-classic.mp4) / [カバー](covers/core-puzzle-cover.png) / [再生ページ](index.html) / [投稿文と音楽credit](source/caption-licensed.txt)

指定Naturalと、Kevin MacLeodの公式原録音「Monkeys Spinning Monkeys」を使った28日以降の編集候補。実ゲームv0.11.0/I章EXPLOREの10/25収録から、芯石を運ぶ→はめて階段になる→上の灯へ、という一つの変化を見せる。28日に開発した、最新日本トレンド、RTA/PB達成といった説明はしない。26の本人MIX予約と27のmissyou候補は変更しない。

F納品：`F:\Videos\ProjectP-Core-Puzzle-2026-10-26\revision-04-licensed-classic`。旧revision03と自作曲別案は旧F納品ごと保持し、source内の既存3MP4/原本も残す。旧記録のHOLDや26日計画は履歴であり、現在版の判断はこのREADMEと`qa/licensed-*.json`で区別する。

## 原曲の同定・許諾・credit

原曲は「Monkeys Spinning Monkeys」Kevin MacLeod (incompetech.com)、公式原録音ISRC **USUAN1400011**。現在の[公式曲ページ](https://incompetech.com/music/royalty-free/?isrc=USUAN1400011)の選択record/表示テンプレート、公式MP3、title/artist、SHAを対応させた。原MP3 SHA：`a5bb345c23849ad0786aa0bc5157a9f2d4039660fe00282e55754d475f36dc14`。別cover/配信masterや、過去TikTok soundIDの同一性を推測しない。

[公式ライセンス](https://incompetech.com/music/royalty-free/licenses/)と[FAQ](https://incompetech.com/music/royalty-free/faq.html)、[CC BY4.0](https://creativecommons.org/licenses/by/4.0/)の作者/出典/ライセンス表示・変更の明記へ対応。画面内に曲名/作者/CC BY4.0、投稿文と`media/LICENSED-AUDIO.md`に原曲URL・ライセンスURL・編集担当/分担を記載する。元曲はKevin MacLeod、抜粋/音量調整と、別のVOICEVOXナレーション・自作編集SFXの重ねはProjectP/ぷいの編集。作者が本作を推奨しているとはしない。rawフルMP3はprivateのまま、Git/Fへ含めず、使用20秒だけを許諾/credit付き素材として保存する。

TikTokの[2021-04-01公式記事](https://newsroom.tiktok.com/trending-on-tiktok-endless-inspirationalquotes?lang=en)にHot Trackとして紹介された定番曲の実験。現在の日本順位・使用数・現在のCML一覧を確認した主張ではない。CML外の必要な許諾を得た原録音として扱い、native soundIDはnull。投稿時にMusic Usage Confirmationが表示されたら、単独publisherがこの許諾証跡に基づき確認する。Publish時だけ現れる項目を確認するために今日先行公開はしない。実警告/著作権check失敗を無視するという意味ではない。

同定/利用条件は`qa/licensed-classic-rights.json`、実PCM/cue/creditは`qa/licensed-classic-music.json`。既存phonk/CML限定検索の失敗は履歴として保持し、当時の一覧条件を全曲利用不可へ広げない。

## 実音とゲームの対応

カタログ/タグは144 BPM。独立の実スペクトル変化列は約0.4166秒周期を支持したが、gridだけで音を置いていない。選んだ実attack群5.025〜5.065秒の中で、8msの前後RMS差を1ms刻みで測り、立ち上がりの最大点 **source5.056秒**を検出した。

- 使用区間はsource **0.256〜20.256秒**、48kHz開始sample12,288。
- 実cue sample242,688を、出力4.8秒/sample230,400/frame144へ対応。知覚上のonset精度には約±20msの窓依存があり、音楽的小節頭や知覚の1sample精度を保証しない。
- 元game163は携帯/横並び、164から挿入/階段。保存ECのtimeRemapと実出力143→144で確認し、実動作の順序/1倍速を保つ。
- BGMだけを独立してduck/fade。既存3VOXの語頭前から下げ、実語尾後まで保持して戻す。master全体のfadeで声を切らない。最後の曲fadeは800ms、導入80ms。声/SFXは一度だけ。
- FilmCraftはV1映像、A1既存VOICEVOX+自作編集SFX、A2曲だけのduck済み音で分離。全mix参照WAVと最終AACを別に検査する。

映像の問い0〜2.4秒、運ぶ2.4〜4.8秒、変化4.8秒、実動作〜14.4秒、同画角比較14.4〜18秒、作品名/CTA18〜20秒。2秒の最後の可読性を保持し、全ての切替をテンポ格子へ強制していない。HUDの時計をRTA実測として見せず、freeze/比較は編集と明記する。

## モデルと現在の編集原本

指定Revenant_NaturalのMOC SHA`6b63e0fcd6c8bc5142689ab5c0d2340b2fe59d5124e57290dd438c2ec01ad03e`を正式Core06.00.0513/MOC5で描画した既存600枚を再利用。ナレーション3句の時刻/音源を変更せず、口はVOX由来のまま。BGMで口を動かさず、Core600枚は再描画していない。元モデル/atlas/SDK・配信/カメラ/VTS/物理設定を変更/再配布しない。MIT描画utilityのnoticeは保持する。

現在版は`projects/core-puzzle-licensed-classic.ecproj`、`projects/core-puzzle-licensed-classic.fcproj`、`covers/core-puzzle-cover.pcraft`、`projects/comparison.pcraft`。PhotoCraftの同画角比較とカバーは現物を保持、EffectCraftへ短い曲creditを追加。顔/頭髪/ゲームを分けた構図と、比較の両ラベルを保つ。生成AI画像への置換はない。

旧revision03の7画像によるTikTok確認は旧自作曲masterの履歴。新版へ無条件に流用せず、rev04は採用master/長いcredit付きcaption/開示/著作権checkをRootが別途確認する。

## 検査と公開への引継ぎ

現在はtechnical検査とbounded native UI確認を終えた制作候補。全AVdecode・最終AACの声/attack同期・音量/TP・PCM合成/語頭語尾・保存remap・重要連続frame・Core600枚の旧SHA対応を`qa/licensed-technical.json`等に結合する。F04の現在3Craft原本をその場所から再保存/再読込/描画し、欠損0/PC pixel一致/source-F SHAを`qa/licensed-delivery.json`に記録する。旧版のreceiptは当時のまま残す。

直接の主観全編試聴は未実施。技術数値や画像を自然な聴感の合格とは報告しない。`projectp-video/references/production.md`の「可能なら試聴、できない場合は未実施」を適用し、未試聴だけを新しいowner承認待ちへ広げない。一方、実素材/声の頭尾/同期/音量と、実native表示・警告/checkの未解決は修正・再確認する。

Rootだけが実TikTok確認/publisherを担当。固定F04を本人prop_puiの実Studioへuploadし、348字credit付きcaption、custom cover、Anyone・OwnBrandON・AIGCON・第三者brandOFF、著作権/簡易content check問題なしを確認。最終8phone画像で20/20終端・芯石/階段/灯/比較両面/CTA/曲creditが見え、2cover・設定/credit各1枚と合わせた12画像をSHA対応した。profile側coverはmock editor tileであり、実公開profile/followerの証拠ではない。名目壁時計をframe単位の音声同期/全編連続目視へ広げない。

Rootはstagingを破棄して本人Homeへ復帰。保存draft・投稿・予約・プロフィール保存0、candidateIDなし、実公開は未確認。Music Usage Confirmationは非送信画面では現れず未観測で、実送信時に出た場合だけsinglepublisherが正しい原音CCBY根拠で通常確認する。今日先行投稿する新ゲートは設けない。

現在の解除範囲は`qa/licensed-current-status.json`、native証跡は`qa/licensed-native-ui/native-ui-licensed.json`。旧PP97-SOUND/FINAL-TIMELINEは正しい許諾曲/credit・実PCM同期・現F原本・実native確認で制作scopeを解消。主観試聴は上記のとおり未実施として記録し、未試聴だけで追加owner承認待ちへ戻さない。旧revision03/native=falseやtechnical段階pendingのJSONは履歴であり、現在の判定へ無条件に転用しない。F04初回technical receiptは`qa/history/revision04-pre-native-delivery.json`へ保持し、後続のsmall docs/proofのみを新receiptへ対応させる。媒体3SHA・原本は不変更。28日の採用・最新活動/前投稿分析・最終送信と実公開receipt・人数目標は親93で継続する。合成音声のAIGCと自分のbrandを扱い、Music Usage Confirmationが実送信時のみなら未観測を明記して将来の単独publisherへ引き継ぐ。今日の追加投稿・予約や、新しい常駐loop/cronは作らない。

## 再現

現在版の入口は以下。原音MP3は既存private cacheか`PROJECTP_LICENSED_MUSIC`で、指定SHAの公式原録音を用意する。Core600枚/声の既存素材を保持し、不要な生成をしない。

```text
node source/licensed-music.mjs
node source/picture-licensed.mjs
node source/render-licensed.mjs
node source/verify-licensed.mjs
node source/package-licensed.mjs
```

音だけを変更した場合は既存pictureを保ち`render-licensed.mjs --skip-picture`でFC音を再反映できる。旧自作曲/音楽なし版のrecipeとF03を上書きしない。旧説明は`qa/history/revision03-README.md`へ保存した。

管理：[Issue97](https://github.com/Pui-core/-/issues/97) / 継続目標：[親93](https://github.com/Pui-core/-/issues/93)
