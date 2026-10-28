# MISSYOU：開けない手紙から今日のページへ v05

管理 Issue: Pui-core/-#136。制作物の完成と、投稿先での試聴・音源指定・公開後の成果を区別する。

## 現在の完成動画

完成動画の保存先は `\\100.105.2.75\private\work\videos\`。2026-10-28 20:44 制作の 2 本だけを保存し、Windows Get-FileHash の一致、NAS 上を直接読む FFmpeg 全デコード exit 0、動画だけの一覧を確認済み。2026-10-28 20:51 JST、receipt とローカル / NAS の両 SHA を再照合後、許可されたローカル最終 MP4 の 2 本を実削除した。以後の視聴・投稿準備・追加確認は下表の NAS パスを使用し、削除済みの `revision-05-final/videos/missyou-story05-{voice,bgm}.mp4` を現在の納品先として案内しない。

ローカルの原本・ProRes・WAV・依存素材・QA と他 revision は `F:\Videos\ProjectP-Missyou15-Preview-2026-10-28\` に保持。最終 MP4 は Craft 原本の入力ではなく、削除で原本の依存は変わっていない。ローカルで制作を再開する場合に限り `render-story05.mjs` で再出力する。過去の出力時 QA にある F のパスは、その検査を実行した時点の履歴である。

| 用途 | ファイル | SHA-256 |
| --- | --- | --- |
| TikTok でのネイティブ音源追加用 | `20261028_2044_ミスユー_手紙体験_構成改_v05_声のみ.mp4` | `fe72eeb533208d585ac2cc02c4477b1ba046223f94b5dd43b2e9b694f310f989` |
| BGM を含む動画 | `20261028_2044_ミスユー_手紙体験_構成改_v05_BGM.mp4` | `e3bb792f11fa7d5ec31955e15ac86b6a4d0b1c510fc5307263779b0d386419ec` |

納品 receipt は NAS の videos に入れず、`F:\ProjectP-制作記録\NAS登録\20261028-ミスユー-v05-{BGM,声のみ}.json` に保持。両 receipt の `sourceDeleted=true`、`sourceDeletedAtUtc`（BGM: `2026-10-28T11:51:30.2886743Z`、声のみ: `2026-10-28T11:51:30.3813508Z`）を確認。保存・SHA 照合・NAS 直接デコードの再現スクリプトは同じ制作記録側の `archive-video.ps1`。実行ポリシーは変更していない。

両版とも H.264、1080×1920、30 fps、映像 404 フレーム / 13.466667 秒。AAC は 48 kHz ステレオ / 13.482 秒。FilmCraft の offlineMedia は空、全編のデコードは成功。

## 構成と実素材

| 時刻 | 見せるもの | 役割 |
| --- | --- | --- |
| 0–0.967 | アプリ同梱の部屋入場アニメーション | 手紙の部屋をすぐ見せる |
| 0.967–2.867 | 相手は送信済み、自分は未送信の実 QA 画面 | 「この手紙、まだ開けない」という問い |
| 2.867–4.333 | 実際に「ありがとう」が選ばれる状態変化 | 自分の行動を見せる |
| 4.333–5.767 | 選択後の「封をする」へ寄る編集カット | 視線を操作対象へ運ぶ |
| 5.767–7.2 | 実 QA で双方のページが完成した状態 | 冒頭の問いを回収 |
| 7.2–9.6 | 2つのスタンプと短い文へ寄る編集カット | 日記になる結果を見せる |
| 9.6–13.467 | アプリ名、制作中の状態、作者モデル、フォロー案内 | 続きを見る理由を一つに絞る |

実操作の出典は、初回に成功した隔離 QA の `testB_StampOnlySealOpenDecorateAndRestart`。テストは相手の本文が送信前に表示されず、スタンプを封じた後に表示され、再起動後も参照できることを検証した。外部通信監査は 0、専用端末は既に Shutdown / cleanup 0 の記録がある。

元の `Aoi QA`、`QA178_FROM_AOI` は自分たちの QA fixture の値であり、広告中では PhotoCraft で名前「みお」と架空文「帰り道の空が、きれいだったよ。」に置き換えた。UI、スタンプ、ボタン、アプリのルールは元の実録を保持。動画に「開発版・架空例（名前と文面を編集）」を表示する。生録画と未加工のフレームを NAS / Git へ保存しない。

使った実 PTS は 152.132–153.05 秒（未選択）、153.58–153.8 秒（選択）、156.94–158.2 秒（完成）。録画の待ち時間は hard cut で省略し、存在しない開封アニメーションは作っていない。収録済みフレームの静止保持を、連続したアプリ操作と呼ばない。

## 音声と音楽

- 声は `VOICEVOX:玄野武宏`、実エンジン一覧のノーマル ID 11、エンジン 0.25.1。青山龍星の旧版と WAV は保全。人物の肉声や口パクとは呼ばない。
- [VOICEVOX の規約](https://voicevox.hiroshiba.jp/term/) と [VIRVOX の VOICEVOX 利用規約](https://www.virvoxproject.com/voicevoxの利用規約) を参照し、動画と投稿文で声のクレジットを示す。青山龍星固有の申請条件を本版へ持ち込まない。
- BGM は [Daybreak / PeriTune（むつき醒）](https://peritune.com/blog/2015/11/07/daybreak/)、125 BPM。[現行利用案内](https://peritune.com/about/) を確認済み。開始 0.510 秒、声に合わせた ducking、末尾の伴奏をフェード。元 MP3 SHA は `abcb4ace07ebe6813cfc0ca9773514ddd3c6a2e535cd3b4fcdf0cf643179c2eb`。
- AAC の実測は声版 -22.4 LUFS / true peak -4.5 dBFS、BGM 版 -21.9 LUFS / true peak -2.0 dBFS。声版の最後の有声は -45 dB 判定で 12.127 秒まで、動画終端まで約 1.35 秒の余白。BGM 末尾の無音は約 0.071 秒。これを主観的な聞きやすさの確認へ読み替えない。

## 確認した範囲

- PhotoCraft の名前・文面オーバーレイと表紙の保存、ネイティブ再読込 / PNG 出力。
- EffectCraft の F 上の原本再読込、404 フレームの ProRes 出力。
- FilmCraft の声 / BGM 両原本の F 上の再読込、MP4 出力、素材欠損なし。
- 実 MP4 からの全秒シート、選択→封→完成の 10 fps 連続シートと重要時刻フレームを目視。名前と本文の置換が対象領域にとどまり、広い UI と完成の文脈を残すことを確認。13.4 秒の実フレームも正常。全秒シート末尾の黒は未使用の tile 枠であり、動画の黒画面ではない。
- 原本、動画、音声、実測の対応は `qa/story05-final-bindings.json` と `qa/story05-technical-summary.json` に保存。

全編を実時間再生しての直接試聴・TikTok の実表示・TikTok 内の楽曲指定は未実施。投稿や予約も未実施。開発版を一般公開版と断定せず、未確認の Store URL を追加しない。再生数や登録者への効果は投稿後に測る。

## 再生成

`PROJECTP136_ROOT` を制作領域に設定し、必要素材がある状態で実行する。`source/final05-shots.json` がカットの時刻・画角、`source/voice-story05-kurono-*-query.json` が現在の声の query。

1. `voice-story05.mjs`：ローカル VOICEVOX の現在の一覧を照合し、新しい声を生成。
2. `mix-story05.mjs`：声と許諾済み Daybreak をミックス。
3. `picture-final05.mjs`：実収録から作成済みの安全なショットを EffectCraft へ配置。
4. `render-story05.mjs`：EffectCraft の映像を FilmCraft で 2 版へ出力。
5. `qa-story05.mjs`：最終 MP4 のデコード / 形式 / 音 / 画像シート。

`shots-story05.mjs` は生録画を私的な保管先から読むため、素材再作成が必要な時だけ使う。ファイルがなければエラーで止め、ダミー映像で置き換えない。

## 投稿文案

この手紙、ふたりが送るまで開きません。
スタンプをひとつ送ると、今日のページが完成。
新しい missyou の部屋を制作中です。
開発の続きをフォローしてね。

開発版・架空の例です。名前と文面は編集しています。
声：VOICEVOX:玄野武宏
BGM：Daybreak / PeriTune（むつき醒） https://peritune.com/blog/2015/11/07/daybreak/

#missyou #アプリ開発 #交換日記 #ProjectP

## Mac 再ビルドの終了

公開可能な別 fixture のビルドは前回 900 秒で中断、今回の差分再開も Xcode のプラグイン初期走査待ちで進まず、所有確認後に終了。再開 wrapper 41498 / xcodebuild 41705 の終了、resume-work 143 / cleanup 0 を確認。新しい Simulator は作成・起動していない。共有サービスや所有不明の端末を再起動せず、完成には既存成功収録を用いた。
