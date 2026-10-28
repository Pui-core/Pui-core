# 04k 再構成の引き継ぎ

2026-10-28。PR #60はDraft／創作・公開HOLD。04jは `F:\Videos\ProjectP-EMBERWAKE-Longform-2026-10-28\firstcut-04j\index.html` に保持。旧版の話数と説明の不一致、画面で確認できない情景の説明、単調さは解除していない。

## 今回の実物

- **冒頭試作06**: `videos/emberwake-firstcut04k-opening-pilot06.mp4`、20.8秒、SHA256 `cd32af4f146375c7d659426a9c93d22c4551cf823c656cb57f7f11a8118e61a9`。EffectCraftとFilmCraftの原本は `projects/emberwake-firstcut04k-opening-pilot06.*`。実落下の収録から入り、実ゲームの記憶と台詞を編集表示。実出力のコンタクトシートは `qa/firstcut04k-opening-pilot06-contact.png`。最初の2秒を6fpsで抽出した `qa/firstcut04k-opening-pilot06-first2s.png` では0.167〜0.500秒の下降と0.667秒以降の復帰を確認。BGMなし、通しの映像視聴・主観試聴未実施。
- **2経路の比較試作03**: `videos/emberwake-firstcut04k-route-pilot03.mp4`、7.018秒、SHA256 `6faa0ab3f730612d1dc96a663d91bbd544905111da8f85005e33965124259f80`。第2話の別々の実収録を左右に配置し、同じ足場への合流を確認。音声は旧試作から再利用。冒頭試作に当該映像の一部が含まれるため、全体へ両方をそのまま連結すると重複する。
- **原画・入力試作03**: `videos/firstcut04k-artinput-agent03.mp4`、84.586秒、SHA256 `1846756ec6ab17031c3322574ed87b1097c5404f650896d2978c6af6ed49a65e`。EffectCraft／FilmCraft原本は同名で `projects/` に保持。10句のAACと元WAVの相関・同期を検査し、4時点の画像を確認。CTOは30秒以降が同系統のグラフ・テキストの連続でスライドに見えるため受入不可と判定。実際のジャンプの動きと数値を同時に見せ、数値が動きとどう対応するかを伝える修正が必要。旧版実プレイ映像の捏造はしない。BGMなし・全編の連続視聴／試聴なし。詳細は `source/firstcut04k-artinput-agent03-handoff.md`。
- **後半の照合**: `source/firstcut04k-story-agent-map.json` と `source/firstcut04k-story-agent-handoff.md` に61句の素材候補。引用48句は固定story原文と一致し、13句は抽出画像を目視。u041・u088・u093は元画面の文字が欠けるため、`source/firstcut04k-story-agent-reflow.json` の原文を編集改行として表示するか採用を見送る。u068・u077・u094は元画面が声の途中で次ページへ移るため単純に重ねない。検査画像は `qa/firstcut04k-story-agent/` と `/home/pui/tmp/projectp127-story04k-agent/` に保持。

## 実尺と次の仕事

`source/firstcut04k-proven-schedule.json` は音声109句のWAV実長、各句後0.2秒、実画像8窓を順に置いた **606.333秒の仮配置**。音声との重複や各試作動画の重複を排除するための作業表であり、まだ完成MP4ではない。画像窓の全動作・音声と画面の連続した意味対応・テンポは未検査。別版を一つのEffectCraft／FilmCraftタイムラインとして構築し、正しい素材と読みやすい引用を配置する。新規音声の声質・BGMを実際に聴き、無意味な待ちや重複があれば短くする。短縮後に600秒未達なら実証できる別の見どころを追加し、引き延ばさない。

実出力の600秒以上、全AV・音声語頭語尾、全主要場面と文字、スマートフォン表示、直接の通し視聴・試聴、テンポと音楽の採用を確認してから公開可否を再判定。再生回数や維持率を未公開の検査から推定しない。
