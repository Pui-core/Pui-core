import {episodes}from'./episodes.mjs';
import {stem}from'./produce.mjs';
import {file,hash,save,readText}from'./native.mjs';
const tick=254016000000;
const props=l=>Object.fromEntries(l.props.children.find(x=>x.match==='transform').children.map(x=>[x.match,x]));
function key(p,time){const k=p.keys?.find(x=>Math.abs(x.time/tick-time)<.000001);if(!k)throw Error('Missing saved '+p.match+' key @'+time);return k.value.v;}
function project(point,pos,anchor,scale,rotation){const angle=rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),x=(point[0]-anchor[0])*scale,y=(point[1]-anchor[1])*scale;return[pos[0]+x*c-y*s,pos[1]+x*s+y*c];}
for(const e of episodes){
 const id=stem(e),native='projects/'+id+'.ecproj',p=JSON.parse(readText(file(native))),m=JSON.parse(readText(file('qa/'+id+'/layout-and-motion.json'))),main=Object.values(p.items).find(x=>x.name===e.compName&&x.kind.type==='Comp');
 if(main.kind.duration/tick!==e.duration||main.kind.width!==1080||main.kind.height!==1920||e.shots.length!==18)throw Error('Native format/length differs');
 let max=0,maxPlayer=0,minScale=Infinity,maxScale=0,maxRotation=0;const records=[];
 for(const row of m.motionLedger){
  const child=p.items[row.comp],layer=child.kind.layers.find(x=>x.id===row.layer),tr=props(layer),anchor=tr.anchor.value.v,W=row.viewport.width,H=row.viewport.height;
  if(child.kind.width!==W||child.kind.height!==H||W!==1080||H!==1200)throw Error('Dominant game viewport differs');
  for(const k of row.keys){
   const pos=key(tr.position,k.time),scale=key(tr.scale,k.time)[0]/100,rotation=key(tr.rotation,k.time),focus=project(k.clampedFocus,pos,anchor,scale,rotation),error=Math.hypot(focus[0]-W/2,focus[1]-H/2),player=project(k.player,pos,anchor,scale,rotation),playerError=Math.hypot(player[0]-k.playerScreen[0],player[1]-k.playerScreen[1]);
   if(error>.02||playerError>.02||Math.abs(scale-k.scale)>.000001||Math.abs(rotation-k.rotation)>.00001||pos.some((v,i)=>Math.abs(v-k.position[i])>.02))throw Error('Saved motion differs @scene '+row.scene+' / '+k.time);
   if(player[0]<-1||player[0]>W+1||player[1]<-1||player[1]>H+1)throw Error('Player center outside game viewport');
   const angle=-rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);for(const [x,y]of [[0,0],[W,0],[0,H],[W,H]]){const dx=(x-pos[0])/scale,dy=(y-pos[1])/scale,sx=anchor[0]+dx*c-dy*s,sy=anchor[1]+dx*s+dy*c;if(sx<-.25||sx>row.sourceSize[0]+.25||sy<-.25||sy>row.sourceSize[1]+.25)throw Error('Uncovered game viewport corner @'+row.scene+' '+k.time);}
   max=Math.max(max,error);maxPlayer=Math.max(maxPlayer,playerError);minScale=Math.min(minScale,scale);maxScale=Math.max(maxScale,scale);maxRotation=Math.max(maxRotation,Math.abs(rotation));records.push({scene:row.scene,time:k.time,focus:k.clampedFocus,screen:focus,playerScreen:player,scale,rotation,errorPx:error});
  }
 }
 let safe=0;for(const b of m.boxes){const left=b.center[0]-b.width/2,right=b.center[0]+b.width/2,top=b.center[1]-b.height/2,bottom=b.center[1]+b.height/2;if(left<18||right>1002||top<75||bottom>1735)throw Error('Text outside chosen area '+b.name);const layer=main.kind.layers.find(x=>x.name===b.name);if(!layer||layer.switches.motion_blur)throw Error('Missing/blurred text '+b.name);safe++;}
 for(let i=0;i<e.shots.length;i++){const s=e.shots[i];if(s.a!==(i?e.shots[i-1].b:0)||s.b<=s.a)throw Error('Shot gap/overlap');if(s.kind==='game'&&s.offset+(s.b-s.a)>e.sources[s.source].frames/30+.01)throw Error('Sequence overrun');}
 save('qa/'+id+'/saved-motion-audit.json',{status:'SAVED_NATIVE_KEYS_MATCH_FOCUS_PLAN',nativeSha256:hash(file(native)),comp:e.compName,duration:e.duration,scenes:e.shots.length,rigs:m.motionLedger.length,keys:records.length,maxFocusErrorAtKeysPx:max,maxPlayerProjectionErrorPx:maxPlayer,scaleRange:[minScale,maxScale],maxRotationDeg:maxRotation,textBoxes:safe,viewport:[1080,1200],viewportCornersCoveredAtKeys:true,playerCentersInsideAtKeys:true,scope:'Every saved picture-camera position/scale/rotation key and viewport-corner coverage checked against the exported plan; text landing bounds checked. Pixel footage and actor silhouette are reviewed separately. No claim of real-time viewing, real RTA records or all-device UI safety.',records});console.log('Saved V2 motion verified: '+records.length+' keys, '+safe+' text boxes, scale '+minScale+'–'+maxScale);
}
