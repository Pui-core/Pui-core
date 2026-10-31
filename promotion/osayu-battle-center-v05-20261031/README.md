# おさゆ11/3バトル：中央カメラ再制作

管理 [Issue 160](https://github.com/Pui-core/-/issues/160) のsolo／collabを、人物を含む共通world cameraで構成する。各場面で中心へ寄り、動く主文を追従して全体へ戻る。soloとcollabは左右のカメラ経路を変え、collabは二人の構図にする。旧版は保持する。人物・未知背景はneutral原本にimportしない。本番素材のAI入力・生成・表情／ポーズ変更は行わない。背景は限定使用候補で実配信由来と人物混在は未確認。

`OSAYU160_ROOT` に独立した私的Linuxディレクトリ、`OSAYU160_BINDING` にschema 3の私的bindingを指定する。bindingはIssue 160、候補の未確認状態、明示許可、cameraPolicy `shared_world_camera` と実素材のbytes・SHA・寸法を検証する。画像や個人素材の識別値はGitに入れない。

```sh
for variant in solo collab; do
  node build.mjs neutral --variant "$variant"
  node render.mjs neutral --variant "$variant"
  node audit.mjs neutral --variant "$variant"
  node build.mjs production --variant "$variant"
  node render.mjs production --variant "$variant"
  node audit.mjs production --variant "$variant"
  node compare.mjs --variant "$variant"
  node build.mjs neutral --variant "$variant" --probe
  node render.mjs neutral --variant "$variant" --probe
  node compare-probe.mjs --variant "$variant"
  node probe-audit.mjs --variant "$variant"
  node film.mjs --variant "$variant"
done
```

原本は独立Xvfb・XDGでEffectCraft、最終編集はFilmCraftを使用する。既存出力を上書きしない。`audit.mjs` は原本の親、570フレームのカメラと対象の値を検査し、`probe-audit.mjs` は人物・未知背景をimportしない検証用映像のマーカーを実画素で測定する。これらは人物同士の見え方や創作採用を保証しない。neutral連続frameの実見、本番の素材同一性、再リンク、実描画と全decode、独立レビュー、NAS実体の検証は別途必要。技術検査をownerの創作採用に置き換えない。
