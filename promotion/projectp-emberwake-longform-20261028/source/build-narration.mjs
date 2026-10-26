import fs from 'node:fs';import {file,save} from './native.mjs';
const draft=process.argv.includes('--draft'),edit=JSON.parse(fs.readFileSync(file('source/'+(draft?'edit-draft.json':'edit.json'))));
const cues=[];
function add(id,at,end,text,caption,kind='commentary'){at=Math.round(at*30)/30;end=Math.round(end*30)/30;if(end<=at||end>edit.duration)throw Error('Invalid voice window');if(cues.some(c=>Math.max(c.at,at)<Math.min(c.end,end)))throw Error('Voice cue overlap');cues.push({id,at,end,text,caption:caption||text,kind});}
function ep(id){return edit.episodes.find(e=>e.id===id);}
function memoryStart(id){return edit.segments.find(s=>s.episode===id&&s.kind==='actual-memory').startFrame/30;}
const start=id=>ep(id).startFrame/30,play=id=>ep(id).playStartFrame/30;
add('opening',.1,7.6,'灯をつなぐほど、思い出を失う。自作ゲーム、エンバーウェイクです。','灯をつなぐほど、思い出を失う。\n自作ゲーム EMBERWAKE');
add('light-and-dash',play(1)+.25,play(1)+8.0,'まずは三つの灯へ。光を拾うと、ダッシュが使えるようになります。','まずは、三つの灯へ。\n光を集めると、ダッシュが使える。');
add('first-cost',memoryStart(1),memoryStart(1)+3.8,'失ったのは、公園で過ごした午後。','失ったのは、公園で過ごした午後。');
const branchA=ep(2).branch.find(b=>b.label==='branch-dash-landed-branch-a');
const branchAt=play(2)+(branchA.frame-ep(2).sourceDepartFrame)/30;
add('branch-question',play(2)+.2,Math.min(play(2)+7.5,branchAt-.6),'次は、急な二段の近道。ここは、ダッシュで渡れるでしょうか。','急な二段の近道。\nダッシュで渡れる？');
const merge=ep(2).branch.find(b=>b.label==='actual-branch-merge-on-island');
const mergeAt=play(2)+(merge.frame-ep(2).sourceDepartFrame)/30;
add('branch-answer',mergeAt+.15,mergeAt+5.0,'二枚とも着地できました。近道は、同じ島へつながります。','二枚とも着地。\n近道も、同じ島へ。');
add('way-home-question',play(3)+.5,play(3)+6.5,'帰り道を残しておけば、忘れても帰れるのでしょうか。','帰り道を残せば、\n忘れても帰れる？');
if(ep(4)){
 add('rain-chapter',start(4)+.2,start(4)+6.0,'公園を抜けて、雨の街へ。ここからは、風も吹いています。','公園から、雨の街へ。\nここからは、風も吹く。');
 add('rain-gameplay',play(4)+5.0,play(4)+10.8,'足場の位置と、風向き。踏み出す前に、次の着地点を見ます。','足場の位置と、風向き。\n次の着地点を見る。');
}
if(ep(5))add('normal-path-choice',play(5)+1,play(5)+7.8,'近道がある場所も、今回は通常の足場を順にたどります。','近道のある場所も、\n今回は通常ルートで。');
if(ep(6))add('portrait-cost',memoryStart(6),memoryStart(6)+3.9,'今度は、顔を思い描く記憶まで。','今度は、顔を思い描く記憶まで。');
if(ep(7)){
 add('blank-page-chapter',start(7)+.2,start(7)+6.0,'三つ目の章へ。公園とは、風向きも、背景も変わりました。','三つ目の章へ。\n風向きも、背景も変わる。');
 add('blank-page-route',play(7)+8,play(7)+14,'同じ三つの灯でも、上る位置は違います。道を見て、一段ずつ。','三つの灯へ。\n上る位置は、それぞれ違う。');
}
if(ep(8))add('voice-cost',memoryStart(8),memoryStart(8)+3.9,'声が聞こえても、親しさが遠ざかる。','声が聞こえても、\n親しさが遠ざかる。');
if(ep(9))add('notebook-evidence',play(9)+4,play(9)+10,'進んだ後に、手帳を開きます。ここでも、失った記憶を確かめられます。','手帳を開いて、\n失った記憶を確かめる。');
if(ep(10)){
 add('belfry-record-chapter',start(10)+.2,start(10)+6.0,'四つ目の章では、鐘楼の記録が見えてきます。','四つ目の章。\n鐘楼の記録へ。');
 add('belfry-wind',play(10)+6,play(10)+12,'風のある中段を抜けて、次の灯へ。足場の端を確かめながら進みます。','風のある中段を抜け、次の灯へ。');
}
if(ep(11))add('ashen-sun-cost',memoryStart(11),memoryStart(11)+3.9,'同じ太陽を見た空も、記憶の向こうへ。','同じ太陽を見た空も、\n記憶の向こうへ。');
if(ep(12))add('promise-question',play(12)+1,play(12)+7.5,'最初の、迎えに行くという言葉。今の約束と、比べてみてください。','最初の「迎えに行く」と、\n今の約束を、比べてみる。');
if(ep(13))add('nameless-chapter',start(13)+.2,start(13)+6.0,'道は最後の章へ。この先を、何で進むのでしょうか。','道は最後の章へ。\nこの先を、何で進む？');
const end=edit.meaningfulUniqueSeconds;
add('closing',end+.1,end+7.7,'作品の仕掛けと、その続きを。チャンネル登録して、見届けてください。','作品の仕掛けと、その続きを。\nチャンネル登録で。','author-cta');
save('source/'+(draft?'narration-cues-draft.json':'narration-cues.json'),cues.sort((a,b)=>a.at-b.at));
console.log(JSON.stringify({draft,cues:cues.length,duration:edit.duration,latestEpisode:edit.selectedEpisodeIds.at(-1),branchQuestionEndsBeforeLanding:cues.find(c=>c.id==='branch-question').end<branchAt}));
