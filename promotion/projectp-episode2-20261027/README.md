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

## 未確認（後続のfull段階、Root GO後）

- ふたりの合図の任意2枚分岐 → dash → 通常経路合流 → 結果/手帳は未収録。急な二段近道をダッシュで渡れるかの実挙動は未検証。到達・転落・合流・結果は実収録に従って決める。
- 横動画・対応Short・TikTok（フォロー案内）・納品・品質検査・公開は、Rootのpilot判定後に117本文で再依頼する範囲。
