# EMBERWAKE 正式本編（制作中）

[管理Issue127](https://github.com/Pui-core/-/issues/127)。旧82秒の112/117を保持し、同じゲームの忘却と第2話の任意ダッシュ枝を受け止める600秒以上の本編を新収録から制作する。未完成のため、ここにある計画を完成尺・全15話クリア・公開実績としない。

固定制作版0.12.0/source `71584a6bd0c8852885157de71032fd9252e7a04c`。最新公開製品とは未確認。ゲーム本体は変更せず、専用archive copyのcore72 SHAを照合する。既存owner save/稼働editor・他instance・旧raw・F納品へ書き込まない。

`source/run-capture.mjs` は新しい試行名と専用XDG data/config/cache、独立Linux Xvfbで1話だけ収録する。第1話は新規save。第2話以降は前の正常終了runの到達状態とsave SHAを検証して、新しいprefixへbyte一致で引き継ぐ。主scene読込前に実Godot userdata prefixを確認する。

通常Focus/Tab/Enterと方向キー/Space/X/Eだけで操作する。位置・進行・会話・時計の直接setterや開始callbackは使用しない。足場の実Rect/足元y/横位置を観測し、第2話の枝Bは上の通常足場を代用しない。1話720秒/6000framesの有限上限、失敗は原票ごと保持。同名出力/既存profileの上書きは拒否する。

まず1章3話のpilotを進め、実尺・自然に読める会話・異なる操作/結果が長尺として成立するか確認する。640秒や5章15話は予算/候補であり、実現済みとはしない。全話共通の3炉/2switchを15種類のパズルと呼ばず、固定版で実装されていない芯石運搬も説明しない。

ゲーム音はDummyで未収録。新VOICEVOX:青山龍星と自作BGMは背景素材として使用する。新声RMSから指定Revenant_Naturalを実Coreで描画し、重要なgame UIを隠さない。原モデル/SDK・音源・動画・rawsave・私的UIはGitに再配布しない。

SNS公開/予約/Related操作はRootのみ。本制作担当は共有Windows GUI/browser/runtime/lease/SNSを操作しない。技術検査と画像目視、全編の直接視聴/主観試聴、ownerの創作採用、公開後の結果を区別する。
