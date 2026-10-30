# おさゆ11/3バトル告知：配信背景への差替え準備

管理 [Issue158](https://github.com/Pui-core/-/issues/158) の**未完成の制作基盤**です。本人の配信背景は未確定で、現段階のneutral版は図形だけの機構確認用です。完成デザイン、本人背景の採用、本番人物の検証、NAS納品を意味しません。旧157、旧v03、旧V4は変更していません。

## 前版から変える構造

- 全画面の左寄せ大文字の反復を、上部の配信ウィンドウと固定情報レールを分ける構造へ変更する準備です。背景の構図に合わせて位置・余白を確定するため、現時点の配置や灰色を完成デザインとしません。
- ステージ上の情報を「11/3と挑戦 → 先生 → 意気込み → 応援 → 日付と導線」に展開します。開始時刻・年・ルール・スコアを追加していません。
- 開始時の短い飛び込みだけにせず、対象自体が移動する間もカメラが追い、読める位置で保持し、別対象へ移り、最後は全体へ戻ります。日付と導線の固定レールはカメラから独立しています。
- 人物は追従しません。予約矩形を確保し、人物をimportしないneutral原本を独立して保存します。本番人物の位置・サイズ等は全編固定の独立overlayにします。

## solo / collab

同じ11/3告知を `--variant solo` / `--variant collab` で分離します。native原本・動画・検証票の名前にもvariantを含め、上書きしません。collabはおさゆと先生の二人分を独立固定overlayとして予約し、情報レールを上側の共通帯と下側の導線へ組み替えます。二人ともneutral版にはimportしません。

先生のowner指定立ち絵は通常固定合成の利用GOに限ります。包括ライセンス・顔やポーズの生成許可が確認済みとは扱いません。元PNGのalphaを保持し、初期配置と等方scaleだけを設定します。

## 背景と素材の境界

私有画像、キャラ入り画像・映像、元画像の識別hash、私的な参照パス、rawログはこのSourceに含めません。neutral原本のfootage importは0です。

`binding.example.json` は意図的に未確定です。本番用の私有bindingには、PMが確認した本人配信背景、その画像に人物が含まれないこと、通常透過済み人物の参照が必要です。現bytes・SHA・寸法と結び付け、私的コピー後も実体を照合します。識別hashをSourceへhardcodeしません。存在するだけの画像や旧stageを自動採用しません。背景が未確定の間、`build.mjs production` と `render.mjs production` はネイティブ起動・本番ファイル作成前に拒否します。

背景採用後も、現在の骨組みをそのまま本番完成と扱いません。同じwriterが実背景に合わせて構図を調整し、人物なし確認原本と本番の共通レイヤー照合、人物の可逆数値検証、再リンク・再保存・再描画、NAS実体の照合を続けます。

## 独立したLinux実行

既存EffectCraft 0.14.0、FFmpeg、Xvfbを使います。新しいダウンロードや認証はありません。`OSAYU158_ROOT` は素材を公開しない専用Linux領域へ指定します。既存projectやrenderを上書きせず、別revisionを使います。必要に応じて `OSAYU158_NATIVE_TOOLS` / `OSAYU158_FFMPEG` で既存ツールの所在を指定できます。

```bash
export OSAYU158_ROOT="$HOME/private-use/osayu158-revision"
for variant in solo collab; do
  node build.mjs neutral --variant "$variant" --probe
  node build.mjs neutral --variant "$variant"
  OSAYU158_VARIANT="$variant" node --test audit.test.mjs
  node render.mjs neutral --variant "$variant" --probe
  node video-audit.mjs --variant "$variant"
  node render.mjs neutral --variant "$variant"
done
```

専用XDGとXvfb、CPU2個、低優先度、有限timeoutを使います。自分が起動したprocess groupの終了を待って確認し、共有desktop・既存プロセスを操作しません。

## 機構の検証

- 保存されたnative原本のlinearキー、親子関係、anchor/scale/positionから、全570フレームの実screen座標を求めます。追従区間の誤差、対象の画面内維持、全体復帰、文字同士・人物予約領域との重なりを検査します。
- neutral-probeの**実ネイティブ描画MP4**を全フレームdecodeし、動く対象の緑の目印と固定ワールド位置の青い基準点の重心を保存原本の座標と比較します。全追従windowで固定基準が画面上を移動することも実測します。clean版にも同じstage rig配下の目盛り・基準線を残し、追従の周辺が静止する見え方を防ぎます。数式やcameraPositionSpanだけで描画成功としません。四分の一解像度での画素・圧縮誤差を含み、許容は元解像度6pxです。
- clean neutralとprobeの共通レイヤーを保存原本から照合します。緑の目印は本番へ含めません。
- 固定カメラ、誤対象、全体復帰なし、人物予約領域の親子付け、未確定背景の本番CLIsを負例として拒否します。

## 未実施

本人背景の選定、背景に基づく最終デザイン、本番人物のimport・描画・数値比較、FilmCraft最終編集、NAS納品、ownerの創作採用、TikTok実機・音源・投稿・公開後効果は未実施です。機構検査の成功をこれらの完了へ読み替えません。
