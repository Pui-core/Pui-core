# この道、どうつなぐ？ / YouTubeゲームShorts

[動画20.8秒](videos/game-short.mp4) / [再生ページ](index.html) / [PhotoCraftカバー](covers/game-short-cover.png) / [題名](source/title.txt) / [投稿文](source/description.txt)

ゲーム『EMBERWAKE 灰の灯』v0.11.0 / EXPLOREの実録画から、芯石をはめると横並びの足場が階段になる仕掛けを見せる。0〜0.8秒は変化後の実画面を静止し、その後「この道、どうつなぐ？」→運ぶ→はめる→変化→同画角比較とつなぐ。冒頭・比較・拡大は編集で、連続プレイやRTA/PBの記録とは説明しない。最新v0.12の新機能を紹介した動画ではない。

最新ownerの「完成MVも含め、音楽関係の動画は投稿しない」に従うゲーム題材。自作BGM108は背景素材で、音楽制作の動画ではない。既存TikTok97の公開動画・ID・F04は保持する。YouTubeの送信・公開・URLはRootだけが実Studioで確認する。現在の公開状態は[publication.json](source/publication.json)を正とし、公開未確認を公開済みへ読み替えない。関連横動画は指定しない。別題材の横動画112ができても、同じ疑問へ答える対応を確認せずに導線を約束しない。

## 納品と実原本

F納品：`F:\Videos\ProjectP-YouTube-Game-Short-2026-10-26\revision-01`。

- PhotoCraft：`covers/game-short-cover.pcraft`。元の編集可能なカバーを複製し、問いを変更。Fから再読込・再保存・PNG描画を実行した。原本検査の警告0、再描画PNGのSHA一致を確認。PNG化時の通常のflatten警告は想定内で、編集可能な原本は保持する。
- EffectCraft：`projects/game-short.ecproj`。旧600枚の実Core描画を含む無音ProRes bodyを読み、0.8秒の無声introと字幕を追加する。元編集の内部にあるモデルやゲームを新規Coreとして再生成した原本ではない。
- FilmCraft：`projects/game-short.fcproj`。V1は新EffectCraft無音描画、A1は独立した元VOX+編集SFX、A2は自作BGMのduck済み音。Fから再読込・online3・再描画・最終H.264/AAC出力を確認する。

EC/FCはF納品の素材を参照する。Gitだけのcloneでは巨大な無音ProResやprivate原WAVが不足する。公開Gitにはrecipe・原本・カバー・ゲーム動画・検査証跡を置き、元モデル/MOC/atlas/SDK・生Core PNG一式・private BGM単体・元437MB ProRes・声の原WAVは再配布しない。F納品には必要な7素材をSHA検証して収めている。実行済み`source/composition.jsx`には原本作成時点の制作中状態を保持し、現在の状態は`source/publication.json`を正とする。

## 声・口・効果音・BGM

元F04の3VOICEVOX WAVと独立した自作編集SFXを直接再合成した。元no-music stemとの全PCM比較は最大誤差約1.13e-7、SNR約121dB。混合曲から声を抽出した処理ではなく、旧CC曲Monkeys Spinning Monkeysは新動画の音・無音映像に含めない。SFXは録音されたゲームSEではなく、元編集で制作した効果音。最終AACは **−19.5 LUFS / −1.3 dBTP**、3句の全範囲と語尾・5.6秒のSFXは参照mixから0sampleのずれ、相関0.9990以上を確認した。

元の声位置0.12/5.15/14.6秒を0.92/5.95/15.4秒へ移し、元Coreを含むbodyも同じ24フレーム分移動した。introは元body frame150の実Core口0を静止再利用。保存timeRemapの実値は出力0.8→元0、5.6→元4.8、15.4→元14.6秒を支持する。終端20.8秒の補間キーはレイヤー有効域の排他的上端にあり、そのwarningを欠損や再生範囲内のキーと取り違えない。

声：VOICEVOX:青山龍星。原WAVの全サンプルを保持し、声の終端は2.723/7.614/17.501秒。声とSFXへfadeはかけない。3dBの共通ゲインを声/SFXと音楽の両方へ加え、比率・タイミングは維持する。音楽だけを語頭前から下げ、語尾後に戻し、19.8〜20.8秒で音楽だけをfadeする。

BGMはIssue108の実native SoundCraft最終22秒素材 `connecting-lights-short-master.wav`、SHA `2387bf313b689b21467cbffb0b17195ff70ab7f4e2fb8c9bf244f85bbd74101d`。旧F02/preDCを採用しない。自作素材の使用から収益・著作権料・Content ID登録可能性を自動的に主張しない。指定Revenant_NaturalのMOC SHA `6b63e0fcd6c8bc5142689ab5c0d2340b2fe59d5124e57290dd438c2ec01ad03e` と実Core描画は旧97の検証に対応し、不要なCore再描画0・VOICEVOX再合成0。

## 検査の範囲

[technical.json](qa/technical.json)は最終MP4 SHAに対応する全AV decode、1080×1920/30fps/624frames、AAC音量/true peak、独立mix参照との差、3句の全音声・語尾・5.6秒のSFX位置、同じRGB形式へそろえた実ゲーム領域の原画対応を記録する。重要連続frameはF納品に保持し、Gitにも冒頭・問い・変化前後・声3・CTA・終端を保存する。

カバーと重要静止画は実出力を目視する。全編の主観試聴は未実施で、decodeや数値検査を聴感確認と同一視しない。この制約だけで新たなowner承認待ちは設けず、実native表示・警告・公開確認は単独publisherが実施する。Shortsのカバーは編集可能素材として納め、デスクトップで独自サムネイルが実設定できたとは主張しない。

## 再現

入力はF04、最終BGMはF03。`source/prepare-inputs.mjs`は新規の空の納品へ指定SHAの7素材とsourceを複製するため、既存納品の媒体を無条件に上書きしない。`PP111_ROOT`で新しい制作場所を指定してprepareを実行し、その場所をカレントにして残りを実行する。native CLIへ渡せるWindows/WSL双方から読める配置が必要。既に原本がある場合、必要な段階だけを実行し、稼働中ジョブが残っていないことを確認する。

```text
node source/prepare-inputs.mjs
node source/audit-original-audio.mjs
node source/audio.mjs
node source/picture.mjs
node source/cover.mjs
node source/render-picture.mjs
node source/filmcraft.mjs
node source/verify.mjs
node source/verify-raw-binding.mjs
```

管理：[Issue111](https://github.com/Pui-core/-/issues/111) / 継続目標：[親106](https://github.com/Pui-core/-/issues/106)。
