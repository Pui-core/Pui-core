# おさゆ11月3日バトル告知：通常版とセラ先輩版

管理 [Issue158](https://github.com/Pui-core/-/issues/158) の2構図を制作するコードです。最新の二本提出指示により、背景の任意質問だけを理由に制作を止めず、PM指定の背景候補を私的制作版へ限定使用します。**実配信由来・人物混在は未確認**であり、確認済み・人物なしとは報告しません。

## 二つの構図

- solo：上部の配信盤面と、下部のおさゆ一人・挑戦・先生・意気込みの情報帯を分離。
- collab：配信盤面の下を、挑戦するおさゆ／先生セラ・ネージュの対向名札と二人の固定立ち絵へ組み替えます。単に二体目を重ねません。
- 全画面の左寄せ大文字の反復から、日付ヘッダー・移動する盤面・独立人物・共通の下部導線へ情報階層を変更。追従→着地→次対象→全体復帰を実描画し、同camera下のworld固定目盛りが視点移動の基準になります。
- 19秒／1080×1920／30fps／音声stream0。11月3日、チュートリアルバトル、セラ先輩、意気込み、応援、プロフィール→配信を維持。年・開始時刻・ルール・実スコアは追加しません。旧157・旧v03・旧V4は保持します。

## 素材とAI確認の境界

人物・背景候補・人物入り映像・私有画像path/digest・rawログはSourceに含めません。私的bindingの現bytes/SHA/寸法とコピー後の同一性を照合します。人物は既存の通常透過済み原本とowner指定相手PNGを固定合成し、生成・AI背景除去・ポーズや表情変更は行いません。

未知背景全体はカメラ外の独立した全編固定base。上に不透明なneutral全画面を残しません。人物も位置・等方scale・回転・不透明度を全編固定し、親・キー・式・効果・マスク・ブラー・3Dなしです。

neutral / preview は人物と未知背景をimport自体せず、同じ文字・盤面・cameraと予約領域だけで保存・描画。AIが見るのはfootage import0と原本/動画の同一性を確認した別原本だけ。本番は通常ソフトの構造・数値検査に限定します。

## 私的binding

binding.example.jsonは未設定の例です。制作はPM指示に紐付く実体を指定します。

- 確認済み本人背景と限定使用候補を区別。候補は kind=stream_background_candidate / usageAuthorizedByPM=true / actualStreamProvenanceConfirmed=false / characterFree=null / usage=fixed_base_private_production を保持します。
- cameraPolicy=independent_fixed_baseを必須とし、虚偽の確認済み値で通しません。未指定・実体変更・別camera方針は拒否。
- 素材識別値は私的bindingだけ。存在するファイルや旧生成stageを自動採用しません。限定使用は包括ライセンスや実配信由来の証明ではありません。

## 実行

既存Linux EffectCraft 0.14.0／FilmCraft 0.10.0／FFmpegを専用XDG・Xvfb・CPU2個・低優先度・有限timeoutで使います。共有desktop/input/focus/clipboard、新認証・DL・常駐・cron・課金・SNS投稿・音源追加・自前通知はありません。

```bash
export OSAYU158_ROOT="$HOME/private-use/osayu158-new-revision"
export OSAYU158_BINDING="$HOME/private-use/osayu158-private-binding.json"
for variant in solo collab; do
  for mode in neutral production; do
    node build.mjs "$mode" --variant "$variant" --probe
    node build.mjs "$mode" --variant "$variant"
    node render.mjs "$mode" --variant "$variant" --probe
    node video-audit.mjs --variant "$variant" --mode "$mode"
    node render.mjs "$mode" --variant "$variant"
  done
  node production-audit.mjs --variant "$variant"
  OSAYU158_VARIANT="$variant" node --test audit.test.mjs
  node opaque-proof.mjs --variant "$variant"
  node film.mjs --variant "$variant"
  node final-motion-audit.mjs --variant "$variant"
done
node package.mjs
# OSAYU158_NAS_FOLDERへ明示したNASの新しい版folderを指定
node deliver.mjs
```

既存原本・動画・別SHAの納品は上書きしません。再実行は保存済み工程と実体を確認し、別revisionまたは未完了工程から進めます。Windowsは既存SMBの標準COPYとNAS実体のheadless FFprobe/FFmpeg検査だけ。unsigned PS1・ExecutionPolicy変更/Bypassは使いません。

## 検証

- 保存native行列で全570frameの対象座標・追従誤差・画面内維持・文字/人物予約領域の衝突・全体復帰を検査。
- 実native probe動画の緑の対象と青いworld基準を全frameで照合。人物未import版と本番、probeとcleanの共通レイヤーも一致確認。
- 最終FilmCraft MP4の実画素から、clean版のピンクの盤面目盛りを全570frame計測。四分の一解像度の圧縮/画素誤差を含む許容6pxで照合し、全追従区間の実移動を確認。数式だけを描画の証拠にしません。
- 通常のalpha数値処理で人物の不透明内側を選び、native可逆PNGを独立固定人物のnative描画と比較。全編固定構造、元ファイル同一性、サンプルの画素一致を分けて記録。
- FilmCraftの単一無音master・等倍・恒等時間/位置/scaleを確認。再リンクした原本を実再読込・保存・再描画。
- NASには通常版.mp4とセラ先輩版.mp4だけを納品。元/先bytes/SHA、NAS実体の570frame・19秒・30fps・音声0・全decode・process終了を照合。原本とQAは私的編集保管へ。

技術検査、人物未import版のAI目視、人物入り全編の人間視聴、owner創作採用、実配信由来確認、SNS公開/成長は別々です。未確認を採用・公開・成長実績に置き換えません。
