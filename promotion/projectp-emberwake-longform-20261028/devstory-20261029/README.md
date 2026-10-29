# EMBERWAKE 制作秘話（管理146）

管理: https://github.com/Pui-core/-/issues/146

10分32秒の制作秘話を完成し、NASへ動画1本を納品。旧v07の攻略・解法紹介を改稿し、入力の反応・旅人の原画と画角・手放す操作・入力案内を、実制作記録と比較映像で紹介する。投稿は未実施。

## 納品

- NAS: `\\100.105.2.75\private\work\videos\2026-10-29\エンバーウェイク\1057_制作秘話_テンポ改稿_v01\BGM版.mp4`
- SHA256: `a9904191f195e47f060bca912f8de7fe8ee076ddb0d95f991b98d5d95656aa8f`（40,613,375bytes）。Source/NAS一致、NAS直接全AV decode0、NASの当該folderはBGM版.mp4だけ。
- 632秒 /18960frame /1280×720 /30fps /H.264＋AAC48k stereo。正式FilmCraft保存・再読込・全編export、最終MP4全AV decode0。
- 52句の実AAC頭尾と元声の残差相関最低0.997709、全mix窓最低0.996587、lag全0。TruePeak−2.4dBFS、Integrated−23.4LUFS。句内無音のmiddle低相関は別記し、声の欠けと混同しない。
- 最終MP4由来100枚のsampled stillとNatural15frame連続cropを実見。頭/UI/CTA/注記の被りなし、口と瞬きの変化を確認。主観通し試聴・創作採用・公開・維持率/登録/実売上は未確認。

## 原本と制作

実素材/原本/QA: F:/Videos/ProjectP-EMBERWAKE-DevStory-2026-10-29/devstory-v01/ 。正式FCはprojects/emberwake-devstory-v01.fcproj。正式PhotoCraft/EffectCraftと修正前後MOV、声、音、Coreは保全し、新PVへ使える動く素材も削除しない。local final exportの整理はRootのNAS票照合と依存終了後だけ。

公式同tag Linux3Craft CLI/privateXvfb/専用XDG/Wayland・DBUS未接続、CPU経路で保存/再読/描画した。Naturalは正式Core390frame、新声のglobal619–632秒RMSから実動作。SDK/MOC/model/Raw画像・音・他者素材や私的UIはGit/NASへ含めない。NAS保存のみRootの証明済みWindows背景pureFS＋CreateNoWindow子decodeを使用し、工程全体をWindows exe0とは扱わない。共有マウス/global key/前面化/focus変更0。

## 限定差し戻しと修正

- 冒頭の誤読/音重複、Vの同画反復/補間、注記二重、章の内部記号を修正。採用台本はmetadata/採用台本-632秒.json。原cue案は提案履歴。
- J09を着地後だけの実指標（旧:再跳躍なし/新:18.64px）へ、J11の実文字boundsとJ12見出し重複を修正。独立した同3frameで解除確認。
- 保存原本のtimeRemap全キーを有限走査し、表示中の既定中間キーが残るC9層/冒頭2層のみ2端点へ修正・再読。実Q/E時刻と4実画像を照合。変更区間だけNative範囲描画し、区間外ProRes全payload保持/連続PTS/各章frame数/全decodeを検査した。
- 初稿BGMは枝単独では非零だがamix後に章配置が崩れた。初稿を保全し、4章を独立local PCM→Node global sample配置へ修正。52句すべて曲非零、声/曲最低14.049985dB、voice全sample不変。現行はsource/full-audio-repair.mjs、full-audio.mjsは初稿履歴。

## 公開用文案と範囲

metadata/公開文案.md に正式CAMPFIRE URL https://camp-fire.jp/projects/993744/view の支援告知を先頭へ追加し、既存credit/章を保持した。metadataだけの追記で動画を再exportしていない。作品は制作中と紹介し、未確認の配信/特典/納期/実機成功を加えない。Rootが実際の公開を担当する。

実差先出し→条件/問題→実比較→短い図解→別条件で回収し、解法の順序・出口・COMPLETE・後半物語を伏せた。入力fixture/相対着地条件/模擬UI/仕様図解を普通の手動プレイやphone/pad試験へ読み替えない。参考channelの型を自作素材へ適用し、他者映像/台詞/音を転載しない。技術検品を面白さや成長の認定へ昇格しない。
