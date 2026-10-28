import fs from 'node:fs';import {file,save,hash} from './native.mjs';
const own=JSON.parse(fs.readFileSync(file('source/firstcut04k-bridge-own-audio.json'))).cues;
const ac=JSON.parse(fs.readFileSync(file('source/firstcut04k-act1-chunk-plan.json'))).chunks;
const sc=JSON.parse(fs.readFileSync(file('source/firstcut04k-story-agent-chunks-plan.json')));
const get=(i)=>`videos/firstcut04k-act1-chunk${String(i).padStart(2,'0')}-attempt01.mp4`;
const story=(p)=>`videos/firstcut04k-story-agent-${p}.mp4`;
const ed=(p)=>JSON.parse(fs.readFileSync(file(`source/firstcut04k-story-agent-${p}-edit.json`)));
const result=(p)=>JSON.parse(fs.readFileSync(file(`qa/firstcut04k-story-agent-${p}-render.json`)));
const bridge=id=>own.find(x=>x.id===id);const old='videos/emberwake-firstcut04j-f-native.mp4';const resultList=[];let cursor=0;
function add(fileName,sourceFrame,frames,kind,audioFile=fileName,audioFrame=sourceFrame,cueIds=[]){if(!Number.isInteger(sourceFrame)||!Number.isInteger(frames)||frames<=0)throw Error('Invalid frame selection '+kind);for(const p of [fileName,audioFile])if(!fs.existsSync(file(p)))throw Error('Unavailable '+p);resultList.push({file:fileName,audioFile,sourceFrame,audioFrame,startFrame:cursor,endFrame:cursor+frames,frames,kind,cueIds});cursor+=frames;}
function addBridge(id){let b=bridge(id);add(old,b.oldVideoStartFrame,b.frames,'source-backed narrative '+id,b.processedFile,0,[id]);}
for(const c of ac){const p=get(c.index);const r=file(`qa/firstcut04k-act1-chunk${String(c.index).padStart(2,'0')}-attempt01-result.json`);if(!fs.existsSync(r))throw Error('unverified act1 chunk '+c.index);let proof=JSON.parse(fs.readFileSync(r));if(!proof.fullAvDecode||proof.frames!==c.frames)throw Error('act1 chunk proof mismatch');if(c.index===1){const cut=619;add(p,0,cut,'act1 opening',p,0,['u001','u002','u003','u004']);addBridge('u005');add(p,cut,c.frames-cut,'act1 after opening',p,cut,['u009','u010']);}else add(p,0,c.frames,'act1 part '+c.index,p,0,c.cueIds);}
addBridge('u097');
const art='videos/firstcut04k-artinput-agent10-recovered.mp4';const artProof=JSON.parse(fs.readFileSync(file('qa/firstcut04k-artinput10-recover-result.json')));if(!artProof.avDecode||artProof.frames<763)throw Error('art proof missing');add(art,0,763,'art comparison',art,0,['u098','u099','u100']);addBridge('u101');add(art,763,artProof.frames-763,'jump input',art,763,['jump01','jump02','jump03','jump04','jump05','jump07','jump06']);
function addStory(p,from=0,to=null){const e=ed(p),q=result(p);if(!q.decode||q.frames!==e.frames)throw Error('story proof missing '+p);const end=to??e.frames;if(from<0||end>e.frames)throw Error('story range mismatch');add(story(p),from,end-from,'story '+p,story(p),from,e.cues.filter(c=>Math.round(c.start*30)>=from&&Math.round(c.start*30)<end).map(c=>c.id));}
addStory('rest04-chunk01');addStory('rest04-chunk02',0,443);
for(let i=1;i<=4;i++)addStory(`ep46b-chunk0${i}`);
addStory('rest04-chunk02',443);
for(let i=3;i<=6;i++)addStory(`rest04-chunk0${i}`);
const e7=ed('rest04-chunk07'),split=Math.round(e7.cues.find(x=>x.id==='u115').start*30);addStory('rest04-chunk07',0,split);
const city='videos/firstcut04k-city-own.mp4';let cp=JSON.parse(fs.readFileSync(file('qa/firstcut04k-city-own-result.json')));if(!cp.fullAvDecode||cp.frames!==320)throw Error('city proof missing');add(city,0,320,'verified cities',city,0,['cityown01','cityown02']);addStory('rest04-chunk07',split);addStory('rest04-chunk08');
const endPath='videos/firstcut04k-story-agent-ending01.mp4',endEdit=JSON.parse(fs.readFileSync(file('source/firstcut04k-story-agent-ending01-edit.json'))),endProof=JSON.parse(fs.readFileSync(file('qa/firstcut04k-story-agent-ending01-render.json')));if(!endProof.decode||endProof.frames!==endEdit.frames||endEdit.cues.map(x=>x.id).join(',')!=='u124,u125')throw Error('outro proof mismatch');add(endPath,0,endEdit.frames,'ending',endPath,0,['u124','u125']);
const all=resultList.flatMap(x=>x.cueIds);const counts=new Map();for(const id of all)counts.set(id,(counts.get(id)||0)+1);const duplicates=[...counts].filter(([id,n])=>n>1);if(duplicates.length)throw Error('Repeated narration '+JSON.stringify(duplicates));if(cursor<18000)throw Error('Output below 600 seconds '+cursor/30);
save('source/firstcut04k-full-plan-own.json',{frames:cursor,seconds:cursor/30,segments:resultList,actualAssembly:false,musicSelected:false,wholeWatch:false,subjectiveListen:false,published:false});console.log(JSON.stringify({frames:cursor,seconds:cursor/30,segments:resultList.length,cues:all.length}));
