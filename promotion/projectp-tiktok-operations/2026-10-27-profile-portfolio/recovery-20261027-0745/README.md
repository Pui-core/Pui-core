# プロフィールの後続回復試行（未更新・HOLD）

[Issue125](https://github.com/Pui-core/-/issues/125) / [初回2試行の固定記録](../README.md)の後続追記。旧source3文書・旧F3文書とmanifest・旧Root原票は変更しない。

07:45 JSTからの有限入力窓で、Rootは旧自己紹介の全文選択を別callのfresh readで確認し、通常paste後に新71文字の完全一致を確認した。その後、名前付き「保存」ボタンへ通常mouseの保存intentを1回実行した。**この回のintentは1、累計3**。新候補・旧実値・正確なUTCと元SHAは[recovery.json](recovery.json)を参照。

今回、明示エラーは観測していない。保存後も編集modalが残り、完了は観測できなかった。追加の保存は行わず、取消・通常再読込後の **2026-10-27 07:47:13.5547975 JST** に旧bio、新bioなし、未保存modalなしを確認した。**実プロフィール更新はfalse**。明示エラーがないことや操作のexit0を成功と扱わない。

Root canonical内の`recovery.saveIntent`はhittest観測であり、保存intentそのものではない。実intentの証拠は`bio-save-intent3-trusted-paste.json`、ordinal3。hittestの座標・cursor・固有identityやrawUI・clipboard・lease内容はこの追記へ含めず、private原票はbasename/SHAのみで参照する。本記録担当はGUI/browser/profile/runtime/lease操作0。

**PP125-BIO-SAVE-001 / P2 は未解除。Draft/HOLD、最新自己レビューCHANGES_REQUESTEDを維持し、merge・Issue close・WT整理は行わない。** 解除にはRootによる実保存と、通常再読込後の新bio完全一致、および別証跡追記後の最新head再レビューが必要。保存できない原因・推薦適格性・0再生との因果は未確定。後続の再生QAは別観測の範囲とし、このbio snapshotへ混ぜない。

形式・元SHA・source/F一致の確認は[record-validation.json](record-validation.json)。旧Fのmanifest `494ed8105181f6d9ff5c0843b36e2b7f3eeeeb8de05158316cc44160b9036e36`と旧Root canonical `c505de46f48cae8be5a8341812b93243238a5bfdf5b6de58bda6b47c6ae04ad7`は不変。
