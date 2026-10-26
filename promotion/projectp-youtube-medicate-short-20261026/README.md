# medicateの聴き比べから、完成MVへ

[Shorts用23.1秒](videos/mix-process.mp4) ／ [カバー](covers/mix-process-cover.png) ／ [再生ページ](index.html)

同じ歌のV5/V6を同じ区間で2回聴き比べ、最後に完成MVへつなぐYouTube向けの動画です。本人の実制作記録と実音源を使い、架空のDAW操作や反応は作っていません。旧TikTok版の動画・19:15予約・原本は変更していません。

**制作・技術検査は完了、YouTubeの実機表示・関連動画設定・実公開はRootの確認待ちです。** この納品だけでクリック導線・登録者増加・収益化を達成したとは扱いません。関連動画機能が使えない場合は、終端と投稿文を原本から修正してから公開します。

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
- `source/youtube-metadata.json`、`title.txt`、`description.txt`：投稿用の下準備。関連動画IDは実設定までnullです。

## 確認した範囲

1080×1920、30fps、693frame、23.1秒の全AVdecode・AAC/PCM対応・全3loop境界ROIを検査。ECのA/B表示、カバー、終端と最終encoded680frame、Fから再描画したFC終端を目視しました。YouTubeの実操作列・説明域との重なり、実時間全編視聴、直接全編試聴は未確認です。

`qa/frozen-delivery-binding.json`が最終媒体と原本のSHA、`qa/crosspost-audio-identity.json`がAAC完全一致、`qa/technical.json`・`audio-final.json`が技術検査、`qa/native-reopen.json`が納品先の3Craft確認、`qa/delivery.json`が全納品fileの対応です。

## 再出力

既設Windows PhotoCraft/EffectCraft/FilmCraftとFFmpegを使います。元の承認済みMIX99から描画済みlistener・比較音声・波形を準備し、新しい専用folderで実行します。既存TikTok納品を出力先へ指定しません。

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
