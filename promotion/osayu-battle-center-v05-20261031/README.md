# おさゆ11/3バトル：新規配信風背景と中央カメラ

管理 [Issue 160](https://github.com/Pui-core/-/issues/160) のowner訂正「配信背景っぽいのを作って」を受け、旧出典待ち OS160-BG-001 は撤回。実配信元の画像は使わず、`background.mjs` の矩形・色・場面別ラインから人物・素材画像なしの背景を新規制作する。soloはミント／ピンクの光枠と中央スポット、collabは二窓の異なる構成。画面全体の共通cameraは場面別に寄り量・移動・着地を変える。人物の生成・AI入力・ローカル変形アニメーションは行わない。旧r94と原本は保持。

schema 4の私的bindingは人物素材のhash・bytes・寸法だけを保持し、背景に外部mediaを持たない。`make-binding.mjs` は旧bindingから人物metadataだけを検証付きで新規作成する。background SourceのSHAと全570frameの被覆結果は保存原本のauditからFilm最終receiptへ接続する。背景の「actualStreamProvenanceConfirmed=false」は新規制作を意味し、実配信原本を主張しない。

実EffectCraft／FilmCraftと人物素材操作はRoot専管。Rootは新しいLinux専有dirにidentity proof、両版のneutral／production／probeとfilmを作り、原本を再読込し、全decodeする。neutralのfootage 0と原本・renderのhashを照合した後だけneutralを視認する。人物入り本番は構造・hash・数値のみで確認する。納品はRootが新version folderへ完成動画2本だけを置き、NAS側のbytes・SHA・全decodeを確認する。技術検査・owner創作採用・実納品は別の状態。

Source側の有限検証: `node --test promotion/osayu-battle-center-v05-20261031/*.test.mjs`。実native render、実物の全frame audit、独立Claude最新head reviewとNAS到達は別途必要であり、このテストだけで成功としない。

最終工程は各版 `node film.mjs --variant "$variant" --tag stream-v1` とし、その後 `node delivery-handoff.mjs` を実行する。handoffは `*-final-stream-v1.private.json` と同名の最終動画だけを参照する。
