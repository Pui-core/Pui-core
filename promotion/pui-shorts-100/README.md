# ぷい / Project P 宣伝ショート動画100本

ぷい本人の「教える・作る・伝える」活動を紹介する、TikTok / YouTube Shorts共用の縦動画です。公式プロフィールの活動内容を基に、10テーマ・100種類の短いヒントと具体例を構成しています。

## 成果物

- `index.html`：動画の検索・テーマ別一覧・プレビュー・投稿文コピー。
- `videos/001-pui.mp4`〜`100-pui.mp4`：1080×1920、30fps、各18秒、H.264 / AACステレオ48kHz。
- `projects/`：EffectCraft / FilmCraftの編集原本、各100点。
- `posting-captions.csv`：TikTokの投稿文と、YouTubeのタイトル・説明文。
- `episodes.json` / `diagram-labels.json`：100本の構成と、各動画に合わせた図中文字。
- `qa/` / `manifest.json`：検査結果・主要4場面・成果物のSHA-256。

元の映像・音楽・編集原本をすべて保持する正本は、`/home/pui/Videos/Pui-Promo/2026-10-24/` です。Windows向けの納品コピーも別途保存します。Gitでは完成MP4・原本・制作コード・投稿文・検査結果・公式ロゴを管理し、大きな中間映像と再生成できる音楽ファイルは省きます。

## 制作経路

EffectCraft 0.14.0で図形・文字・公式マスコットをアニメーション化し、FilmCraft 0.10.0で各動画のオリジナル音楽を配置してMP4へ書き出します。開いているGUIを操作せず、独立したネイティブCLIプロセスを使用します。

音楽は制作コード内のシンセサイザーによる新規インストゥルメンタルです。図解は説明用のイメージで、顧客の画面・実績を再現したものではありません。

## 再生成

WindowsのFilmCraft・EffectCraft・FFmpeg / FFprobe、日本語フォントMeiryo、WSL上のNode.js 22を使用します。標準の実行ファイル配置は `produce.mjs` と `audit.mjs` に記載しています。別環境では該当パスを調整してください。

```bash
# 公式画像を含むmedia/を作業先へ置き、制作先を指定する。
export PUI_PROMO_ROOT=/home/pui/Videos/Pui-Promo/2026-10-24

# ソース・出所記録を納品先に保存。
node produce.mjs stage

# 完成済みかつソース・原本・MP4のSHAが一致するものを再利用する。
PUI_PROMO_JOBS=3 node produce.mjs run

# 全100本を検査。特定のIDだけなら末尾に 1,11,31 のように指定。
node audit.mjs

# 既存の個別検査を集約する場合。未検査・失敗があれば終了コード1。
node audit.mjs --summarize

# 実際の生成・検査記録から一覧と投稿文CSVを更新。
node gallery.mjs
```

`prepare` は編集原本と音楽を再生成します。既存原本は `checkpoints/` に退避してから変更します。`run` は出力SHAと最新の構成を照合して再開します。音楽の生成コードを変更した場合は、対象IDに対して `prepare`、`render`、再検査を順に実行してください。

## 編集原本の素材参照

原本は制作時の正本フォルダの `media/` を参照しています。Gitから完成MP4を見る場合に中間素材は不要です。原本を編集する場合はフル納品フォルダを保持するか、制作コードで素材を再生成してアプリ内で再リンクしてください。元の正本を作業用worktreeと一緒に削除しないでください。

## 検査

全MP4の全フレーム・全音声をデコードし、解像度・フレーム数・音声形式、黒画面、音切れ、音量とピークを確認します。両ネイティブ原本を別プロセスで開き、素材リンクと文字の実測領域を検証します。完成MP4の1.4 / 5.3 / 10.4 / 15.3秒の画像は、内容・読みやすさ・重なり・図中文字の目視確認に使用します。

技術検査、主要場面の目視、人による実時間試聴、実機での投稿結果は区別して記録します。未実施の試聴や各SNSでの再圧縮確認を合格とは扱いません。

## 一次資料

- [公式サイト](https://pui-wobbfet.top/)
- [本人プロフィール](https://pui-wobbfet.top/about/)
- [相談窓口](https://pui-wobbfet.top/contact/)
- [Project Pロゴ](https://pui-wobbfet.top/images/logo_p.png?v=20260121)
- [公式アイコン](https://pui-wobbfet.top/images/logos/icon-512.png)

本人名はowner指定の「ぷい」を使用。公式サイトでは「ぷぃ」と表記されています。
