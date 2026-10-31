# おさゆ11/3バトル：中央カメラ再制作

管理 [Issue 160](https://github.com/Pui-core/-/issues/160) のsolo／collabを、人物を含む共通world cameraで構成する。各場面で中心へ寄り、動く主文を追従して全体へ戻る。soloとcollabは左右のカメラ経路を変え、collabは二人の構図にする。旧版は保持する。人物・未知背景はneutral原本にimportしない。本番素材のAI入力・生成・表情／ポーズ変更は行わない。背景は限定使用候補で実配信由来と人物混在は未確認。

`OSAYU160_ROOT` に独立した私的Linuxディレクトリ、`OSAYU160_BINDING` にschema 3の私的bindingを指定する。bindingはIssue 160、候補の未確認状態、明示許可、cameraPolicy `shared_world_camera` と実素材のbytes・SHA・寸法を検証する。画像や個人素材の識別値はGitに入れない。`OSAYU160_IDENTITY_ROOT` にsRGB恒等描画の私的検証ルートを指定する。

```sh
for variant in solo collab; do
  node build.mjs neutral --variant "$variant"
  node render.mjs neutral --variant "$variant"
  node audit.mjs neutral --variant "$variant"
  node build.mjs production --variant "$variant"
  node render.mjs production --variant "$variant"
  node audit.mjs production --variant "$variant"
  node compare.mjs --variant "$variant"
  node opaque-camera-proof.mjs --variant "$variant"
  node build.mjs neutral --variant "$variant" --probe
  node render.mjs neutral --variant "$variant" --probe
  node compare-probe.mjs --variant "$variant"
  node probe-audit.mjs --variant "$variant"
  node audit.mjs neutral --variant "$variant" --probe
  node film.mjs --variant "$variant" --tag r94
done
```

原本は独立Xvfb・XDGでEffectCraft、最終編集はFilmCraftを使用する。既存出力を上書きしない。`audit.mjs` は原本の親、570フレームのカメラと対象の値、実背景寸法からの全画面coverage、保存layoutに基づく全フレーム文字範囲を検査し、`probe-audit.mjs` は人物・未知背景をimportしない検証用映像のマーカーを実画素で測定する。これらは人物同士の見え方や創作採用を保証しない。neutral連続frameの実見、本番の素材同一性、再リンク、実描画と全decode、独立レビュー、NAS実体の検証は別途必要。技術検査をownerの創作採用に置き換えない。

素材の等倍・整数位置・恒等カメラ検査は別の新しい私的`OSAYU160_ROOT`で `identity-proof.mjs --variant solo` と `--variant collab` を実行する。sRGBの通常native可逆出力を元PNGと比較する検証であり、Rec.709本番が元RGBと完全一致する証拠にはしない。同じRec.709・同じカメラの本番と人物分離参照の不透明内部を `opaque-camera-proof.mjs` で比較する。背景候補の配信由来はOS160-BG-001として未確認のまま管理する。

FilmCraft取込前にproduction MP4のbytes/SHAをrender-summaryと、原本SHAをbinding／camera-structureと照合する。素材bindingと同一性proofも照合し、完了後に再照合して、最終票へ入力と原本のhash・sourceBindingを残す。既存の旧最終MP4には事後的に入力因果を推定せず、新tagでFilmCraftのみを再実行する。背景候補の実配信由来は別途未確認である。
