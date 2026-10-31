// v06 QAの純粋な判定関数。メディア/ネイティブ/ネットワークに触れず、数値fixture(v06-checks.test.mjs)で修正前後を検証できる。
// RO-V06-01: 欠損/範囲外/非有限値を必ず拒否  RO-V06-02: 字幕の本文・開始・終端を独立に照合  RO-V06-03: 現Linux case + F両方の依存を検査

const finite=(...xs)=>xs.every(x=>typeof x==='number'&&Number.isFinite(x));

// ---- RO-V06-01 ----------------------------------------------------------------
// 旧corr(範囲外サンプルをskipしn=0→NaN)をやめ、範囲外・サンプル不足・非有限値はthrowする。
export function strictCorr(a,b,start,end,lag=0,step=2,minSamples=64){
  if(!finite(start,end,lag,step)||step<1)throw Error('corr: invalid arguments');
  if(start<0||end>a.length||end<=start)throw Error(`corr: reference range outside signal (${start}-${end} of ${a.length})`);
  if(start+lag<0||end-1+lag>=b.length)throw Error(`corr: compared range outside decoded signal (${start+lag}-${end+lag} of ${b.length})`);
  let ab=0,aa=0,bb=0,n=0;
  for(let i=start;i<end;i+=step){const j=i+lag,x=a[i],y=b[j];if(!finite(x,y))throw Error('corr: non-finite sample');ab+=x*y;aa+=x*x;bb+=y*y;n++;}
  if(n<minSamples)throw Error(`corr: too few samples (${n} < ${minSamples})`);
  if(!(aa>0)||!(bb>0))throw Error('corr: silent reference or decoded segment');
  const r={correlation:ab/Math.sqrt(aa*bb),expectedRms:Math.sqrt(aa/n),actualRms:Math.sqrt(bb/n),n};
  if(!finite(r.correlation,r.expectedRms,r.actualRms))throw Error('corr: non-finite metric');
  return r;
}

// 最終AACのデコード結果(actual)と期待波形(expected)を比較する。interleaved stereo、サンプル単位は配列index。
export function analyzeAudioCues({expected,actual,voice,music,cues,sr=48000,searchLag=4096,margin=48000,headTail=7680,maxFrameDiff=4096}){
  if(!(expected instanceof Float32Array)||!(actual instanceof Float32Array)||expected.length===0)throw Error('audio: missing signal');
  if(expected.length%2||actual.length%2)throw Error('audio: not interleaved stereo');
  const ef=expected.length/2,af=actual.length/2;
  if(Math.abs(af-ef)>maxFrameDiff)throw Error(`audio: decoded length ${af} frames differs from expected ${ef} frames`);
  if(expected.length<=2*margin+2*searchLag)throw Error('audio: signal shorter than comparison margins');
  let best={correlation:-Infinity,lag:0};
  const consider=lag=>{const c=strictCorr(expected,actual,margin,expected.length-margin,lag,128,200);if(c.correlation>best.correlation)best={...c,lag};};
  for(let lag=-searchLag;lag<=searchLag;lag+=32)consider(lag);
  for(let lag=best.lag-31;lag<=best.lag+31;lag++)consider(lag);
  if(!finite(best.correlation)||best.correlation<.9)throw Error('audio: global alignment correlation too low');
  let peak=0,clip=0;for(const x of actual){if(!Number.isFinite(x))throw Error('audio: non-finite decoded sample');const ax=Math.abs(x);if(ax>peak)peak=ax;if(ax>=.999)clip++;}
  if(!(cues?.length>0))throw Error('audio: no cues to verify');
  const cueChecks=cues.map(c=>{
    const st=Math.round(c.actualStart*sr)*2,en=Math.round(c.actualEnd*sr)*2;
    if(!finite(st,en)||st<0||en>expected.length||en-st<2*headTail)throw Error(`audio cue ${c.id}: voiced range ${c.actualStart}-${c.actualEnd}s outside signal or too short`);
    const head=strictCorr(expected,actual,st,st+headTail,best.lag),tail=strictCorr(expected,actual,en-headTail,en,best.lag),whole=strictCorr(expected,actual,st,en,best.lag);
    const vr=strictCorr(voice,voice,st,en).expectedRms,mr=strictCorr(music,music,st,en).expectedRms;
    const row={id:c.id,text:c.text,kana:c.kana,voiced:[c.actualStart,c.actualEnd],headSamples:head.n,tailSamples:tail.n,wholeSamples:whole.n,headCorrelation:head.correlation,tailCorrelation:tail.correlation,wholeCorrelation:whole.correlation,actualExpectedRmsDb:20*Math.log10(whole.actualRms/whole.expectedRms),voiceMusicDb:20*Math.log10(vr/mr)};
    if(!finite(row.headCorrelation,row.tailCorrelation,row.wholeCorrelation,row.actualExpectedRmsDb,row.voiceMusicDb))throw Error(`audio cue ${c.id}: non-finite metric`);
    return row;
  });
  if(Math.abs(best.lag)>2)throw Error('audio: lag over 2 samples');
  if(clip)throw Error('audio: clipped samples');
  const bad=cueChecks.find(c=>Math.min(c.headCorrelation,c.tailCorrelation)<.96||Math.abs(c.actualExpectedRmsDb)>1);
  if(bad)throw Error(`audio cue ${bad.id}: head/tail correlation or level difference out of tolerance`);
  return{best,peak,clip,cueChecks};
}

