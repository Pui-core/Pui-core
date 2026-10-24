import {fileURLToPath} from 'node:url';
import {motionEpisodes} from './motion-episodes.mjs';
const dir='/mnt/f/dev/Object_creator-source/docs/evidence',sword=dir+'/physical-disassembly/media/sword-rear.mp4',axe=dir+'/programmable-tools/media/tool-program.mp4';
const ember='/home/pui/Videos/Studio-PV/2026-10-23/EMBERWAKE/revision-02/media/gameplay-lossless.mp4',glass='/mnt/f/dev/glass-folders/docs/screenshots/redesign-popup.png',oldGlass='/mnt/f/dev/glass-folders/docs/evidence/photos-page2.png',truth='/home/pui/tmp/truthorlie-174-release23-qa/initial-title.png';
const mv='/mnt/e/Desktop/音源/medicate/MV_v3_ArtistLyrics/medicate_MV_v3_ArtistLyrics.mp4';
const processMedia=fileURLToPath(new URL('../media/',import.meta.url));
const cam=(t,u,v,z=1,r=0)=>({t,u,v,z,r});
const shot=(a,b,source,at,caption,label,cam,extra={})=>({a,b,source,at,caption,label,cam,fit:'cover',transition:'cut',...extra});
export const episodes=[{id:'01',slug:'pui-promo-v2',title:'この剣、中から開く。作ってるのは、ぷい。',duration:553/30,mix:'01-pui-promo-v2-mix.wav',chorus:{start:11.2,end:439/30,sourceAt:76.3,sourceEnd:2392/30},shots:[
shot(0,.4,sword,190/30,'中から？','ObjectCreator / 開発中',[cam(0,.50,.49,1.45),cam(.12,.50,.49,1.3)],{freeze:true,captionY:430}),
shot(.4,.8,sword,2,'','ObjectCreator / 開発中',[cam(0,.50,.48,1.08),cam(.18,.50,.48,1)],{freeze:true,transition:'snap'}),
shot(.8,2,sword,2.6,'開く。','ObjectCreator / 実ゲーム',[cam(0,.50,.48,1.05),cam(.45,.50,.48,1),cam(1.05,.50,.61,1.7)],{rate:10/3,transition:'whipL',captionY:430}),
shot(2,2.8,sword,190/30,'','ObjectCreator / 分解した部品',[cam(0,.52,.20,2.5),cam(.22,.52,.20,2.3),cam(.55,.50,.73,2.2),cam(.75,.50,.73,2.1)],{freeze:true,captionY:430}),
shot(2.8,3.6,sword,7,'戻せる。','ObjectCreator / 実再組立',[cam(0,.50,.62,1.7),cam(.45,.50,.49,1.08),cam(.7,.50,.49,1)],{rate:1.625,transition:'snap',captionY:430}),
shot(3.6,4.4,processMedia+'editor-objectcreator-code.png',0,'ここも、つくる。','ObjectCreator / 実際のC#編集画面',[cam(0,.5,.5,1),cam(.18,.43,.52,1.45),cam(.7,.43,.52,1.45)],{fit:'contain',transition:'slideL'}),
shot(4.4,5.6,axe,8.8,'書き換えて、遊ぶ。','ObjectCreator / 実プレイ',[cam(0,.54,.47,1.15),cam(.35,.54,.5,1.5),cam(1.05,.54,.5,1.25)],{transition:'snap',captionY:430}),
shot(5.6,6.8,ember,6.6,'夜の世界も。','EMBERWAKE / 開発中',[cam(0,460/1280,.6,1.2),cam(.45,570/1280,.55,1.5),cam(1.1,.5,.57,1.3)],{fit:'pixel',transition:'whipR',captionY:420}),
shot(6.8,7.6,oldGlass,0,'使いたい道具も。','Glass Folders / 旧UI',[cam(0,.5,.5,1),cam(.6,.5,.42,1.2)],{fit:'contain',transition:'slideL'}),
shot(7.6,8.8,glass,0,'つくって、直す。','Glass Folders / 現UI',[cam(0,.5,.42,1.2),cam(.24,.33,.32,2.05),cam(.7,.67,.32,2.05),cam(1.05,.5,.5,1)],{fit:'contain',transition:'snap'}),
shot(8.8,9.6,truth,0,'アプリも。','Truth or Lie / 実UI',[cam(0,.5,.4,1.35),cam(.4,.5,.52,1),cam(.7,.5,.56,1)],{transition:'whipL',captionY:1440}),
shot(9.6,10.4,dir+'/maze-campaign/media/Dungeon-campaign-play.mp4',178.6,'ぜんぶ、ぷい。','ObjectCreator / 開発中',[cam(0,.59,.51,1.45),cam(.25,.59,.51,1.2),cam(.65,.58,.51,1.3)],{captionY:430,transition:'snap'}),
shot(10.4,11.2,mv,75.5,'楽曲制作も。','medicate / 曲・歌・MV：ぷい',[cam(0,.5,.45,1.18),cam(.55,.5,.5,1)],{captionY:430,transition:'whipR'}),
shot(11.2,439/30,mv,76.3,'','medicate / サビ',[cam(0,.5,.5,1),cam(2.9,.5,.5,1.03)],{captionY:430,chorus:true,showLabel:false}),
shot(439/30,451/30,sword,6.2,'','ObjectCreator',[cam(0,.5,.62,1.8),cam(.3,.5,.55,1.3)],{transition:'whipL'}),
shot(451/30,463/30,ember,9,'','EMBERWAKE',[cam(0,.5,.57,1.4),cam(.3,.5,.57,1.2)],{fit:'pixel'}),
shot(463/30,475/30,glass,0,'','Glass Folders',[cam(0,.5,.35,1.9),cam(.3,.5,.5,1.1)],{fit:'contain'}),
shot(475/30,499/30,mv,79.733333,'作る人、','ぷい',[cam(0,.5,.5,1.2),cam(.4,.5,.5,1)],{freeze:true,captionY:700}),
shot(499/30,553/30,sword,6.333333,'ぷい','次の制作も、ここで。',[cam(0,.5,.5,1)],{freeze:true,end:true,transition:'snap'})
],endTiles:[{source:sword,at:190/30},{source:ember,at:8.6},{source:glass,at:0},{source:mv,at:76.3}]}];
episodes.push(...motionEpisodes);
episodes.push({id:'05',slug:'medicate-chorus-v2',title:'曲を作る。聴いて、違うと思ったら直す。',duration:412/30,mix:'05-medicate-chorus-v2-mix.wav',audio:mv,audioAt:76.3,processEvidence:{source:'/mnt/e/Desktop/音源/medicate/MIX_v6_Natural/delivery-manifest-v6.json',sourceFields:['user_requirements.hook_reverb','user_requirements.dynamics_preference','review.v6_user_reply'],notOriginalChatCapture:true},shots:[
shot(0,1.2,mv,75.5,'','制作メモより',[cam(0,.5,.5,1)],{freeze:true,memo:['リバーブ、','かけすぎた。'],memoSource:'medicate / 制作メモ'}),
shot(1.2,4.6,processMedia+'05-wave-before.png',0,'','medicate / 調整前',[cam(0,.5,.5,1)],{wave:'調整前',showLabel:false,transition:'cut'}),
shot(4.6,5.3,mv,75.5,'','制作メモより',[cam(0,.5,.5,1)],{freeze:true,memo:['余韻を、減らす。'],memoSource:'声の強弱は、そのままに。'}),
shot(5.3,8.7,processMedia+'05-wave-after.png',0,'','medicate / 調整後',[cam(0,.5,.5,1)],{wave:'調整後',showLabel:false}),
shot(8.7,10.3,mv,76.3,'','制作メモより',[cam(0,.5,.5,1)],{freeze:true,memo:['このバランスに、','決めた。'],memoSource:'medicate / 聴き比べて決める'}),
shot(10.3,412/30,mv,76.3,'','medicate / 曲・歌・MV：ぷい',[cam(0,.5,.5,1),cam(3,.5,.5,1.03)],{showLabel:true,chorus:true,transition:'whipR'})
],endTiles:[]});
for(const e of episodes){if(Math.abs(e.duration*30-Math.round(e.duration*30))>1e-5)throw Error('Bad duration '+e.id);for(let i=0;i<e.shots.length;i++){const s=e.shots[i];if(Math.abs(s.a*30-Math.round(s.a*30))>1e-5||Math.abs(s.b*30-Math.round(s.b*30))>1e-5||i&&Math.abs(s.a-e.shots[i-1].b)>1e-5)throw Error('Bad cut '+e.id+'/'+i);}}
