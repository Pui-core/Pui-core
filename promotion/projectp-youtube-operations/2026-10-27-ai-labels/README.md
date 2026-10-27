# YouTubeの改変・合成コンテンツ開示を内容別に判断する

管理：[Issue128](https://github.com/Pui-core/-/issues/128)。ownerの2026-10-27「youtubeの動画にAIタグつけなくていいよ」を受け、ProjectPの実ゲーム/アプリ紹介へ一律にONとしていたYouTube Studioの開示設定を改める。ここで扱うのはネイティブの改変・合成コンテンツ設定で、タイトルのハッシュタグ削除やナレーションcredit削除ではない。

## 方針と対象

Rootは[YouTube公式の開示基準](https://support.google.com/youtube/answer/14328491?hl=ja)の現行日英本文を確認した。ゲームプレイ、明らかに非現実的なアニメーション、制作支援等の不要例に該当する実作品紹介は、AI利用だけを理由に一律ONにしない。今回の9候補は実ソフト画面、明確なLive2D、特定の本人を詐称しないナレーションによる紹介で、実在の人物/事件のリアルな偽装や音楽主題の動画として扱わない。

現実に見える人物・出来事の偽装やAI生成音楽等、公式基準に照らして開示が必要な内容は別途内容を判定する。他者が付けていないことを適用根拠にしない。必要なVOICEVOX/モデル/背景等creditは維持する。これはYouTubeの方針改定であり、TikTok等の開示設定を一括変更する指示ではない。

`targets.json` は9実IDと既存記録の参照、Rootによる今回の保存・再読込の受入状態を保持する。過去の公開/予約receiptにあるAI ONは当時の履歴として上書きしない。過去の題名や実施済みを新しい事実へ読み替えず、今回変更する設定を限定する。

## 証跡を受領する条件

- Rootのみが通常Studioで本人channel/実ID/実内容を照合し、開示OFFを保存した後、通常再読込で確認する。
- 公開/予約状態・予約日時・既存Relatedを保持する。TruthOrLie Shortの本編Related接続は別Issue123の公開後タスクであり、本件の完了に混ぜない。
- ファイル再添付・再投稿・新規公開送信は0。自動ラベル等により変更できない対象は突破せず未完として記録する。
- 全9件を実証できるまでDraft/HOLD。未確認はfalse/nullで、成功件数へ含めない。

元動画/編集原本/F納品/immutable公開・予約receiptは不変。本件のF記録は `F:\Videos\ProjectP-Operations-2026-10-27\youtube-ai-labels-128\` へ別追記する。source担当はGUI/browser/runtime/lease/SNS操作を行わず、raw原票・UI・clipboard・ブラウザ固有識別子・lease情報をsource/Fへ複製しない。参照する原票は非秘密の識別名とSHAで結ぶ。

準備時head `5784c606fa91b7f0069c8d7240ea57e6b64ea7d4` の0/9は履歴として保持する。現在は実OFF3/9・残6件で、非AI設定の必要な再照合も未完のためDraft/HOLD。継続指示正本/PMcacheの方針反映を読取確認した。人数・視聴・収益化の効果は未計測である。

## 確認済み3件の別追記

`observations/2026-10-27-confirmed-3/` にRootの非秘密metadata要約を保存した。hEAgMuUNNLAは08:58:15 JST、pg8Ih4PAOBwは08:59:48 JST、a0TstalrQ64は09:38:57 JSTに実toolbar更新後のNo保持を独立確認している。旧controllerのHOLD原票は修正しない。未保存のNo選択が見かけだけだった、という原因の断定はしない。

a0は全6Editfieldsと他12非AIcontrolsが一致した一方、audience radioのgetterはfalse/Off→true/Onと異なる。保存前後の明示本文は「子ども向けでない動画として設定」で一致し、元upload時のnative Noとも整合する。raw fingerprint一致とは記録せず、意味上の保持と分けた。

前2件の公開/予約状態・全metadataは今回の票では完全再照合していない。別件129の品質保留による旧Truthの非公開化と、本件AI操作が公開/予約を変更しない意図は分ける。元予約票は当時の履歴で、現在状態を示す票へ上書きしない。全9件のNoと必要な他設定保持が揃うまでAPPROVE/ready/merge/closeを行わない。
