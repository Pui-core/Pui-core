import fs from 'node:fs';
import path from 'node:path';
import {sections} from './story.mjs';
import {observeTraveler} from './pixel-observe.mjs';
import {file,hash,save} from '../native.mjs';
const voiced=JSON.parse(fs.readFileSync(file('source/demo05/voiced-cues.json'))).cues;
const known=new Map();
function recording(attempt){if(!known.has(attempt)){const b=JSON.parse(fs.readFileSync(file(`qa/demo05/${attempt}-binding.json`))),l=JSON.parse(fs.readFileSync(file(`qa/demo05/${attempt}-launch.json`))),c=JSON.parse(fs.readFileSync(l.out+'/capture.json'));if(!b.fullDecode||!b.archiveAndPrivateCoreUnchanged||!b.ownedEngineGone||hash(file(b.video))!==b.sha256)throw Error('Unverified actual recording '+attempt);known.set(attempt,{b,l,c});}return known.get(attempt);}
const plan={version:'demo05-v01',title:'運んだ石で、帰り道まで変わる｜EMBERWAKE同梱デモ５コース',mode:'Original bundled demo0.11, not fifteen-episode campaign0.12',sections:[],wholeDirectWatch:false,subjectiveListen:false,published:false};
let globalFrame=0;
for(const section of sections){let frame=0;const units=[];
 const cues=voiced.filter(c=>c.section===section.id&&c.id!=='course2-13');
 if(section.id==='course1')cues.push({id:'course1-continuous',section:section.id,title:'石を残す → 自分だけ戻る → 出口へ',attempt:'demo01-main01',at:28.9,span:19.1,seconds:0,wav:null,continuous:true});
 if(section.id==='course3')cues.push({id:'course3-continuous',section:section.id,title:'Ａを入れる → Ｂを入れる → Ａだけ戻す',attempt:'demo03-main01',at:0,span:18.1,seconds:0,wav:null,continuous:true});
 for(const c of cues){
  const rec=recording(c.attempt),event=typeof c.at==='string'?rec.c.events.find(e=>e.label===c.at):null;if(typeof c.at==='string'&&!event)throw Error('Missing actual event '+c.id+' '+c.at);
  const at=Math.max(0,typeof c.at==='number'?c.at:event.captureFrame/30-1.8);
  const duration=c.continuous?c.span:Math.max(c.seconds+.6,c.span),frames=Math.ceil(duration*30),seconds=frames/30;
  if(at>=rec.b.seconds-.3)throw Error('Invalid actual footage range '+c.id);
  const maxSpan=Math.min(c.span,rec.b.seconds-at-.033333),parts=[];
  if(c.continuous||seconds<=maxSpan+.04)parts.push({start:0,end:seconds,sourceAt:at,view:'wide',replay:false});
  else{const first=Math.min(maxSpan,seconds*.57);parts.push({start:0,end:first,sourceAt:at,view:'wide',replay:false});const tail=seconds-first,sourceAt=Math.max(0,Math.min(at+Math.max(0,(maxSpan-tail)/2),rec.b.seconds-tail-.033333));if(tail>rec.b.seconds)throw Error('Insufficient real footage '+c.id);parts.push({start:first,end:seconds,sourceAt,view:'split',replay:true});}
  const detailMeasurements=[];
  for(const part of parts)if(part.view==='split'){
   for(let t=0;t<part.end-part.start+.02;t+=.5){const f=Math.min(rec.c.frameCount-1,Math.round((part.sourceAt+Math.min(t,part.end-part.start))*30)),p=path.join(rec.l.out,'frame-'+String(f).padStart(6,'0')+'.png'),obs=observeTraveler(p);detailMeasurements.push({time:part.start+Math.min(t,part.end-part.start),sourceFrame:f,...obs});}
   // A result overlay can legitimately hide the traveler. Keep the actual
   // whole frame for that replay instead of inventing a successful crop.
   if(detailMeasurements.some(m=>!m.found))part.view='replay-wide';
  }
  const u={...c,at,frame,globalFrame:globalFrame+frame,frames,duration:seconds,sourceVideo:rec.b.video,sourceSha256:rec.b.sha256,observedEvent:event,parts,detailMeasurements,voiceOffset:.12};units.push(u);frame+=frames;
 }
 plan.sections.push({id:section.id,title:section.title,globalFrame,frames:frame,seconds:frame/30,units});globalFrame+=frame;
}
plan.frames=globalFrame;plan.seconds=globalFrame/30;plan.recordings=[...known.values()].map(({b,l,c})=>({attempt:b.attempt,video:b.video,sha256:b.sha256,seconds:b.seconds,source:b.source,sourceAndPrivateUnchanged:l.archiveAndPrivateCoreUnchanged,ownedEngineGone:l.ownedEngineGone,result:c.events.find(e=>e.label==='actual-route-result'),captureReceiptSha256:l.captureReceiptSha256,auxiliaryDriverSha256:fs.existsSync(l.owned+'/belfry-choices.gd')?hash(l.owned+'/belfry-choices.gd'):null}));
if(plan.seconds<600)throw Error('Meaningful planned content below required600 seconds: '+plan.seconds);
save('source/demo05/edit-plan.json',plan);console.log(JSON.stringify({frames:plan.frames,seconds:plan.seconds,sections:plan.sections.map(s=>({id:s.id,seconds:s.seconds,units:s.units.length})),recordings:plan.recordings.length}));
