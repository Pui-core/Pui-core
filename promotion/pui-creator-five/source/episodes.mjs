import {objectReel} from './object-reel.mjs';
import {appsReel} from './apps-reel.mjs';
import {musicReel} from './music-reel.mjs';
const obj='/mnt/f/dev/Object_creator-source/docs/evidence';
const ember='/home/pui/Videos/Studio-PV/2026-10-23/EMBERWAKE/revision-02/media/gameplay-lossless.mp4';
const mv='/mnt/e/Desktop/音源/medicate/MV_v3_ArtistLyrics/medicate_MV_v3_Highlight.mp4';
const glass='/mnt/f/dev/glass-folders/docs/screenshots/redesign-popup.png';
const truth='/home/pui/tmp/truthorlie-174-release23-qa/initial-title.png';
const shot=(a,b,source,at,caption,label,mode='crop',cx=640)=>({a,b,source,at,caption,label,mode,cx});
export const episodes=[{id:'01',slug:'pui-keeps-making',title:'ぷい、また作ってる。',duration:21.6,audio:mv,audioAt:0,shots:[
shot(0,20/30,obj+'/physical-disassembly/media/sword-rear.mp4',5.5,'ゲーム、','ObjectCreator / 開発中'),
shot(20/30,41/30,ember,4,'作ってる。','EMBERWAKE / 開発中','pixel',300),
shot(41/30,82/30,glass,0,'道具も。','Glass Folders / 開発中','contain',0),
shot(82/30,164/30,obj+'/physical-disassembly/media/sword-rear.mp4',4.9,'中まで、作る。','ObjectCreator / 実プレイ'),
shot(164/30,246/30,ember,4.5,'遊べる世界を。','EMBERWAKE / 実プレイ','pixel',400),
shot(246/30,327/30,glass,0,'毎日使う、道具も。','Glass Folders / 実UI','contain',0),
shot(327/30,409/30,truth,0,'アプリも。','Truth or Lie / 実UI','portrait',0),
shot(409/30,491/30,mv,409/30,'曲も、歌も、映像も。','medicate / 曲・歌・MV：ぷい','portrait',0),
shot(491/30,573/30,obj+'/maze-campaign/media/Dungeon-campaign-play.mp4',178.55,'つくって、試して、直す。','ObjectCreator / 開発中', 'crop',800),
shot(573/30,21.6,mv,573/30,'ぷい、また作ってる。','次の制作も、見に来て。','end',0)
]}];
// Each daily reel has its own pace and sound. Only 01/05 foreground the actual song.
const scoreRoot='/home/pui/Videos/Pui-Promo/2026-10-24/kinetic-five/media/';
episodes.push({...objectReel,audio:scoreRoot+'music-01.wav',audioAt:6.4,audioCredit:'This commission: original synthesized music',shots:objectReel.shots.map((s,i)=>i===objectReel.shots.length-1?{...s,source:obj+'/physical-disassembly/media/sword-rear.mp4',at:5}:s)});
episodes.push({id:'03',slug:'pui-builds-the-night',title:'この夜を、作ってる。',duration:487/30,audio:scoreRoot+'music-03.wav',audioAt:8,shots:[
shot(0,1.4,ember,1.4,'この夜を、作ってる。','ぷいのゲーム EMBERWAKE / 開発中','pixel',280),
shot(1.4,4.6,ember,2.8,'','EMBERWAKE / 実プレイ','pixel',350),
shot(4.6,8.6,ember,6,'歩いて、灯して、少し先へ。','EMBERWAKE / 実プレイ','pixel',550),
shot(8.6,12.8,ember,10,'','EMBERWAKE / 実プレイ','pixel',650),
shot(12.8,487/30,ember,10.7,'ぷい、また作ってる。','次の制作も、見に来て。','end',640)
]});
episodes.push({...appsReel,audio:scoreRoot+'music-04.wav',audioAt:6.4,audioCredit:'This commission: original synthesized music',shots:appsReel.shots.map((s,i)=>i===appsReel.shots.length-1?{...s,source:glass,at:0}:s)});
episodes.push(musicReel);
for(const e of episodes){if(Math.abs(e.duration*30-Math.round(e.duration*30))>1e-6)throw Error('Non-frame duration');for(let i=0;i<e.shots.length;i++)if(i&&Math.abs(e.shots[i].a-e.shots[i-1].b)>1e-6)throw Error('Shot gap');}
