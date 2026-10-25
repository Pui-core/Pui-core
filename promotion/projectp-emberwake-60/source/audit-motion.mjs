import {episodes}from'./episodes.mjs';
import {stem}from'./produce.mjs';
import {file,hash,save,readText}from'./native.mjs';
const tick=254016000000;
const props=l=>Object.fromEntries(l.props.children.find(x=>x.match==='transform').children.map(x=>[x.match,x]));
for(const e of episodes){
 const id=stem(e),native='projects/'+id+'.ecproj',p=JSON.parse(readText(file(native))),m=JSON.parse(readText(file('qa/'+id+'/layout-and-motion.json')));
 const main=Object.values(p.items).find(x=>x.name===e.compName&&x.kind.type==='Comp');
 if(main.kind.duration/tick!==e.duration||main.kind.width!==1080||main.kind.height!==1920||e.shots.length!==18)throw Error('Native composition format/length differs');
 let max=0;const records=[];
 for(const row of m.motionLedger){
  const child=p.items[row.comp],layer=child.kind.layers.find(x=>x.id===row.layer),tr=props(layer),scale=tr.scale.value.v[0]/100,anchor=tr.anchor.value.v;
  if(child.kind.width!==1000||child.kind.height!==430||Math.abs(scale-row.scale)>.000001||layer.switches.motion_blur)throw Error('Detail geometry/blur differs');
  for(const k of row.keys){const saved=tr.position.keys?.find(x=>Math.abs(x.time/tick-k.time)<.000001);if(!saved)throw Error('Missing saved native focus key');const pos=saved.value.v,screen=k.focus.map((v,i)=>pos[i]+(v-anchor[i])*scale),error=Math.hypot(screen[0]-500,screen[1]-215);if(error>.01||pos.some((v,i)=>Math.abs(v-k.position[i])>.01))throw Error('Saved focus differs from plan');max=Math.max(max,error);records.push({scene:row.scene,time:k.time,focus:k.focus,screen,errorPx:error});}
  const parent=main.kind.layers.find(x=>x.name==='Directed game '+row.scene),pr=props(parent),entry=e.shots[row.scene].transition;
  if(/^slide/.test(entry)){const keys=pr.position.keys;if(keys.length!==2||Math.abs(keys[1].time/tick+parent.start_time/tick-e.shots[row.scene].a-.1666666666667)>.018||Math.abs(keys[1].value.v[0]-540)>.01)throw Error('Detail entrance does not land promptly');}
 }
 let safe=0;
 for(const b of m.boxes){
  const left=b.center[0]-b.width/2,right=b.center[0]+b.width/2,top=b.center[1]-b.height/2,bottom=b.center[1]+b.height/2;
  if(left<20||right>1000||top<80||bottom>1640)throw Error('Text outside chosen design area '+b.name);
  const layer=main.kind.layers.find(x=>x.name===b.name);if(!layer||layer.switches.motion_blur)throw Error('Missing/blurred important text '+b.name);safe++;
 }
 for(let i=0;i<e.shots.length;i++){const s=e.shots[i];if(s.a!==(i?e.shots[i-1].b:0)||s.b<=s.a)throw Error('Shot gap/overlap');if(s.kind==='game'&&s.offset+(s.b-s.a)>(e.sources[s.source].frames/30)+.01)throw Error('PNG sequence overrun');}
 save('qa/'+id+'/saved-motion-audit.json',{status:'SAVED_NATIVE_KEYS_MATCH_FOCUS_PLAN',nativeSha256:hash(file(native)),comp:e.compName,duration:e.duration,scenes:e.shots.length,rigs:m.motionLedger.length,keys:records.length,maxFocusErrorAtKeysPx:max,textBoxes:safe,mainTextDesignBounds:{x:[20,1000],y:[80,1640]},scope:'Saved native detail transforms at every planned key, prompt slide landings, text landing bounds and shot continuity. Sampled final footage is reviewed separately. Does not claim all-device platform UI safety or continuous actor tracking between every key.',records});
 console.log('Saved focus '+records.length+' keys, '+safe+' text boxes, max error '+max+'px');
}
