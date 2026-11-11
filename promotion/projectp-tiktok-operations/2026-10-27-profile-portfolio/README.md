# ProjectPのプロフィール更新記録（保存失敗・HOLD）

[管理Issue125](https://github.com/Pui-core/-/issues/125)の固定記録。本人[`prop_pui`](https://www.tiktok.com/@prop_pui)の自己紹介を、現在のゲーム・アプリ発信へ揃える作業。**実更新は未完了**。

旧自己紹介（編集欄の実値、改行を保持）:

```text
ゲーム・道具・曲を作る、ぷい。
『EMBERWAKE』制作の裏側を毎日。
CAMPFIRE公開準備中｜次の一手をフォローで。
```

新しい候補（71文字・未反映）:

> ゲーム・アプリを作る、ぷい。EMBERWAKE／嘘か誠か／ScateRush／missyou。作品の仕掛けと更新を実画面で。続きをフォローで。

Rootは自己紹介だけを入力し、通常の保存を計2回実行した（再試行1回）。どちらも「不明なエラーが発生しました。もう一度お試しください。」と表示された。1回目の取消・通常再読込は **2026-10-27 06:27:44.6883039 JST**、2回目後は **06:29:58.6614673 JST**。どちらも旧bioを表示し、新bioや未保存編集欄はなかった。正確なUTC、方法、原票SHAは[profile-update.json](profile-update.json)を参照。保存ボタンのInvoke実行やexit0を、保存成功へ読み替えない。

ハンドル・表示名・リンク・アカウント種別への変更操作は0。投稿・予約・Promote・課金・新アカウント・認証抽出も0。本source担当はGUI/ブラウザ/プロフィール/runtime/leaseを操作していない。旧動画・既receipt・他worktreeは変更しない。

同じ本人プロフィールの通常再読込後、アカウント全体のおすすめ対象外バナーは見当たらず、フォロワーは0表示だった。個別動画の案内なし・スマホ0というowner報告やAccountCheckとは別の観測で、推薦適格性・0再生の原因・保存エラーとの因果を確定しない。

記録の形式・原票SHA・source/F一致は[record-validation.json](record-validation.json)に分ける。**実保存未完のためDraft/HOLD、自己レビューはCHANGES_REQUESTED**。新bioが実保存され、通常再読込で一致することを解除条件とする。親93の成長目標は継続し、本記録を効果や人数目標達成の証明にしない。

私的原票の内容・画面全体・clipboard・ブラウザ固有identity・lease内容はsource/Fへ含めない。原票はbasenameとSHAのみで参照。Fは新しい専用フォルダ `F:\Videos\ProjectP-Operations-2026-10-27\profile-portfolio-125\` への文書追記だけ。
