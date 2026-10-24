# ぷい本人プロモ5本 V2

[再生一覧](index.html) / [台本](source/%E5%8F%B0%E6%9C%AC-%230085%E3%81%B7%E3%81%84%E6%9C%AC%E4%BA%BA%E3%83%97%E3%83%AD%E3%83%A2V2.md) / [本人ブランドの方針](%E5%AE%A3%E4%BC%9D-%230085%E3%81%B7%E3%81%84%E6%9C%AC%E4%BA%BA%E3%83%97%E3%83%AD%E3%83%A2V2%E3%81%AE%E6%96%B9%E9%87%9D.md)

実作品の対象へ寄る・追う・引く動きと、短い切り返しを加えたIssue85の試作です。01に実C#画面、02に本物のChatGPTの問いとBlender原本の確認を追加しました。01にはmedicateのサビを約3.4秒、05には実際の調整前後の聴き比べとサビ1句を使用。曲・歌・MVという制作範囲はowner確認済み。写真の被写体の本人断定や、beat単独作曲の追加クレジットは行いません。

## 再制作

WSLのNode.js、EffectCraft 0.14.0、FilmCraft 0.10.0、既存Windows FFmpegを使用します。保存済みのフル画角plate・mixから次の操作で再制作できます。

```bash
node source/produce.mjs prepare
node source/produce.mjs render
node source/verify.mjs
node source/make-index.mjs
```

元作品から切出しを作り直す場合は、sourceに記録した元ファイルが必要です。音源mixはsource/audio-v2.mjs（01）、audio-episodes-v2.mjs（02〜04）、audio-process-05.mjs（05）の専用経路を使用します。既存mixはplatesで上書きしません。

```bash
node source/produce.mjs plates
node source/package.mjs '/mnt/f/Videos/ぷい本人プロモ5本-V2-2026-10-24'
node source/verify.mjs --integrity-only
```

納品先からのverifyは、同じ完成動画SHAに結び付けた再リンク後のnative SHAを照合します。動画/audioのSHAも維持します。V1の納品は保持し、V2で上書きしません。

## 保存と確認範囲

完成動画はvideos、編集原本はprojects、フル画角plate・mix・tileはmedia、コードと台本はsource、検査とネイティブ描画証跡はqa。Gitから中間masterを除く場合はrenderで再生成できます。

各shotの画面と主要4箇所の連続18フレーム、最終AAC音量、A/V全デコード、素材欠損、納品先からのEC/FC再読込・保存・描画を別々に確認します。抽出画面の検品は全編の実時間視聴・試聴やownerの創作承認を意味しません。確認結果はqaの各technical.jsonとportable-package.json、最終監査を参照。SNS公開・予約投稿・プロフィール変更は未実行です。

管理: https://github.com/Pui-core/-/issues/85
