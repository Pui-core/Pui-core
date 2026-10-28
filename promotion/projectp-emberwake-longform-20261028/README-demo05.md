# EMBERWAKE：芯石５コースの完成稿

その石、どこに置く？ 橋と帰り道が変わるゲーム｜EMBERWAKE

完成動画は **606.485秒・18194フレーム、1920×1080/30fps、H.264＋AAC48kHz**。同梱デモ0.11の５コースを新たに11経路収録し、問い→選択→実結果・別ルート比較で構成した。15話キャンペーンの旧朗読稿、旧MP4・原本・raw・失敗記録は保全している。ゲーム機能の変更、Object_creator素材の混在、架空の入力結果はない。

NASの **納品構成版v05** と、同構成の **初回native export v01** を対応させている。NASフォルダーのv05を利用者向けの版とし、nativeファイル名demo05-v01は内部の書出し反復番号である。実ファイルは改名しない。

## 見る・公開準備

- [現在の再生入口](index-demo05.html)。NASの完成動画を先に参照し、Root用にFコピーも保持。
- [新しいタイトル・説明・章・credit](metadata/youtube-demo05.json)。私有ゲームrepoや配布可能という案内は含めない。ProjectPの公開チャンネルと同デモShort111へつなぐ。
- F公開準備：`/mnt/f/Videos/ProjectP-EMBERWAKE-Longform-2026-10-28/demo05-course-film/public-ready-demo05/`。表紙は`covers/demo05-cover-v02.jpg`、SHA256 `0d32f0f7e486d450861abdd34fa5514b86803d4753266c8b6d4ee4cff5bde28d`。
- Rootメディア受入：[管理127の判定](https://github.com/Pui-core/-/issues/127#issuecomment-6472751865)。公開/予約/Related実操作はRootのみ。制作側の新規公開は0件。

## 完成動画と保全

- **BGM入り**：`\\100.105.2.75\private\work\videos\2026-10-29\エンバーウェイク\0007_芯石5コース_実録構成改_v05\BGM版.mp4`
  - SHA256 `37ee9bbee9fc6479dcc38576068d2960f006b60446d1b2443598be747518f13b`、元ファイル不変、NAS直接AVデコードexit0。
- **声のみ**：`\\100.105.2.75\private\work\videos\2026-10-29\エンバーウェイク\0007_芯石5コース_実録構成改_v05\声のみ版.mp4`
  - SHA256 `82026446341844523b9fb1ebfde8480fe87b052dcdc20bf248cfa695144536ec`、元ファイル不変、NAS直接AVデコードexit0。

NASへ置いたのは上記MP4２本だけ。PhotoCraft/EffectCraft/FilmCraft原本・必要素材・WAV・画像・台本・ログはF制作領域に残し、Linuxの保全archive/専用copy/XDGも保持。Rootの次公開が終わるまでFの最終MP4を削除しない。

## 構成・根拠・検査

- [制作手順](source/demo05/)：既存Godot/Xvfbと製品の通常InputEventKeyによる有限収録。製品core72 SHA不変、専用開始状態/720秒上限/一意attempt/所有PID終了を原票に記録。固定source `71584a6bd0c8852885157de71032fd9252e7a04c`。
- [編集表](source/demo05/edit-plan.json)：５コース全11実録425秒弱を基に、新しい解説・対象への寄り・明示したリプレイ/停止比較を含む約606秒。新規の連続600秒プレイとは呼ばない。旧スクロールや全引用朗読を再使用していない。
- [実結果の照合](qa/demo05/semantic-evidence.json)：BのQ拒否と所持維持、C近/遠受け口、IIの合流、IIIの10→11→01、IV落下0/1・同じB所持、章の素材対応・clip境界。
- [F原本の再読込・保存・描画](qa/demo05/f-native-proof.json)：PhotoCraft３、EffectCraft７、FilmCraft２。F依存のみ、欠損0、FC８素材online。表紙は追加でEC描画→PhotoCraft保存/再変換。
- [最終声QA](qa/demo05/final-voice-qa.json) / [最終BGM版QA](qa/demo05/final-bgm-qa.json)：全AVデコード、76句×頭/中/尾、最大ずれ0sample、最小相関は声0.999371/BGM0.997909、意図しない全黒0。最終AACは声-16.2LUFS/TP-1.5、BGM入り-17.1LUFS/TP-1.3。
- [最終実画像の範囲](qa/demo05/final-visual-review.json)：重要画像と章シートを制作側・独立担当・Rootで確認。IV所持の説明を実設置前の停止図解へ修正、左注釈の余白と刻印１/２/３の静止画importを修正済み。全編通し視聴・主観試聴・公開後の成果は未実施。
- 声はVOICEVOX玄野武宏。BGMはPeriTuneのSecret Corridor/Rainwalkを背景利用。2026年３月以降の独自規約と公式配布SHA一致を再確認し、新説明文にcreditを記載。ゲーム音/SEは未収録。

旧114/117の忘却・dash題材の回収、フォロワー/YPP目標、公開後の改善は別工程として継続する。
