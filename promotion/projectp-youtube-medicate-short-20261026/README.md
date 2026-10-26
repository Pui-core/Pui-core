# medicateの聴き比べから、完成MVへ

[Shorts用23.1秒](videos/mix-process.mp4) ／ [カバー](covers/mix-process-cover.png) ／ [再生ページ](index.html)

同じ歌のV5/V6を同じ区間で2回聴き比べ、最後に完成MVへつなぐYouTube向けの動画です。本人の実制作記録と実音源を使い、架空のDAW操作や反応は作っていません。本Shortsの制作時には旧TikTok版の動画・予約・原本を変更していません。今回の他serviceの取消操作はRoot担当で、本source担当は実行・確認していません。

**現在の状態：owner_hold_no_publication／音楽関係の動画は投稿しません。** 2026-10-26のowner指示「完成MVも含め、音楽関係の動画は投稿しない」により、本Shortsの公開許可も撤回されました。公開待ち・Rootへの投稿queueではありません。動画・音・カバー・編集原本は制作履歴として保全し、新たな投稿・関連動画設定を行いません。公開再開には、この保留を変更するownerの明示指示が必要です。

現在の正本は [公開保留の記録](source/publication-status.json) と `source/youtube-metadata.json`。以下の制作・検品・導線計画は保留前の履歴です。`qa/frozen-delivery-binding.json`のREADY表示は当時の技術準備snapshotで、現在の公開許可ではありません。元のdelivery receiptはbyte一致で履歴保存しています。

Rootが12:51:59 JSTに本人Studioの上級者向け機能有効を確認した事実は履歴として残しますが、MVの実ID・関連動画設定・公開の証明にはしません。YouTube公開IDと公開receiptはnullのままです。ゲーム・アプリの背景素材としての自作BGM制作（108）は別範囲で、本変更では編集していません。

## 音と比較

- 0〜2.4秒は問い、2.4〜6.3秒がA、7〜10.9秒がB、11.6〜15.5秒が同じA、16.2〜20.1秒が同じB、20.1〜23.1秒が完成MVへの案内です。
- 元のMIX99で確認した21.30〜25.20秒、A−0.33dB/B0dB・共通−1dB・同じ導入/末尾envelopeを保持。V5/V6では余韻と強弱処理が異なり、リバーブだけを変えた単一条件の実験ではありません。
- 比較WAVは元のbyteを再利用。最終MP4から取り出したAAC 932,413bytesも、元の承認済みMIX99のAACと完全一致しました。2回のA/BはそれぞれPCM一致、4区間のAAC照合はlag0です。
- 最終音量は−13.7 LUFS、true peak−2.0dBFS。別BGM・SE・VOICEVOXは重ねていません。数値とAAC一致は主観的な直接全編試聴の証明ではありません。

## 原本とモデル

PhotoCraftで新しいモデル入りカバーを制作し、元の実PCM波形2点の原本を新しい納品先で再保存・描画しました。EffectCraftで案内・比較表示・カーソル・終端を描画し、FilmCraftで映像と元の比較WAVを別trackへ一度ずつ配置しました。専用F納品から3Craftを再読込・保存・描画し、欠損素材0を確認しています。

指定Revenant_Naturalは元MIX99で実Cubism Core 06.00.0513から描画した180枚・6秒のlistenerを再利用しています。今回Coreを再描画した数は0です。口は閉じ、瞬き・首・呼吸の編集で、歌唱の実演やカメラ追跡とは説明していません。元Core/alpha検査の記録は由来として保持し、今回の新規実行と区別します。rawモデル・SDK・原曲全体・raw beat/stemは追加配布しません。

- `projects/mix-process.ecproj`：映像・案内・終端
- `projects/mix-process.fcproj`：最終映像と実比較WAV
- `covers/mix-process-cover.pcraft`：専用カバー
- `source/edit.json`：区間・条件・終端文
- `source/youtube-metadata.json`、`title.txt`、`description.txt`：投稿用の下準備。保留前の投稿準備データです。現在の公開保留を変更せず、動画ID・関連動画IDはnullのまま保持します。

## 確認した範囲

1080×1920、30fps、693frame、23.1秒の全AVdecode・AAC/PCM対応・全3loop境界ROIを検査。ECのA/B表示、カバー、終端と最終encoded680frame、Fから再描画したFC終端を目視しました。YouTubeの実操作列・説明域との重なり、実時間全編視聴、直接全編試聴は未確認です。

`qa/frozen-delivery-binding.json`が最終媒体と原本のSHA、`qa/crosspost-audio-identity.json`がAAC完全一致、`qa/technical.json`・`audio-final.json`が技術検査、`qa/native-reopen.json`が納品先の3Craft確認、`qa/delivery.json`が全納品fileの対応です。

## 履歴を再出力する場合

以下は保全した制作手順で、公開再開や自動投稿の許可ではありません。既設Windows PhotoCraft/EffectCraft/FilmCraftとFFmpegを使います。元の承認済みMIX99から描画済みlistener・比較音声・波形を準備し、新しい専用folderで実行します。既存TikTok納品を出力先へ指定しません。

```sh
node source/prepare-reuse.mjs
node source/cover.mjs
node source/picture.mjs
node source/render.mjs
node source/verify.mjs
node source/check-delivery.mjs
```

F納品は `ProjectP-YouTube-medicate-Short-2026-10-26/revision-01`。public checkoutで除外した大きなlistener/pictureは所有者のローカル素材から準備します。元のモデルを描画し直す場合は、元MIX99の手順と正規Core/モデルの利用条件に従います。

作者表記はowner確認済みの「曲・歌・MV：ぷい」。本人曲の利用許可からbeat単独作曲・独占ContentID・印税登録済みまで広げません。

管理：[Shorts110](https://github.com/Pui-core/-/issues/110) ／ [横MV109](https://github.com/Pui-core/-/issues/109) ／ [YouTube運用106](https://github.com/Pui-core/-/issues/106)
