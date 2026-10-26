# EMBERWAKE 本編2話「ふたりの合図」の横動画（段階1 pilot）

実装管理: [Issue117](https://github.com/Pui-core/-/issues/117)。親承認は[Issue93](https://github.com/Pui-core/-/issues/93)/[Issue106](https://github.com/Pui-core/-/issues/106)。本編0.12.0の固定source `71584a6bd0c8852885157de71032fd9252e7a04c` の1章2話を、第1話クリア済みの正当な私有saveから継続して新規に実収録する。音楽主題動画は作らず、108の独自BGMはゲーム紹介の背景素材としてのみ使う。

本ディレクトリは **段階1（約10秒pilot）の原本と記録** を置く。Rootが実画像を目視してGOを出すまで、full収録・本レンダー・公開には進まない。

## 収録の入口と保存領域

- `/home/pui/tmp/projectp117-capture-20261026/product` は、GitHubの固定commit archive（`EMBERWAKE-71584a6.tar.gz`）を展開した専用コピー。`project.godot` はpristine（読取専用444）に戻し、`.godot` import cacheのみ生成した。ゲームのcore72ファイルは `qa/product-source-before.json` のSHAと照合し、pilot前後で変更0。
- Godot 4.6.3 と Linux専用Xvfb を使う。Windowsのゲーム、共有デスクトップ、ownerの保存データ、稼働editorは操作しない。
- 第2話は第1話クリアが前提のため、既知の112私有save（completed[1]/selected1、SHA256 `f5eae6b0b22ff83476b9d9e7846ce6da6fef79f53ebf0fadfdefcf875afb1494`）をbyte一致で専用117 userdataへseedする一回の継続経路だけを用意した。未知save・上書き・別prefixは拒否し、製品のexisting-saveガードを一般には無効化しない。

## pilot driver（`source/capture-ep2-pilot.gd` / `source/run-ep2-pilot.mjs`）

- main scene読込前に、実 `OS.get_user_data_dir()` と `user://` の保存先が所有117 prefix内であること、継続saveが存在し期待SHA256に一致することを照合する。外れれば読込前に失敗する。
- 実 `InputEventKey`（TAB/ENTER）と実physicsだけで、タイトル → グリッド「1:2」押下で第2話選択 → 「物語を進める」 → 会話3頁（アッシュ／ルミ／アッシュ）を「次へ」「次へ」「出発」 → play到達、まで進める。内部の `start_game`・会話advance直呼び、座標・進行・時計の書換えはしない。ゲーム値は読み取りのみ。
- 300枚/約10秒（30fps）を収録して正常終了する。壁時計上限90秒、枚数上限420。出力は実PNGと入力/観測原票。

実行例（Rootのpilot目視後にのみ後続のfull段階へ進む。本driverはpilot専用）:

```sh
node source/run-ep2-pilot.mjs <未使用の試行名>
```

同名試行は再利用しない。各試行は未使用の出力・XDG data/config/cache prefixを使い、userdataへ既知saveをseedする。

## 段階1 の実測（`qa/ep2pilot04-*.json`, `qa/pilot-root-review.json`）

- status `PASS_PILOT_PENDING_ROOT_VISUAL_REVIEW`。selected_episode=2、state=play到達、frame_count=300。
- continuation seed（112私有save）自体は不変で `f5eae6b…`（読込前 `save_sha256_before_scene`）。ただし117pilot内の実saveは通常の「1:2」選択で `selected=2` へ更新され、収録後SHA（`save_sha256_after`）は `4bbe2b36…` になる。初報の「読込前・収録後とも同一」は誤りで訂正した（元seed不変とpilot内saveの通常更新は別物）。core72 before/after SHA 同一（変更0）。
- 確認画像（実在する絶対パスは `qa/pilot-root-review.json` に記載。本リポには生PNGを置かない）:
  タイトル(1:1✓/失った記憶1/15) → 第2話選択(1章2話 ふたりの合図) → 会話「出発」 → play開始(1:2 OUR LITTLE SIGNAL / EXPLORE 00:00.00 / » SHIFT / X)。
- PNG保存待ちがゲーム内壁時計HUDに含まれるため、RTA/PB・人間の初見プレイの証明ではない。ゲーム音はDummyで未収録。

## 段階2 full 実収録（完了・Root画像レビュー待ち）

Rootのpilot合格（[#117 comment](https://github.com/Pui-core/-/issues/117)）後、`source/capture-ep2-full.gd` / `source/run-ep2-full.mjs` で第2話を最後まで実収録した。pilotと同じ固定source・save SHA・専用Xvfb・read-only観測の制約を維持し、実 `InputEventKey`（TAB/ENTER/A/D/SPACE/X/E）と実physicsだけで進めた。

- 一本の問い「第2話の急な二段の近道、ダッシュで渡れる？」の答え: **はい**。switch0点灯で実体化する任意2枚の近道（branch0 `(641,980)` / branch1 `(795,932)`）を、開始時から有効なdashで越えた。1枚目へdash着地 → steepな2枚目gap（辺50px・上48px）をdashで越えて通常ルート上段 `route[6](810,924)` へ合流 → 同じ次の島 `route[7]` へ。通常の3枚の道と任意2枚の道は同じ島を共有し、合流帯で重なる。
- 結果: `ep2full03` が完走。`hearth_lit [0,1,2]` / `switch_lit [0,1]` / **落下0** / dash2回 / 1745枚（30fps）/ `state` は手帳後に `title`。core72変更0・`exitCode 0`。詳細は `qa/ep2full03-capture.json` / `qa/ep2full03-launch.json`。
- 失敗の保持（初回成功にしない）: `ep2full01`=branch-a dashでjump early-cutにより落下（FAIL保持）、`ep2full02`=branch-aはapex timing修正で成功、branch-bは収束帯route[6]着地が厳格判定で未合格（FAIL保持）。原票はいずれも私有workspaceに保持。
- 生PNG原本・Root向け画像セット・絶対パスは `production-root-review.json`（本リポ `qa/` にミラー、生PNGは私有 `ep2full03/frames` と `ep2full-review/images`）。Coderは dash airborne / 合流 / 完了（落下0）/ 手帳 の実画像を目視済み。
- HUD clockはPNG待ち込みでRTA/PB・人間初見の証拠ではない。ゲーム音はDummyで未収録。

## 未着手（Rootの最終画像レビュー後）

- native横動画（PhotoCraft/EffectCraft/FilmCraft）・対応Short・TikTok版（フォロー案内）・F納品（`ProjectP-Episode2-2026-10-27/revision-01`）・最終MP4 QA・公開。音楽主題動画は作らず、108 BGMは背景素材のみ。
