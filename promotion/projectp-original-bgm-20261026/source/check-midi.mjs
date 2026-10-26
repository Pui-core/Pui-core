import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const score=JSON.parse(fs.readFileSync(path.join(root,'source/composition.json'),'utf8'));
function parse(file){
  const b=fs.readFileSync(path.join(root,file));let p=0;
  const tag=()=>{const v=b.toString('ascii',p,p+4);p+=4;return v;};
  const n32=()=>{const v=b.readUInt32BE(p);p+=4;return v;};
  if(tag()!=='MThd'||n32()!==6)throw Error('Header');
  const format=b.readUInt16BE(p),count=b.readUInt16BE(p+2),division=b.readUInt16BE(p+4);p+=6;
  if(format!==1||count!==5||division!==480)throw Error('MIDI format/track/PPQ');
  const result=[];
  for(let t=0;t<count;t++){
    if(tag()!=='MTrk')throw Error('Track tag');const end=n32()+p;let tick=0,running=null;const active=new Map(),notes=[];let name='',tempo=null,eot=false;
    function vlq(){let v=0,bytes=0,x;do{if(p>=end||++bytes>4)throw Error('Invalid VLQ');x=b[p++];v=(v<<7)|(x&127);}while(x&128);return v;}
    while(p<end){tick+=vlq();let status=b[p];if(status>=128){p++;if(status<240)running=status;}else{if(running===null)throw Error('Missing status');status=running;}
      if(status===255){const type=b[p++],length=vlq(),value=b.subarray(p,p+length);p+=length;if(p>end)throw Error('Truncated meta');if(type===3)name=value.toString('utf8');if(type===81)tempo=value.readUIntBE(0,3);if(type===47){if(length!==0||p!==end)throw Error('End-of-track');eot=true;}}
      else if(status===240||status===247)throw Error('Unexpected SysEx');
      else{const kind=status&240,ch=status&15,a=b[p++],one=kind===192||kind===208,z=one?0:b[p++];if(a>127||z>127||p>end)throw Error('Invalid data');
        if(kind===192)throw Error('Unexpected program change');
        const key=ch+':'+a;if(kind===144&&z>0){if(active.has(key))throw Error('Overlapping equal note');active.set(key,{tick,channel:ch,pitch:a,velocity:z});}
        else if(kind===128||kind===144&&z===0){const on=active.get(key);if(!on||tick<=on.tick)throw Error('Unmatched/zero note');notes.push({...on,endTick:tick});active.delete(key);}
      }
    }
    if(!eot||active.size)throw Error('Missing noteoff/EOT');result.push({name,tempo,endTick:tick,notes});
  }
  if(p!==b.length)throw Error('Trailing bytes');return result;
}
const outputs=[];
for(const [file,start,end]of [['midi/connecting-lights.mid',0,128],['midi/connecting-lights-short.mid',16,48]]){
  const d=parse(file);if(d[0].tempo!==625000||d.some(x=>x.endTick!==(end-start)*480))throw Error('Tempo/duration');
  for(let i=0;i<4;i++){
    const expected=score.tracks[i].notes.filter(n=>n.beat>=start&&n.beat<end).map(n=>({tick:Math.round((n.beat-start)*480),channel:score.tracks[i].channel,pitch:n.pitch,velocity:n.velocity,endTick:Math.round((Math.min(n.beat+n.duration,end)-start)*480)}));
    const sort=a=>a.sort((x,y)=>x.tick-y.tick||x.pitch-y.pitch);
    if(JSON.stringify(sort(expected))!==JSON.stringify(sort(d[i+1].notes)))throw Error('Decoded note differs '+file+' '+i);
  }
  outputs.push({file,format:1,tracks:d.length,ppq:480,bpm:96,seconds:(end-start)*.625,notes:d.slice(1).map(x=>({track:x.name,count:x.notes.length})),unmatchedNotes:0,programChanges:0,externalSysEx:0});
}
const report={state:'MIDI_BYTE_PARSE_PASS_NATIVE_AUDIO_PENDING',at:new Date().toISOString(),outputs,nativeAudioVerified:false};
fs.writeFileSync(path.join(root,'qa/midi-integrity.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
