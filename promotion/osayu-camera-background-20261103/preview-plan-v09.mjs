// Candidate only: actual NCS recording is available, TikTok identity is not yet verified.
export const preview={fps:30,width:1080,height:1920,frames:169,duration:169/30,sourceIn:46.0755,sourceSHA256:'38b7b571b93b0df53b4f3f6832f9432c0a32906383a5de1c0e9db33b22ed3156',compName:'Osayu v09 music candidate neutral',adopted:false};
export const cutFrames=[0,85,169];
// Each camera key: frame, focus X/Y, scale, background yaw, background pitch.
export const previewCamera={
 solo:[[0,625,1065,.96,-14,6],[8,625,1065,.96,-14,6],[22,555,1010,1.01,-9,3],[28,510,920,1.22,-2,0],[41,510,920,1.22,-2,0],[56,555,1080,.92,12,-5],[70,550,1050,.97,7,-2],[84,550,1050,.97,7,-2],[85,400,1010,1.05,-14,5],[99,500,965,1.16,-2,0],[126,500,965,1.16,-2,0],[140,570,1060,.95,10,-4],[155,570,1060,.95,10,-4],[168,540,1030,.98,4,0]],
 collab:[[0,445,1080,.94,16,-6],[8,445,1080,.94,16,-6],[22,515,1020,1,-10,3],[28,585,940,1.19,1,0],[38,585,940,1.19,1,0],[56,495,1110,.92,-12,5],[73,505,1060,.96,-6,2],[84,505,1060,.96,-6,2],[85,690,1000,1.06,15,4],[99,590,930,1.17,2,0],[126,590,930,1.17,2,0],[141,520,1060,.94,-13,-5],[155,520,1060,.94,-13,-5],[168,540,1035,.99,-2,0]]
};
export function cameraSample(frame,variant){
 const keys=previewCamera[variant];let i=0;while(i<keys.length-1&&frame>=keys[i+1][0])i++;
 const a=keys[i],b=keys[Math.min(i+1,keys.length-1)];let u=b[0]===a[0]?0:(frame-a[0])/(b[0]-a[0]);u=Math.max(0,Math.min(1,u));const e=u*u*(3-2*u),jump=cutFrames.includes(b[0]);
 const [x,y,z,yaw,pitch]=a.slice(1).map((v,j)=>v+(b[j+1]-v)*(jump?0:e));return {frame,t:frame/30,target:[x,y],position:[540+(540-x)*z,960+(960-y)*z,0],scale:[z*100,z*100,100],z,yaw,pitch};
}
export const synchronization=[
 {frame:14,time:14/30,sourceSeconds:46.0755+14/30,measuredTransient:46.5243,action:'date popup lands after short overshoot'},
 {frame:28,time:28/30,sourceSeconds:46.0755+28/30,measuredTransient:47.0132,action:'diagonal camera arrival on first large bass transient'},
 {frame:56,time:56/30,sourceSeconds:46.0755+56/30,measuredTransient:47.951,action:'quick pullback reaches wide framing'},
 {frame:85,time:85/30,sourceSeconds:46.0755+85/30,measuredTransient:48.9088,action:'new shot and opposite popup entry'},
 {frame:99,time:99/30,sourceSeconds:46.0755+99/30,measuredTransient:49.3578,action:'second popup lands; camera stops for reading'},
 {frame:141,time:141/30,sourceSeconds:46.0755+141/30,measuredTransient:50.7646,action:'wide framing reached; camera hold (solo f140, collab f141)'},
 {frame:159,time:159/30,sourceSeconds:46.0755+159/30,measuredTransient:null,action:'popup exit design starts at unchanged origin'},
 {frame:160,time:160/30,sourceSeconds:46.0755+160/30,measuredTransient:null,action:'first changed popup exit position'}
];