// ---- RO-V06-03 ----------------------------------------------------------------
const MEDIA=/\.(mov|mp4|wav|png|jpg|jpeg|mp3|f32)$/i;
export function collectRefs(json){const refs=new Set();const walk=j=>{if(typeof j==='string'){if(j.startsWith('/')&&MEDIA.test(j))refs.add(j);}else if(Array.isArray(j))j.forEach(walk);else if(j&&typeof j==='object')Object.values(j).forEach(walk);};walk(json);return[...refs];}
const classify=(p,caseRoot,srcRoot)=>p.startsWith(caseRoot+'/')?'case':p.startsWith(srcRoot+'/')?'src':'external';
const rel=(p,caseRoot,srcRoot)=>p.startsWith(caseRoot+'/')?'case:'+p.slice(caseRoot.length+1):p.startsWith(srcRoot+'/')?'src:'+p.slice(srcRoot.length+1):'external:'+p.split('/').pop();
// EC/FCの実参照を現Linux case(caseRoot)とF(srcRoot)の両方から集めて存在検査する。許可root外の参照・FCの必須参照欠落・旧版(r5/v05)参照は拒否。
// 公開資料には相対名(case:/src:)のみ出し、許可root外は末尾ファイル名だけにする(私的パスを出さない)。
export function checkDependencies({ec,fcs,caseRoot,srcRoot,exists,ver='v06',audioRev='r6'}){
  if(typeof exists!=='function')throw Error('deps: exists() required');
  const report={ec:[],fc:{},missing:[],external:[]};
  const check=(label,refs)=>{for(const p of refs){const c=classify(p,caseRoot,srcRoot);if(c==='external'){report.external.push(label+' '+rel(p,caseRoot,srcRoot));continue;}if(!exists(p))report.missing.push(label+' '+rel(p,caseRoot,srcRoot));}};
  const ecRefs=collectRefs(ec);report.ec=ecRefs.map(p=>rel(p,caseRoot,srcRoot));check('ec',ecRefs);
  if(!ecRefs.length)throw Error('deps: EffectCraft project has no media references');
  for(const f of fcs){
    const refs=collectRefs(f.json);report.fc[f.variant]=refs.map(p=>rel(p,caseRoot,srcRoot));check('fc-'+f.variant,refs);
    const need=[`${caseRoot}/media/intro65-${ver}-picture.mov`,`${caseRoot}/media/voice-${audioRev}.wav`,`${caseRoot}/media/sfx-${audioRev}.wav`,...(f.variant==='bgm'?[`${caseRoot}/media/music-${audioRev}.wav`]:[])];
    for(const n of need)if(!refs.includes(n))report.missing.push('fc-'+f.variant+' required reference absent '+rel(n,caseRoot,srcRoot));
    if(f.variant!=='bgm'&&refs.some(p=>/music-r\d+\.wav$/.test(p)))report.external.push('fc-'+f.variant+' unexpected music track');
    for(const p of refs)if(/-r[0-4]\.|-r5\.|v0[1-5]/.test(p.split('/').pop()))report.external.push('fc-'+f.variant+' stale reference '+rel(p,caseRoot,srcRoot));
  }
  if(report.missing.length||report.external.length)throw Error('deps: '+JSON.stringify({missing:report.missing,external:report.external}));
  return report;
}

