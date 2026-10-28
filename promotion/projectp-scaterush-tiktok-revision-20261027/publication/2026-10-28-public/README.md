# ScateRush132：実公開のメタデータ確認

2026-10-28 21:50:22 JSTにRootが取得した[公式公開ページ](https://www.tiktok.com/@prop_pui/video/7701370032986524946)の匿名HTMLを照合。detail statusCode0、ID `7701370032986524946`、author `prop_pui`、`privateItem=false` を確認した。

公開itemの `createTime=1793157300` は **2026-10-28 12:15 JST**。予定時刻と一致するが、公開時刻の根拠は予定票ではなく公式公開itemのtimestamp。実際に12:15の画面を監視していたとの主張ではない。

## 予約・原本との対応

- 既存132予約票と公開itemのID・説明文が一致。正式App Store `https://apps.apple.com/jp/app/scaterush/id6779438091` と検索案内を含む説明文を確認。本文URLを実機でタップできるかは未確認。
- source動画SHA `c43434bc1250160faf86f092695bc5906d4fa2eccc43c7be58905fa29d2b5521` を既予約票で結んだ。公開後の再エンコード動画と原MP4のbyte同一性を証明したものではない。元の動画・音・3Craft原本・解析は変更しない。
- 公開item.musicに `id=7659693296944580646`、Digital Horizon / Blinking Frog Blast、track duration42秒、original=falseを確認。これは投稿メタデータ上の紐付けで、直接試聴・使用開始区間・BPM/拍・日本CMLの曲別地域条件の証明ではない。署名付き再生URLはGitに含めない。
- 送信前のowner回答「声と曲が聴こえ、テンポが自然」、nativeトラック/−12dB表示、music/content check成功は既予約票の過去の観測として保持。今回の全編品質や公開後の出音を新たに受け入れた判定ではない。

## 台帳差戻し PP132-LEDGER-P2

共有日次の変更前bytesをhistoryへ保存し、元予約票・取消票・132予約票のSHA不変を確認した。旧ID `7701100271014792466` は取消確認済み履歴とし、新132公開IDを別項目へ登録。新旧各1項目、重複計上0。sourceの [ledger-readback.json](ledger-readback.json) は関連2項目だけの再読込記録で、無関係な日次情報や原HTMLは含めない。

- 実公開24h：**2026-10-29 12:15 JST**。
- 実公開72h：**2026-10-31 12:15 JST**。
- 根拠は実公開item timestamp。予約からの仮dueを公開成功として先取りしていない。分析値はまだ未取得で、新たなcronや再投稿も行わない。

公開HTMLの各statsは取得時に0だった。これは匿名公開面の表示値であり、最新Creator Analytics・実再生の成功・推薦状態・0再生の原因を確認した結果ではない。再生数0から構成や音源の改善効果を判定しない。

## 継続する品質HOLD

PR65はDraft/自己レビューHOLDを保持する。日本CMLの曲別地域条件、確定したnative開始位置/BPM/拍、最終の全編品質、公開後の音と映像の直接試聴は未確認。公開された事実と品質・権利の残条件を混同しない。

[public-receipt.json](public-receipt.json) は共有のPUBLIC票とbyte一致。公開HTML・予約票・取消票・extractのhash、観測時刻、実公開とdueを保存する。原HTML・media・原音・認証情報はGitに含めない。この記録操作の送信回数・ブラウザ操作・lease操作は0。同じ動画を再送しない。
