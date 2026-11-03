import fs from 'node:fs';import path from 'node:path';
import {root,hash,save} from './runtime.mjs';import {prop,at} from './native-props-v09.mjs';
import {sourceIn,sourceSHA256,framesFor,durationFor,scenesFor} from './full-plan-v09.mjs';
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),fmt=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${(t%60).toFixed(3).padStart(6,'0')}`;
const intro=['音源指定 — v09 r02 私的制作版','曲名: Sky High','作者/アーティスト: Elektronomia','版: Regular / NCS Release（2016。pt.II / Carpe Remix / The Sky Highとは別）','公式音源/配布URL: https://ncs.io/skyhigh','TikTok音源URL/ID・登録版・地域/当該account利用可否: 未確認。TikTok設定は未実施。','TikTok後付け候補として提示。未確認事項は後付け設定/公開時の別確認で、私的4本の停止条件ではありません。','実音源あり版には上記原盤を収録。無音版は音声streamなし。各企画の両版は同じ映像。','動画0秒 = 原盤00:46.0755。速度変更なし、全体gain -6dB、末尾8frame（約0.267秒）fade。','拍の目安は実PCM測定で約128 BPM。合わせ位置は30fpsのframe位置で、BPMの公称値ではありません。',''];
const reports=[];
for(const variant of ['solo','collab']){
 const project=path.join(root,'projects',variant+'-neutral.ecproj'),p=JSON.parse(fs.readFileSync(project)),layers=Object.values(p.items).find(x=>x.kind?.type==='Comp').kind.layers,scenes=scenesFor(variant),cameraFrames=variant==='solo'?[28,99,211,366,492]:[28,99,239,366,492];
 const rows=scenes.map((s,i)=>{
  const pop=layers.find(x=>x.name==='POPUP '+s.id),pos=prop(pop,'transform/position'),scale=prop(pop,'transform/scale');let landed;
  for(let f=s.fromFrame;f<s.fromFrame+30;f++)if(eq(at(pos,f/30),[...s.center,0])&&eq(at(scale,f/30),[100,100,100])){landed=f;break;}
  if(landed===undefined)throw Error('Popup did not settle');
  const exitDesign=s.id==='return'?null:s.toFrame-10,firstExit=exitDesign===null?null:exitDesign+1;
  if(firstExit!==null&&eq(at(pos,exitDesign/30),at(pos,firstExit/30)))throw Error('Popup exit time claim differs');
  const rig=layers.find(x=>x.name==='WORLD CAMERA - PAN ZOOM ONLY'),f=cameraFrames[i],now=[at(prop(rig,'transform/position'),f/30),at(prop(rig,'transform/scale'),f/30)],before=[at(prop(rig,'transform/position'),(f-1)/30),at(prop(rig,'transform/scale'),(f-1)/30)],next=[at(prop(rig,'transform/position'),(f+1)/30),at(prop(rig,'transform/scale'),(f+1)/30)];
  if(eq(now,before)||!eq(now,next))throw Error('Camera arrival/hold cue differs at '+f);
  return {id:s.id,heading:s.heading,cutFrame:s.fromFrame,popupSettledFrame:landed,noteSettledFrame:s.fromFrame+18,cameraArrivalFrame:f,popupExitDesignFrame:exitDesign,popupExitFirstChangedFrame:firstExit,readFromFrame:s.readFrom,readToFrame:s.readTo,cutSourceSeconds:sourceIn+s.fromFrame/30,popSourceSeconds:sourceIn+landed/30,cameraSourceSeconds:sourceIn+f/30};
 });
 reports.push({variant,projectSHA256:hash(project),frames:framesFor(variant),duration:durationFor(variant),sourceIn,sourceOut:sourceIn+durationFor(variant),rows});
 intro.push(variant==='solo'?'【通常版】':'【コラボ版】');
 intro.push(`実尺: ${durationFor(variant).toFixed(6)}秒 / ${framesFor(variant)}frame / 30fps`);
 intro.push(`原盤使用区間: ${fmt(sourceIn)} ～ ${fmt(sourceIn+durationFor(variant))}（正確な終端 ${String(sourceIn+durationFor(variant))}秒）`);
 intro.push('主要合わせ位置: 動画時刻 / 原盤時刻 / 動作');
 for(const x of rows){intro.push(`${fmt(x.cutFrame/30)} / ${fmt(x.cutSourceSeconds)} / 「${x.heading}」cut・登場開始`);intro.push(`  popup本体収束 ${fmt(x.popupSettledFrame/30)}、camera寄り到着 ${fmt(x.cameraArrivalFrame/30)}（原盤 ${fmt(x.cameraSourceSeconds)}）。`);}
 intro.push('登場後は追従文字が収まる間を置き、読める状態で滞在。末尾は11/3とプロフィール導線を保持。','');
}
intro.push('利用範囲: NCS公式usage policy/termsの独立creator UGC向け条件を確認。投稿/公開は今回実施していません。','必要credit:','Song: Elektronomia - Sky High [NCS Release]','Music provided by NoCopyrightSounds.','Free Download/Stream: http://ncs.io/skyhigh','Watch: http://youtu.be/TW9d8vYrVFQ','','実聴・実機確認・owner創作採用は未確認。音声stream、指定原盤区間との数値照合、頭尾/fade、全decode、無音/音ありの映像同一性を別途記録。');
const out=path.join(root,'音源指定.txt');if(fs.existsSync(out))throw Error('Keep fixed guide');fs.writeFileSync(out,intro.join('\n')+'\n');
save(path.join(root,'qa/full-cue-native-check.json'),{sourceSHA256,guideSHA256:hash(out),reports,method:'Saved native keyframes; camera arrival requires different preceding frame and identical next frame. Popup settle/exit measured independently.'});console.log(JSON.stringify({out,sha256:hash(out),reports:reports.map(x=>({variant:x.variant,sourceOut:x.sourceOut,rows:x.rows.map(r=>({cut:r.cutFrame,settle:r.popupSettledFrame,camera:r.cameraArrivalFrame}))}))}));
