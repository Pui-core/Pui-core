/** Provisional geometry only. A confirmed stream background still determines final art direction. */
export const width = 1080, height = 1920, fps = 30, duration = 19;
export const compName = 'Osayu158 stream-layout mechanism';
export const anchor = [540, 480];
export const characterBox = {x: 500, y: 760, width: 450, height: 900};
export const characterBoxes = variant => {
 if(!['solo','collab'].includes(variant))throw Error('Unknown variant');
 return variant==='solo'?[{id:'osayu',...characterBox,sourceWidth:905,sourceHeight:1810}]:[
  {id:'osayu',x:90,y:930,width:400,height:800,sourceWidth:905,sourceHeight:1810},
  {id:'collaborator',x:590,y:930,width:400,height:800,sourceWidth:2000,sourceHeight:4000},
 ];
};
export function variantArg(args=process.argv.slice(2)) {const i=args.indexOf('--variant'),v=i<0?'solo':args[i+1];characterBoxes(v);return v;}
export const scenes = [
  {id: 'date', from: 0, to: 3.2, heading: '11/3', sub: 'チュートリアルバトル', note: 'おさゆ、挑戦。', center: [310, 450]},
  {id: 'teacher', from: 3.2, to: 7.2, heading: 'セラ先輩', sub: '先生は セラ・ネージュ', note: '尊敬する先輩と。', center: [750, 450]},
  {id: 'resolve', from: 7.2, to: 11.1, heading: '頑張ります！', sub: '緊張してるけど', note: 'おさゆの挑戦', center: [340, 450]},
  {id: 'cheer', from: 11.1, to: 14.8, heading: '応援、待ってます！', sub: 'みんなと一緒に', note: 'プロフィールから配信へ', center: [710, 450]},
  {id: 'return', from: 14.8, to: 19, heading: '11/3', sub: 'チュートリアルバトル', note: 'プロフィールから配信へ', center: [540, 450]},
];
const clamp = x => Math.max(0, Math.min(1, x));
export const smooth = x => {const t = clamp(x); return t*t*(3-2*t);};
const mix = (a,b,t) => a+(b-a)*t;
export function sceneAt(t) {return scenes.find(s => t >= s.from && t < s.to) ?? scenes.at(-1);}
export function targetAt(scene, t) {
  const u = clamp((t-scene.from)/(scene.to-scene.from));
  return [scene.center[0]+(scene.id==='return' ? 0 : 90*Math.sin(Math.PI*u)), scene.center[1]];
}
export function cameraAt(t) {
  const s = sceneAt(t), local = t-s.from, remaining = s.to-t;
  const focus = s.id==='return' ? 1-smooth(local/.8) : Math.min(smooth(local/.55), smooth(remaining/.5));
  const target = targetAt(s,t), scale = 1+.28*focus;
  return {position: [mix(anchor[0],540-(target[0]-anchor[0])*scale,focus), mix(anchor[1],480-(target[1]-anchor[1])*scale,focus),0], scale: [100*scale,100*scale,100], rotation: 0};
}
export function screenPoint(point, camera) {
  const r = camera.rotation*Math.PI/180, x = (point[0]-anchor[0])*camera.scale[0]/100, y = (point[1]-anchor[1])*camera.scale[1]/100;
  return [camera.position[0]+x*Math.cos(r)-y*Math.sin(r), camera.position[1]+x*Math.sin(r)+y*Math.cos(r)];
}
export const frames = Array.from({length: duration*fps},(_,i)=>({frame:i,time:i/fps}));
export const reviewTimes = [.8,1.4,2.4,3.9,4.8,6.3,8,9.3,10.3,11.9,13,14,15.8,17,18.8];
export const trackWindows = scenes.filter(s=>s.id!=='return').map(s=>({id:s.id,from:s.from+.6,to:s.to-.55}));
