# EMBERWAKE 正式本編（制作中）

全編第一稿04dをFのNative FilmCraftから実620.885秒／18626フレームで出力。SHA256 `ddb6263a9f0fd9a4c77f6bae6b101d5e386aa9ce826927d1d338d0ba961422d3`。入口は `index.html`、Fは `F:\Videos\ProjectP-EMBERWAKE-Longform-2026-10-28\firstcut-04d\index.html`。旧04cとその原本/検査は保持する。

元04cの意図しない1秒未満context操作挿入47箇所を再割付。42区間1697フレームをNative EffectCraftで描画し、最終MP4の全修正フレームと照合。42境界の210実画像を目視し、別操作への瞬間的な割込みがないことを確認。31UI置換は元captureの画面状態と引用文が一致。55.8秒は手帳でなく、3行outroを載せた第1話完了ページであり、以前の報告誤記と継承された話数metadataを訂正した。記録は `qa/firstcut04d-ui-binding-audit.json`。

全AV decode0、113句のPCM組立/最終AAC全句と頭尾、最大lag0sample、-19LUFS／TP-1.8、全18626fの既知bar/全黒0。Fの3Craft再open/save/render・EC欠損0・FC45online・Source素材不可視での全編Native出力、素材復元と所有job終端を確認。全編の直接視聴/主観試聴、BGM採用、Root創作受入、公開は未完了。技術検査をプロ品質/成長実績へ読み替えない。

必須P1は継続：新たに282秒/318秒の旧context画角で元操作案内の末尾だけが残る欠陥を実最終PNGで確認。103カットの旧Y790/160%を対象に、主人公と着地点を保ちながら原案内を画角外へ除く04e修正を継続する。現04dを公開・merge・close・cleanupしない。`qa/firstcut04d-review-scope.json` が最新の確認範囲。旧04cの63枚2fps票/12枚目視と、04dの42境界目視を全編連続視聴へ読み替えない。

Source UNC入力の旧04/04b全編書出し2回は143終了の原票と途中MP4を保持する。owner停止と断定せず、同条件で連続再起動しなかった。Fローカル＋専用detached有限workerはexit0で終了し、所有worker/Native childの終端とSource素材復元を確認。原画面・モデル・旧作品は削除しない。

台本は `source/firstcut04-selected.json`、原フレーム/音声/問いの結合は `qa/firstcut04-chapter-binding.json` と `metadata/firstcut04-chapter-binding.md`。59句の引用は固定story原文へ一対一で照合済み。実喪失を冒頭0〜4秒へ置き、30秒以内に検証を予告する。落下と進行、通常とダッシュ、手帳と失った内容、街の違い、見た目の版差を連ねる。同じ実ゲーム原フレームの再使用、編集によるゲーム静止、同操作を順に13話つなぐ尺埋めはしない。全編のNative画角点検で出発直後5カットと問い2区間を修正し、原版と有限差替素材を保持する。

24→64pxは保存原画の版差で、忘却に連動してゲーム絵が変わった証拠ではない。今回のPhotoCraft再構成描画は元制作時GUI動画と呼ばない。旧inputfix記録と現版の短押し/長押しは別比較。再訪の「失った記憶1→1」は、増えない限定観測で、残り数や復元の証明ではない。9話の原手帳は右端が欠けていたため、全文は編集文字として改行表示する。作者の未記録の意図・感情・次版予定、芯石運搬や道の組替えの実装を作らない。

旧661秒案、76秒sample01、72秒03c、独立20秒20d、失敗稿と各原本は保持。Rootの03c最終6画像/20d最終3画像の確認は構図と特定修正への限定採用で、全編採用ではない。短い映像を足して正式尺にしない。制作カット数を「伸びた構成」の実績とも扱わず、維持率・フォロー転換は公開後の同じ経過時間で別に監査する。

[管理Issue127](https://github.com/Pui-core/-/issues/127)。旧82秒の112/117を保持し、同じゲームの忘却と第2話の任意ダッシュ枝を受け止める600秒以上の本編を新収録から制作する。未完成のため、ここにある計画を完成尺・全15話クリア・公開実績としない。

固定制作版0.12.0/source `71584a6bd0c8852885157de71032fd9252e7a04c`。最新公開製品とは未確認。元UI内の「デモ0.11」ボタン表記は残り、pinの版番号と混同しない。ゲーム本体は変更せず、専用archive copyのcore72 SHAを照合する。既存owner save/稼働editor・他instance・旧raw・過去のF納品は保持する。

`source/run-capture.mjs` は新しい試行名と専用XDG data/config/cache、独立Linux Xvfbで1話だけ収録する。第1話は新規save。第2話以降は前の正常終了runの到達状態とsave SHAを検証して、新しいprefixへbyte一致で引き継ぐ。主scene読込前に実Godot userdata prefixを確認する。

通常Focus/Tab/Enterと方向キー/Space/X/Eだけで操作する。位置・進行・会話・時計の直接setterや開始callbackは使用しない。足場の実Rect/足元y/横位置を観測し、第2話の枝Bは上の通常足場を代用しない。1話720秒/6000framesの有限上限、失敗は原票ごと保持。同名出力/既存profileの上書きは拒否する。

1章3話のpilotを経て、13話分と通常道・操作比較の原収録を保持している。全15話の達成や終幕公開とは呼ばない。全話共通の3炉/2switchを15種類のパズルと呼ばず、固定版で実装されていない芯石運搬も説明しない。旧640/661秒などの配分案は完成masterの代わりにしない。

ゲーム音はDummyで未収録。新VOICEVOX:青山龍星と、無料CC BY4.0のKevin MacLeod「Floating Cities」を第一稿の背景比較候補に使用する。帰属・出典・編集表示は配信文へ残す。BGMの主観採用やContentID実結果は未確認。新113句PCMのRMSから指定Revenant_Naturalを932フレーム新Core描画し、4区間へ配置する。頭部edge接触0、原モデル不変。原モデル/SDK・音源・動画・rawsave・私的UIはGitに再配布しない。

SNS公開/予約/Related操作はRootのみ。本制作担当は共有Windows GUI/browser/runtime/lease/SNSを操作しない。技術検査と画像目視、全編の直接視聴/主観試聴、ownerの創作採用、公開後の結果を区別する。
