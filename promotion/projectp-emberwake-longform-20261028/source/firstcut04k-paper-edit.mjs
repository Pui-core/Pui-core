import fs from 'node:fs';
import { file, save } from './native.mjs';

// Paper edit only: these durations are target slots, never rendered duration.
const old = JSON.parse(fs.readFileSync(file('source/firstcut04j-edit.json')));
const blocks = [
  { id:'hook', seconds:42, title:'約束と代償', voices:['u001','u003','u004','u009','u010','u011','u012','u013','u014'], visuals:'第1話の実台詞と公園の記憶、タイトルの数を対比。4秒以内に喪失を提示。' },
  { id:'fall', seconds:60, title:'落下で記憶は増える？', voices:['u015','u017','u018','u019','u020','u022','u023','u024'], visuals:'同一開始条件の短押し落下と長押し着地を同時比較、結果1→1、初回クリア後の1→2。' },
  { id:'routes', seconds:64, title:'近道で代償は変わる？', voices:['u025','u026','u027','u028','u029','u030','u031','u032','u034'], visuals:'通常4足場とダッシュ枝2足場の実着地、同じ合流と2話の喪失を対比。' },
  { id:'art', seconds:62, title:'24pxと64pxの原画', voices:['u097','u098','u099','u100','u101'], visuals:'保存原画の同じ姿勢を同サイズで比較し、フード、足、灯、ジャンプの姿勢に寄る。旧版プレイとは言わない。' },
  { id:'input', seconds:80, title:'ジャンプ入力の不一致を直す', voices:['u103','u104'], newVoiceIds:['jump01','jump02','jump03','jump04','jump05','jump06'], estimatedNewVoiceSeconds:48.43, visuals:'当時の実測値を描画した比較図、押す／離す／着地の図解、修正後の今回実収録を別表示。旧版プレイ映像と混同しない。' },
  { id:'faces', seconds:60, title:'出来事から面影へ', voices:['u046','u047','u048','u050','u051','u052','u055','u056','u057','u058','u059','u063','u064','u065','u066','u067','u068'], visuals:'雨宿り、笑った出来事、顔を思い描けない対話の実文を短く並べ、余白や文字に注目。' },
  { id:'writing', seconds:70, title:'記録と記憶の違い', voices:['u036','u037','u038','u039','u040','u041','u042','u070','u071','u072','u073','u074','u075','u076','u077','u078'], visuals:'3話の帰る道と7話の助ける指示を手帳実画面で対比。意味が変わる箇所を大きく見せる。' },
  { id:'voice', seconds:68, title:'声が届いても誰かわからない', voices:['u081','u082','u083','u084','u085','u086','u087','u088','u089','u091','u092','u093','u094','u095','u096'], visuals:'8話の実会話を「聞こえる」と「親しさ」に分けて見せ、9話の記録の短縮につなぐ。' },
  { id:'city', seconds:51, title:'街ごとの背景', voices:['u108','u111','u112','u113'], newVoiceIds:['city01','city02'], estimatedNewVoiceSeconds:12.06, visuals:'実収録から夜空、青い背景、額縁状の線、歯車状の線、アーチを比較。未確認の公園の柵・ベンチや雨・軒・窓は言わない。' },
  { id:'end', seconds:63, title:'残す言葉', voices:['u115','u116','u117','u118','u119','u120','u121','u122','u123','u124','u125'], visuals:'待つ人と足元の会話を使い、最後の問いへ。14・15話の核心は使わない。' }
];
const seen = new Set(); let start = 0;
for (const b of blocks) {
  let voiceSeconds = 0;
  for (const id of b.voices) {
    if (seen.has(id)) throw new Error('Duplicated phrase: ' + id);
    seen.add(id);
    const v = old.voices.find(v => v.id === id);
    if (!v || !fs.existsSync(file('media/' + v.file))) throw new Error('Missing actual narration: ' + id);
    voiceSeconds += v.end - v.at;
  }
  b.start = start; b.end = start + b.seconds; start = b.end;
  b.existingVoiceSeconds = Math.round(voiceSeconds * 100) / 100;
  b.minimumVoiceGapSeconds = Math.max(0, b.voices.length + (b.newVoiceIds?.length || 0) - 1) * .2;
  b.plannedNonVoiceSeconds = Math.round((b.seconds - voiceSeconds - (b.estimatedNewVoiceSeconds || 0)) * 100) / 100;
  if (b.plannedNonVoiceSeconds < b.minimumVoiceGapSeconds) throw new Error('Narration does not fit slot: ' + b.id);
}
const needed = ['media/ep01-replay-controls01-game.mp4','media/ep02-normal-route01-game.mp4','media/ep02-game.mp4',
  'media/firstcut04-art-pair.mov','media/firstcut04-art-detail.mov'];
for (const p of needed) if (!fs.existsSync(file(p))) throw new Error('Missing source: ' + p);
const out = 'source/firstcut04k-paper-edit.json';
if (fs.existsSync(file(out))) throw new Error('Preserve earlier paper edit');
save(out,{ status:'PAPER_EDIT_ONLY_NOT_600_SECOND_RENDER', plannedSeconds:start, blocks, sourcesExist:needed,
  newVoiceEstimate:'VOICEVOX audio_query estimate at speed 1.06, not synthesized or heard',
  required:'Create actual visual comparisons and narration; measure full render, judge pacing and listen before publication',
  actualRenderedSeconds:null, wholeDirectWatch:false, subjectiveListen:false, creativeAccepted:false, published:false });
console.log(JSON.stringify({ plannedSeconds:start, blocks:blocks.map(b=>({id:b.id,start:b.start,end:b.end,existingVoiceSeconds:b.existingVoiceSeconds,nonVoice:b.plannedNonVoiceSeconds})) }));
