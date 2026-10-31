export const width=1080,height=1920,fps=30,duration=19,compName='Osayu160 center camera';
export const anchor=[540,960];
export const characterBoxes=v=>v==='solo'?[{id:'osayu',x:400,y:980,width:280,height:560,sourceWidth:905,sourceHeight:1810}]:v==='collab'?[{id:'osayu',x:310,y:1000,width:210,height:420,sourceWidth:905,sourceHeight:1810},{id:'collaborator',x:560,y:1000,width:210,height:420,sourceWidth:2000,sourceHeight:4000}]: (()=>{throw Error('Unknown variant')})();
export function variantArg(args=process.argv.slice(2)){const i=args.indexOf('--variant');const v=i<0?'solo':args[i+1];characterBoxes(v);return v;}
export const scenes=[
{id:'date',from:0,to:3.2,heading:'11/3',sub:'チュートリアルバトル',note:'おさゆ、挑戦。',center:[380,830]},
{id:'teacher',from:3.2,to:7.2,heading:'セラ先輩',sub:'先生は セラ・ネージュ',note:'尊敬する先輩と。',center:[700,850]},
{id:'resolve',from:7.2,to:11.1,heading:'頑張ります！',sub:'緊張してるけど',note:'おさゆの挑戦',center:[370,850]},
{id:'cheer',from:11.1,to:14.8,heading:'応援、待ってます！',sub:'みんなと一緒に',note:'プロフィールから配信へ',center:[700,850]},
{id:'return',from:14.8,to:19,heading:'11/3',sub:'チュートリアルバトル',note:'プロフィールから配信へ',center:[540,850]}];
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
export const scenesFor=v=>scenes.map(s=>({...s,center:v==='collab'?[1080-s.center[0],s.center[1]]:s.center}));
export function targetAt(s,t){const u=Math.max(0,Math.min(1,(t-s.from-1.2)/(s.to-s.from-2)));return [s.center[0]+65*Math.sin(Math.PI*u),s.center[1]];}
export function cameraAt(t,v='solo'){const list=scenesFor(v),s=list.find(x=>t>=x.from&&t<x.to)||list.at(-1),local=t-s.from,rem=s.to-t;const f=Math.min(smooth(local/.65),smooth(rem/.65));const target=targetAt(s,t),scale=1+.32*f;return {position:[540-(target[0]-540)*scale*f,960-(target[1]-960)*scale*f,0],scale:[100*scale,100*scale,100],rotation:0};}
export const frames=Array.from({length:duration*fps},(_,frame)=>({frame,time:frame/fps}));