// ---- RO-V06-02 ----------------------------------------------------------------
export const TICKS_PER_SECOND=254016000000;
export const CAPTION_TEXT='最初の灯が、点いた。',SWITCH_TEXT='スイッチの前後を、実画面で。';
const findProps=(o,match,out=[])=>{if(Array.isArray(o))o.forEach(v=>findProps(v,match,out));else if(o&&typeof o==='object'){if(o.node==='Prop'&&o.match===match)out.push(o);Object.values(o).forEach(v=>findProps(v,match,out));}return out;};
const layerText=l=>findProps(l.props,'sourceText')[0]?.value?.v?.text;
const keyTimes=(l,match)=>findProps(l.props,match).filter(p=>p.keys).flatMap(p=>p.keys.map(k=>({time:k.time,value:k.value?.v})));
// 保存原本JSONの結果字幕/スイッチ副行のlayerを独立に照合する(本文/in/out/fade-inのkey)。523fのfade-in(不透明度0)とlayer開始時刻は別に扱う。
export function checkCaptionLayers(ec,{fps=30,lampFrame=523,endFrame=567,compName='156 EMBERWAKE intro65',compDurationSeconds=21}={}){
  const ft=TICKS_PER_SECOND/fps;
  const comp=Object.values(ec.items||{}).find(i=>i?.name===compName&&i.kind?.layers);
  if(!comp)throw Error('caption: composition not found');
  const layers=comp.kind.layers;
  const named=n=>{const m=layers.filter(l=>l.name===n);if(m.length!==1)throw Error(`caption: layer ${n} count ${m.length}`);return m[0];};
  const light=named('Detail light'),sw=named('Detail switch');
  const errs=[];
  if(layerText(light)!==CAPTION_TEXT)errs.push('light text '+JSON.stringify(layerText(light)));
  if(light.in_point!==lampFrame*ft)errs.push('light in '+light.in_point/ft+'f');
  if(light.out_point!==endFrame*ft)errs.push('light out '+light.out_point/ft+'f');
  if(layerText(sw)!==SWITCH_TEXT)errs.push('switch text '+JSON.stringify(layerText(sw)));
  if(sw.in_point!==endFrame*ft)errs.push('switch in '+sw.in_point/ft+'f');
  if(sw.out_point!==compDurationSeconds*TICKS_PER_SECOND)errs.push('switch out '+sw.out_point/TICKS_PER_SECOND+'s');
  const owners=layers.filter(l=>layerText(l)===CAPTION_TEXT).map(l=>l.name);
  if(owners.length!==1||owners[0]!=='Detail light')errs.push('result text layers '+JSON.stringify(owners));
  // fade-in: layer開始=523fでは不透明度0、2frame後(525f)に100。位置keyもlayer開始から。
  const fade=(l,start)=>{const o=keyTimes(l,'opacity'),p=keyTimes(l,'position');if(o.length!==2||p.length!==2)return'key count';if(o[0].time!==start*ft||o[0].value!==0||o[1].time!==(start+2)*ft||o[1].value!==100)return'opacity keys';if(p[0].time!==start*ft||p[1].time!==(start+4)*ft)return'position keys';return null;};
  const fl=fade(light,lampFrame),fs_=fade(sw,endFrame);
  if(fl)errs.push('light '+fl);if(fs_)errs.push('switch '+fs_);
  if(errs.length)throw Error('caption: '+errs.join('; '));
  return{light:{text:CAPTION_TEXT,inFrame:lampFrame,outFrame:endFrame,fadeInOpacity0AtStart:true,fullOpacityFrame:lampFrame+2},switch:{text:SWITCH_TEXT,inFrame:endFrame,outSeconds:compDurationSeconds},resultTextLayerOwners:owners};
}

// 最終MP4の連続frame(453..600)で測った字幕領域のYMAX/YAVGから、字幕の開始・保持・終端を照合する。
// 523fはfade-in(不透明度0)で字形が見えない前提。YAVGは下地(frame453〜522)との差で判定する。
export function analyzeCaptionTimeline({ymax,yavg,firstFrame=453,lampFrame=523,endFrame=567,lastFrame=600}){
  const idx=f=>f-firstFrame;
  if(!Array.isArray(ymax)||!Array.isArray(yavg)||ymax.length<lastFrame-firstFrame+1||yavg.length!==ymax.length)throw Error('caption timeline: missing frame statistics');
  if(![...ymax,...yavg].every(Number.isFinite))throw Error('caption timeline: non-finite statistic');
  const seg=(a,f0,f1)=>a.slice(idx(f0),idx(f1)+1);const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
  const baseSeg=seg(yavg,firstFrame,lampFrame-1),base=mean(baseSeg),errs=[];
  if(baseSeg.some(y=>Math.abs(y-base)>1)||Math.max(...seg(ymax,firstFrame,lampFrame-1))>=150)errs.push('caption visible before lamp-on');
  const first=(()=>{for(let f=firstFrame;f<=lastFrame;f++)if(yavg[idx(f)]>base+2)return f;return-1;})();
  if(first<lampFrame||first>lampFrame+2)errs.push('caption first visible frame '+first);
  const A=mean(seg(yavg,lampFrame+7,endFrame-7));
  if(!(A-base>6))errs.push('caption text not present');
  if(seg(yavg,lampFrame+3,endFrame-1).some(y=>Math.abs(y-A)>1.5)||Math.min(...seg(ymax,lampFrame+3,endFrame-1))<=150)errs.push('caption not held until end');
  const trans=(()=>{for(let f=endFrame-7;f<=lastFrame;f++)if(Math.abs(yavg[idx(f)]-A)>3)return f;return-1;})();
  if(trans<endFrame||trans>endFrame+1)errs.push('caption end frame '+trans);
  const B=mean(seg(yavg,endFrame+5,lastFrame-2));
  if(!(B-base>6&&Math.abs(B-A)>3)||Math.min(...seg(ymax,endFrame+3,lastFrame-2))<=150)errs.push('following subline text differs or absent');
  if(errs.length)throw Error('caption timeline: '+errs.join('; '));
  return{baselineYavg:base,resultCaptionYavg:A,followingSublineYavg:B,firstVisibleFrame:first,endTransitionFrame:trans};
}

// 点灯frame: 連続frameの台座周辺輝度が最初に跳ね上がるframe
export function findLampFrame(yavg,firstFrame,jump=5){if(!yavg.every(Number.isFinite)||yavg.length<2)throw Error('lamp: invalid statistics');for(let i=1;i<yavg.length;i++)if(yavg[i]-yavg[i-1]>jump)return firstFrame+i;return-1;}
