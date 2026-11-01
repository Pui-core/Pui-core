// v06-checks.mjs の数値fixture。メディア・ネイティブ・ネットワーク・共有資源に触れない(合成配列と保存済みprojectのJSON読込のみ)。
// 実行: node source/v06-checks.test.mjs   (修正前の旧判定が欠陥を通す事実と、修正後が拒否する事実を両方記録する)
import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';
import{strictCorr,analyzeAudioCues,collectRefs,checkDependencies,checkCaptionLayers,analyzeCaptionTimeline,findLampFrame,TICKS_PER_SECOND}from'./v06-checks.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),results=[];
const rejects=(name,fn,re)=>{try{fn();}catch(e){if(re&&!re.test(e.message))throw Error(`${name}: rejected for an unexpected reason: ${e.message}`);results.push({name,expected:'reject',actual:'reject',reason:e.message.slice(0,140)});return;}throw Error(name+': was ACCEPTED but must be rejected');};
const accepts=(name,fn)=>{let v;try{v=fn();}catch(e){throw Error(name+': was rejected but must be accepted: '+e.message);}results.push({name,expected:'accept',actual:'accept'});return v;};
// ---- 修正前(旧)の判定: 範囲外sampleをskipし、n=0でNaN。NaNは比較式をすり抜ける ----
function legacyCorr(a,b,start,end,lag=0,step=2){let ab=0,aa=0,bb=0,n=0;for(let i=Math.max(0,start);i<Math.min(a.length,end);i+=step){const j=i+lag;if(j<0||j>=b.length)continue;ab+=a[i]*b[j];aa+=a[i]*a[i];bb+=b[j]*b[j];n++;}return{correlation:ab/Math.sqrt(aa*bb),expectedRms:Math.sqrt(aa/n),actualRms:Math.sqrt(bb/n),n};}
const legacyAccepts=(expected,actual,cue,lag=0)=>{const st=Math.round(cue.actualStart*48000)*2,en=Math.round(cue.actualEnd*48000)*2;const head=legacyCorr(expected,actual,st,Math.min(en,st+7680),lag),tail=legacyCorr(expected,actual,Math.max(st,en-7680),en,lag),whole=legacyCorr(expected,actual,st,en,lag);const db=20*Math.log10(whole.actualRms/whole.expectedRms);const rejected=Math.min(head.correlation,tail.correlation)<.96||Math.abs(db)>1;return{accepted:!rejected,tailSamples:tail.n,tailFinite:Number.isFinite(tail.correlation)};};
// ---- 合成音声 ----
const sig=(sec,seed)=>{const a=new Float32Array(Math.round(sec*48000)*2);let x=seed>>>0;for(let i=0;i<a.length;i++){x=(Math.imul(x,1664525)+1013904223)>>>0;a[i]=((x/4294967296)-.5)*.5;}return a;};
const cueOf=(s,e)=>({id:'c',text:'t',kana:'k',actualStart:s,actualEnd:e});
{ // RO-V06-01 PM反例: 期待2秒・実1秒
  const expected=sig(2,1),actual=expected.slice(0,48000*2),cue=cueOf(.207625,1.51115625),voice=sig(2,2),music=sig(2,3);
  const old=legacyAccepts(expected,actual,cue);if(!old.accepted||old.tailSamples!==0||old.tailFinite)throw Error('legacy reproduction failed');
  results.push({name:'legacy(pre-fix) on truncated audio',expected:'defect reproduced',actual:'accepted with tailSamples=0, tail non-finite'});
  rejects('truncated decoded audio (2s expected / 1s actual)',()=>analyzeAudioCues({expected,actual,voice,music,cues:[cue]}),/decoded length/);
}
{ // 正常: 3秒、微小ノイズ入りのデコード
  const expected=sig(3,10),voice=sig(3,11),music=sig(3,12),actual=Float32Array.from(expected,(x,i)=>x+((i*7919%101)/101-.5)*1e-4);
  const r=accepts('valid decoded audio',()=>analyzeAudioCues({expected,actual,voice,music,cues:[cueOf(.8,1.6),cueOf(1.7,2.4)]}));
  if(!(r.best.correlation>.99)||r.cueChecks.some(c=>!Number.isFinite(c.headCorrelation)||c.tailSamples<1000))throw Error('valid metrics');
  rejects('silent decoded audio',()=>analyzeAudioCues({expected,actual:new Float32Array(expected.length),voice,music,cues:[cueOf(.8,1.6)]}),/silent|too low/);
  const nan=actual.slice();nan[48000*3]=NaN;rejects('NaN in decoded audio',()=>analyzeAudioCues({expected,actual:nan,voice,music,cues:[cueOf(.8,1.6)]}),/non-finite/);
  rejects('cue tail beyond signal',()=>analyzeAudioCues({expected,actual,voice,music,cues:[cueOf(2.5,3.2)]}),/outside signal/);
  rejects('cue too short',()=>analyzeAudioCues({expected,actual,voice,music,cues:[cueOf(1,1.05)]}),/too short/);
  rejects('decoded audio shorter by 0.05s at the tail cue',()=>analyzeAudioCues({expected,actual:actual.slice(0,actual.length-4800),voice,music,cues:[cueOf(2.5,2.97)]}),/outside decoded signal|outside signal/);
  rejects('silent music reference',()=>analyzeAudioCues({expected,actual,voice,music:new Float32Array(expected.length),cues:[cueOf(.8,1.6)]}),/silent/);
  rejects('level mismatch (-6dB)',()=>analyzeAudioCues({expected,actual:Float32Array.from(actual,x=>x*.5),voice,music,cues:[cueOf(.8,1.6)]}),/tolerance/);
  rejects('no cues',()=>analyzeAudioCues({expected,actual,voice,music,cues:[]}),/no cues/);
}
rejects('strictCorr out of range',()=>strictCorr(new Float32Array(100).fill(.1),new Float32Array(50).fill(.1),0,100,0,2,10),/outside decoded/);
// ---- RO-V06-03 依存 ----
const CASE='/c/case',SRC='/c/src',ecJson={a:{path:SRC+'/media/light.mov'},b:[SRC+'/media/x.png','/not/media.txt']};
const fcOf=(v,extra=[])=>({variant:v,json:{items:[CASE+'/media/intro65-v06-picture.mov',CASE+'/media/voice-r6.wav',CASE+'/media/sfx-r6.wav',...(v==='bgm'?[CASE+'/media/music-r6.wav']:[]),...extra]}});
const fsOk=new Set([SRC+'/media/light.mov',SRC+'/media/x.png',CASE+'/media/intro65-v06-picture.mov',CASE+'/media/voice-r6.wav',CASE+'/media/sfx-r6.wav',CASE+'/media/music-r6.wav']);
{ const dep=(fs_,fcs)=>checkDependencies({ec:ecJson,fcs,caseRoot:CASE,srcRoot:SRC,exists:p=>fs_.has(p)});
  const r=accepts('dependencies: Linux case + F all present',()=>dep(fsOk,[fcOf('bgm'),fcOf('voice')]));
  if(!r.fc.bgm.includes('case:media/intro65-v06-picture.mov')||!r.fc.bgm.includes('case:media/voice-r6.wav'))throw Error('case references not bound');
  const noPic=new Set(fsOk);noPic.delete(CASE+'/media/intro65-v06-picture.mov');noPic.delete(CASE+'/media/voice-r6.wav');
  rejects('PM counterexample: Linux picture and r6 WAV missing, F present',()=>dep(noPic,[fcOf('bgm'),fcOf('voice')]),/missing/);
  const noMusic=new Set(fsOk);noMusic.delete(CASE+'/media/music-r6.wav');rejects('bgm music-r6.wav missing',()=>dep(noMusic,[fcOf('bgm'),fcOf('voice')]),/music-r6/);
  rejects('FC lacks required r6 reference (stale r5)',()=>dep(new Set([...fsOk,SRC+'/media/voice-r5.wav']),[{variant:'voice',json:{i:[CASE+'/media/intro65-v06-picture.mov',SRC+'/media/voice-r5.wav',CASE+'/media/sfx-r6.wav']}}]),/required reference absent|stale/);
  rejects('reference outside allowed roots (path not echoed)',()=>dep(fsOk,[fcOf('voice',['/private/secret-dir/raw-take.wav'])]),/external/);
  try{dep(fsOk,[fcOf('voice',['/private/secret-dir/raw-take.wav'])]);}catch(e){if(e.message.includes('secret-dir'))throw Error('private directory leaked into message');}
  rejects('EC without media references',()=>checkDependencies({ec:{},fcs:[fcOf('voice')],caseRoot:CASE,srcRoot:SRC,exists:()=>true}),/no media/);
  if(collectRefs({a:'/x/y.WAV',b:'rel/a.png',c:['/z.mov']}).length!==2)throw Error('collectRefs');
}
// ---- RO-V06-02 字幕layer(保存原本) ----
const v06=JSON.parse(fs.readFileSync(path.join(here,'..','projects','intro65-v06.ecproj')));
const comp=()=>Object.values(v06.items).find(i=>i?.name==='156 EMBERWAKE intro65'&&i.kind?.layers),L=n=>comp().kind.layers.find(l=>l.name===n);
const textNode=l=>{let f;const w=o=>{if(f)return;if(Array.isArray(o))o.forEach(w);else if(o&&typeof o==='object'){if(o.match==='sourceText')f=o;else Object.values(o).forEach(w);}};w(l.props);return f.value.v;};
const mutate=(name,mut,re)=>{const undo=mut();try{rejects(name,()=>checkCaptionLayers(v06),re);}finally{undo();}};
const ft=TICKS_PER_SECOND/30;
const rep=accepts('caption layers: saved v06 project',()=>checkCaptionLayers(v06));
const f05='/mnt/f/Videos/ProjectP-EMBERWAKE-Intro60-2026-10-30/intro65-v01/projects/intro65-v05.ecproj';
if(fs.existsSync(f05))rejects('caption layers: v05 project (old timing) is rejected',()=>checkCaptionLayers(JSON.parse(fs.readFileSync(f05))),/light in|light out/);
mutate('wrong caption text',()=>{const t=textNode(L('Detail light')),o=t.text;t.text='最初の灯が点いた';return()=>{t.text=o;};},/light text|result text/);
mutate('wrong start (526f)',()=>{const l=L('Detail light'),o=l.in_point;l.in_point=526*ft;return()=>{l.in_point=o;};},/light in 526f/);
mutate('wrong end (580f)',()=>{const l=L('Detail light'),o=l.out_point;l.out_point=580*ft;return()=>{l.out_point=o;};},/light out 580f/);
mutate('following subline starts early (18.1s)',()=>{const l=L('Detail switch'),o=l.in_point;l.in_point=543*ft;return()=>{l.in_point=o;};},/switch in 543f/);
mutate('following subline wrong text',()=>{const t=textNode(L('Detail switch')),o=t.text;t.text='別の文言';return()=>{t.text=o;};},/switch text/);
mutate('result text duplicated on another layer',()=>{const t=textNode(L('Detail switch')),o=t.text;t.text='最初の灯が、点いた。';return()=>{t.text=o;};},/result text layers|switch text/);
// ---- RO-V06-02 最終MP4相当の連続frame統計 ----
const BASE=31.65,A=42.54,B=47.86,mk=({start=523,end=567,firstVisible=524,overrideSwitchText=true}={})=>{const ymax=[],yavg=[];for(let f=453;f<=600;f++){let m=96,y=BASE;if(f>=firstVisible&&f<end){const op=f===firstVisible&&firstVisible<=525?.5:1;m=op<1?120:184;y=BASE+(A-BASE)*op;}else if(f>=end+2){m=184;y=B;}else if(f===end+1){m=130;y=BASE+(B-BASE)*.5;}ymax.push(m);yavg.push(y);}void start;void overrideSwitchText;return{ymax,yavg};};
accepts('caption timeline: start fade-in 523-525, held to 567, then following subline',()=>analyzeCaptionTimeline(mk()));
rejects('caption starts late (526f)',()=>analyzeCaptionTimeline(mk({firstVisible:526})),/first visible frame 526/);
rejects('PM counterexample: caption 526f-580f passes luma ranges but ends late',()=>analyzeCaptionTimeline(mk({firstVisible:526,end:580})),/first visible|end frame|following subline/);
rejects('caption ends late only (580f)',()=>analyzeCaptionTimeline(mk({end:580})),/end frame|following subline/);
rejects('caption present before lamp',()=>{const d=mk();for(let f=480;f<=522;f++){d.ymax[f-453]=184;d.yavg[f-453]=A;}return analyzeCaptionTimeline(d);},/before lamp-on/);
rejects('caption missing',()=>{const d=mk();d.yavg=d.yavg.map(()=>BASE);d.ymax=d.ymax.map(()=>96);return analyzeCaptionTimeline(d);},/not present|first visible/);
rejects('following subline identical to result caption',()=>{const d=mk();for(let f=569;f<=600;f++)d.yavg[f-453]=A;return analyzeCaptionTimeline(d);},/end frame|following subline/);
rejects('missing/NaN statistics',()=>{const d=mk();d.yavg[10]=NaN;return analyzeCaptionTimeline(d);},/non-finite/);
rejects('statistics too short',()=>analyzeCaptionTimeline({ymax:[1,2],yavg:[1,2]}),/missing frame statistics/);
if(findLampFrame([85.6,85.1,85.5,85.6,97.1,96.9],519)!==523)throw Error('lamp frame');
rejects('lamp frame with non-finite luma',()=>findLampFrame([1,NaN,3],0),/invalid/);
console.log(JSON.stringify({ok:true,checks:results.length,captionLayerReport:rep,results},null,1));
