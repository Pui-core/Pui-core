/** Regressions for dropped speaker metadata and accidental audio edit changes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildCaptions,layout} from './captions.mjs';
const fonts={normal:{family:'Test Normal'},reaction:{family:'Test Reaction'},shaky:{family:'Test Handdrawn'}};
const speakers={host:{label:'配信者',side:'left',color:'#E84C89'},guest:{label:'相手',side:'right',color:'#3B8DE5'}};
const edit={duration:3,groups:[{start:10,end:13,speed:1.2,outputStart:0,duration:3}]};
const clip={title:'短い見出し',speakers,cuts:[{captions:[{start:10,end:11,text:'発話',speaker:'host'},{start:11,end:12,text:'返事',speaker:'guest'},{start:12,end:13,text:'反応',speaker:'host',fontTreatment:'handdrawn-wobbly'}]}]};
const good=buildCaptions(clip,edit,fonts);
assert.deepEqual(good.audit.map(x=>x.side),['left','right','left']);
assert.deepEqual(good.audit.map(x=>x.anchor[0]),[76,1004,76],'A font change must not move a speaker to the other lane');
const missing=structuredClone(clip);delete missing.cuts[0].captions[0].speaker;
assert.throws(()=>buildCaptions(missing,edit,fonts),/annotated speaker/,'Colour alone must never recreate missing speaker metadata');
const escaped=structuredClone(clip);escaped.cuts[0].captions[0].start=9;
assert.throws(()=>buildCaptions(escaped,edit,fonts),/did not map/);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'osayu-caption-regression-'));
try{
  const base=path.join(tmp,'base'),out=path.join(tmp,'output'),input=path.join(tmp,'plan.json');
  fs.mkdirSync(path.join(base,'render','example'),{recursive:true});
  const old={audioCutMode:'direct-container-seek-continuous-samples',clips:[{id:'example',filename:'old_音声のみ.mp4',cuts:[{start:10,end:13,speed:1.2}]}]};
  const sha=createHash('sha256').update(JSON.stringify(old)).digest('hex');
  fs.writeFileSync(path.join(base,'private-plan.json'),JSON.stringify(old));
  fs.writeFileSync(path.join(base,'render','example','edit.json'),JSON.stringify({planSha:sha,layout,groups:[{audioEvidence:{}}]}));
  const wrong={audioCutMode:old.audioCutMode,basePlanSha:sha,fonts,clips:[{...clip,id:'example',filename:'new_音声のみ.mp4',cuts:[{start:10,end:13,speed:1.25,captions:[]}]}]};
  fs.writeFileSync(input,JSON.stringify(wrong));
  const r=spawnSync(process.execPath,[fileURLToPath(new URL('./restyle.mjs',import.meta.url)),input,base,out,'preview'],{encoding:'utf8'});
  assert.notEqual(r.status,0);assert.match(r.stderr,/cannot alter source intervals or speed/);
  assert.equal(fs.existsSync(out),false,'Reject an audio edit before creating output or launching a media process');
}finally{fs.rmSync(tmp,{recursive:true});}
console.log('PASS: required speaker, stable lanes, caption bounds and caption-only timeline guard');
