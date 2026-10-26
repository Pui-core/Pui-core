# Live2Dアバター（Revenant_Natural）口パク/表情オーバーレイ：未収録（要素材提供）

## 結論
本Shortは**実キャプチャ映像＋VOICEVOXナレーション＋字幕＋自作BGM**で完成させた。
Issue本文/引継ぎが求める「Revenant_Natural実CubismCoreの口パク/表情アバター」オーバーレイは**今回のオフライン・承認範囲では収録できなかった**ため未同梱とする。偽の静止/既存idle流用で「新ナレ同期の口パク」と称さない。

## 具体阻害（再現確認済み）
- `promotion/.../source/AvatarCore.java` は `com.live2d.sdk.cubism.core.*`（Live2D Cubism **SDK for Java** の `Live2DCubismCore.jar` ＋ネイティブ lib）を要求する。
- `live2d-agent-kit/scripts/render_core.sh` も `CUBISM_CORE_DIR`（別途入手した `Live2DCubismCore.jar` ＋native）を必須とする。
- 全ドライブ検索で `Live2DCubismCore.jar` は**存在しない**（`/mnt/c` `/mnt/f` `/home/pui`）。導入済みの `Live2D Cubism 5.3` は編集アプリで、同梱は `Live2DCubismCoreJNI.dll` のみ。`com.live2d.sdk.cubism.core` の Java クラス jar は含まれない。
- モデル実体は在る：`/home/pui/tmp/revenant-balance-20261018/final-runtime/Revenant_Natural.moc3` ＋ `Revenant_Natural.8192/texture_00,01.png`（LipSync=ParamMouthOpenY）。
- 従来の Revenant 描画は **VTube Studio（共有Windows GUI）** 経由（`README_使い方.txt`）。本件引継ぎは「共有WindowsGUI/SNS/runtime/lease 操作は0」を禁止しており、GUI経路は範囲外。SDK jar の新規ダウンロードはライセンス同意を伴う外部取得のため自動実行しない。

## 解除条件（Rootへの引渡し）
1. Live2D Cubism **SDK for Java**（`Live2DCubismCore.jar` ＋ Linux用 `libLive2DCubismCore` もしくは Windows native）を入手し `CUBISM_CORE_DIR` を設定、private配置する（publicGitへは入れない）。
2. その後 `AvatarCore.java` を javac/コンパイルし、`source/narration-cues.json` の語頭語尾から `ParamMouthOpenY` を同期した params CSV を生成→口パク/表情フレームを headless 描画。
3. EffectCraft の comp にアバターレイヤーを追加（図形→モデル→重要文字の順で、字幕/モデルが額・花・日記を隠さない配置）→ FilmCraft で再export。編集原本・QA・SHAは本リビジョンの手順をそのまま拡張する。

上記が満たされれば、同じ `build-visual.jsx` / FilmCraft 手順にアバターレイヤーを足して revision-02 として再納品できる。
