import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bpm=96, ppq=480, secondsPerBeat=60/bpm;
const tracks=[
  {id:'lead',name:'01 Lantern motif',channel:0,program:10,volume:108,pan:69,synth:'SI-Electric Piano (separate instance)'},
  {id:'keys',name:'02 Soft chord bed',channel:1,program:4,volume:78,pan:49,synth:'SI-Electric Piano (separate instance)'},
  {id:'bass',name:'03 Rounded bass',channel:2,program:33,volume:96,pan:64,synth:'SI-Bass Guitar'},
  {id:'drums',name:'04 Light pulse',channel:9,program:0,volume:72,pan:70,synth:'SI-Drum Kit'}
].map(t=>({...t,notes:[]}));
const sections=[
  {name:'First light',bar:1,bars:4,seconds:0,description:'A small question; no full drums.'},
  {name:'Find the connection',bar:5,bars:8,seconds:10,description:'Complete identifiable phrase; primary Shorts passage.'},
  {name:'A new route',bar:13,bars:8,seconds:30,description:'Answer phrase rises, then leaves room.'},
  {name:'Listen and choose',bar:21,bars:4,seconds:50,description:'Reduce the pulse before the reveal.'},
  {name:'Lights connected',bar:25,bars:8,seconds:60,description:'Return with the upper answer, settle on D.'}
];
const harmony=[
  {name:'Dm(add9)',bass:38,notes:[50,57,60,64,65]},
  {name:'G6',bass:31,notes:[43,55,59,62,64]},
  {name:'Cmaj9',bass:36,notes:[48,55,59,62,64]},
  {name:'Am7',bass:33,notes:[45,52,55,60,64]},
  {name:'Dm6/9',bass:38,notes:[50,57,59,64,65]},
  {name:'G(add9)',bass:31,notes:[43,55,57,59,62]},
  {name:'Cmaj7',bass:36,notes:[48,55,59,64]},
  {name:'Dm(add9)',bass:38,notes:[50,57,60,64,65]}
];
// Own phrase, specified note by note; no imported melody, loops, MIDI or samples.
const phrase=[
  [[0,62,.62],[1,65,.42],[1.75,69,.45],[2.5,76,.58],[3.25,74,.48]],
  [[.25,71,.52],[1.25,69,.5],[2.25,67,.7],[3.25,64,.42]],
  [[0,67,.66],[1.5,71,.48],[2.25,74,.45],[3,76,.7]],
  [[.5,72,.55],[1.5,69,.55],[2.5,64,.95]],
  [[0,65,.6],[1,69,.48],[1.75,74,.45],[2.5,76,.45],[3.25,77,.45]],
  [[.25,74,.65],[1.5,71,.48],[2.25,69,.55],[3.25,67,.45]],
  [[0,64,.65],[1.25,67,.48],[2,71,.45],[2.75,76,.72]],
  [[.25,74,1.15],[2,69,.5],[3,74,.75]]
];
function note(id,beat,pitch,duration,velocity){
  if(!Number.isFinite(beat)||beat<0||duration<=0||beat+duration>128.00001)throw Error('Invalid event range');
  tracks.find(x=>x.id===id).notes.push({beat,pitch,duration,velocity});
}
for(let bar=0;bar<32;bar++){
  const h=harmony[bar%8],base=bar*4,quiet=bar<4||bar>=20&&bar<24;
  for(let i=0;i<h.notes.length;i++)note('keys',base+i*.035,h.notes[i],bar===31?3.6:3.7,quiet?42+i%3:49+i%4);
  note('bass',base,h.bass,quiet?2.8:1.45,quiet?62:76);
  if(!quiet){note('bass',base+2,h.bass,1.25,66);if(bar%4===3&&bar!==31)note('bass',base+3.5,h.bass+7,.35,52);}
  if(bar>=4&&!(bar>=20&&bar<24)){
    for(const [b,p,d] of phrase[(bar-4+8)%8]){
      const answer=bar>=12&&bar<20;
      const pitch=answer&&bar%8<4?p+(p<70?12:0):p;
      note('lead',base+b,pitch,d,72+((bar+Math.round(b*4))%5)*3);
    }
  }else if(bar<4){
    const sparse=[[[.5,62,1.1],[2.5,69,.8]],[[1,71,1.2]],[[.5,67,.8],[2.5,76,.75]],[[1.5,74,1.4]]][bar];
    for(const [b,p,d]of sparse)note('lead',base+b,p,d,55+bar*3);
  }else{
    for(const [b,p,d]of [[.5,[74,71,76,74][bar-20],1.2],[2.5,[69,67,71,69][bar-20],.7]])note('lead',base+b,p,d,61);
  }
  if(!quiet){
    for(const beat of [0,2])note('drums',base+beat,36,.17,beat?66:80);
    for(const beat of [1,3])note('drums',base+beat,38,.14,bar>=24?58:50);
    for(let i=0;i<8;i++)note('drums',base+i*.5,42,.09,i%2?37:49);
    if(bar%8===6)note('drums',base+3.5,46,.28,36);
  }else if(bar>=2){note('drums',base,36,.17,48);note('drums',base+2,42,.09,31);}
}
// Final answer resolves earlier; the last 0.8s contains no new note onset.
tracks.find(x=>x.id==='lead').notes=tracks.find(x=>x.id==='lead').notes.filter(x=>x.beat<124);
note('lead',124.25,77,.55,78);note('lead',125.25,76,.45,71);note('lead',126,74,1.55,72);
for(const t of tracks)t.notes.sort((a,b)=>a.beat-b.beat||a.pitch-b.pitch);
const score={schemaVersion:1,title:'灯りがつながる / Connecting Lights',compositionId:'projectp-connecting-lights-20261026',bpm,timeSignature:[4,4],bars:32,beats:128,musicalSeconds:80,renderTailSeconds:2,renderDurationSeconds:82,mode:'D Dorian',sections,harmony,tracks,shorts:{startBeat:16,endBeat:48,startSeconds:10,endSeconds:30,tailSeconds:2,description:'The same8-bar musical phrase, render only its events; following-section notes are excluded.'},authorship:{method:'New note-by-note arrangement authored for ProjectP with AI assistance. No source melody/loop/sample files were imported.',claim:'Does not prove automatic royalties, distribution registration, Content ID eligibility or legal exclusivity.'},native:{status:'PENDING_ROOT_CAKEWALK_IMPORT_SAVE_RENDER',rendererUsed:false,wholeSubjectiveListening:false}};
const mkdir=d=>fs.mkdirSync(path.join(root,d),{recursive:true});for(const d of ['source','midi','qa','reference','native','audio'])mkdir(d);
function vlq(n){n=Math.round(n);const b=[n&127];while(n>>=7)b.unshift((n&127)|128);return Buffer.from(b);}
function u16(v){const b=Buffer.alloc(2);b.writeUInt16BE(v);return b;}
function u32(v){const b=Buffer.alloc(4);b.writeUInt32BE(v);return b;}
function chunk(name,body){return Buffer.concat([Buffer.from(name),u32(body.length),body]);}
function meta(type,text){const b=Buffer.from(text,'utf8');return Buffer.concat([Buffer.from([255,type]),vlq(b.length),b]);}
function midiTrack(events,endTick){events.sort((a,b)=>a.tick-b.tick||a.priority-b.priority);let previous=0;const b=[];for(const e of events){b.push(vlq(e.tick-previous),e.data);previous=e.tick;}b.push(vlq(endTick-previous),Buffer.from([255,47,0]));return chunk('MTrk',Buffer.concat(b));}
function makeMidi(startBeat,endBeat,label){const endTick=Math.round((endBeat-startBeat)*ppq),tempo=625000;
  const metas=[{tick:0,priority:0,data:meta(3,label)},{tick:0,priority:0,data:Buffer.from([255,81,3,(tempo>>16)&255,(tempo>>8)&255,tempo&255])},{tick:0,priority:0,data:Buffer.from([255,88,4,4,2,24,8])},{tick:0,priority:0,data:meta(1,'Original ProjectP composition; 96 BPM; no imported loops')}];
  for(const s of sections){const beat=(s.bar-1)*4;if(beat>=startBeat&&beat<endBeat)metas.push({tick:Math.round((beat-startBeat)*ppq),priority:0,data:meta(6,s.name)});}
  const out=[midiTrack(metas,endTick)];
  // No program-change event: native synth assignment is explicit in Sonar;
  // a General MIDI patch number must not silently change a chosen SI preset.
  for(const t of tracks){const ev=[{tick:0,priority:0,data:meta(3,t.name)},{tick:0,priority:0,data:Buffer.from([176+t.channel,7,t.volume])},{tick:0,priority:0,data:Buffer.from([176+t.channel,10,t.pan])}];
    for(const n of t.notes){if(n.beat<startBeat||n.beat>=endBeat)continue;const on=Math.round((n.beat-startBeat)*ppq),off=Math.round((Math.min(n.beat+n.duration,endBeat)-startBeat)*ppq);ev.push({tick:on,priority:2,data:Buffer.from([144+t.channel,n.pitch,n.velocity])},{tick:off,priority:1,data:Buffer.from([128+t.channel,n.pitch,0])});}
    out.push(midiTrack(ev,endTick));
  }
  return Buffer.concat([Buffer.from('MThd'),u32(6),u16(1),u16(5),u16(ppq),...out]);
}
fs.writeFileSync(path.join(root,'source/composition.json'),JSON.stringify(score,null,2)+'\n');
fs.writeFileSync(path.join(root,'midi/connecting-lights.mid'),makeMidi(0,128,'Connecting Lights / full32bars'));
fs.writeFileSync(path.join(root,'midi/connecting-lights-short.mid'),makeMidi(16,48,'Connecting Lights / short8bars'));
const lines=['track,beat,start_seconds,note,duration_beats,velocity'];for(const t of tracks)for(const n of t.notes)lines.push([t.id,n.beat,(n.beat*secondsPerBeat).toFixed(5),n.pitch,n.duration,n.velocity].join(','));
fs.writeFileSync(path.join(root,'source/notes.csv'),lines.join('\n')+'\n');
const summary={at:new Date().toISOString(),state:score.native.status,title:score.title,bpm,bars:32,musicalSeconds:80,tailSeconds:2,trackCount:4,noteCounts:Object.fromEntries(tracks.map(t=>[t.id,t.notes.length])),midiFiles:['connecting-lights.mid','connecting-lights-short.mid'].map(file=>({file:'midi/'+file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'midi',file))).digest('hex')})),noteSourceFiles:0,externalLoops:0,externalSamples:0,nativeRendered:false};
fs.writeFileSync(path.join(root,'qa/source-ready.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
