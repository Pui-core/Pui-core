import {fileURLToPath} from 'node:url';
const original='/home/pui/Videos/Pui-Promo/2026-10-24/creator-five-v2/media/';
const sword='/mnt/f/dev/Object_creator-source/docs/evidence/physical-disassembly/media/sword-rear.mp4';
const mv='/mnt/e/Desktop/音源/medicate/MV_v3_ArtistLyrics/medicate_MV_v3_ArtistLyrics.mp4';
const portrait='/mnt/e/Desktop/音源/medicate/MV_v3_ArtistLyrics/Assets/Portraits/artist-blue-street.png';
const c=(t,u=.5,v=.5,z=1,r=0)=>({t,u,v,z,r});
const s=(fa,fb,source,at,caption,label,cam,extra={})=>({a:fa/30,b:fb/30,source,at,caption,label,cam,fit:'cover',transition:'cut',...extra});
export const episodes=[{id:'01',slug:'projectp-first',title:'ゲーム3本、年末までに？｜制作中のぷいです',duration:818/30,mix:'first-mix.wav',chorus:{start:22,end:763/30,sourceAt:76.3,sourceEnd:2392/30},shots:[
s(0,20,sword,2.6,'','ObjectCreator / 実ゲーム',[c(0,.5,.49,1.22),c(.2,.5,.49,1.04),c(.63,.5,.49,1.04)],{rate:2}),
s(20,62,sword,4.3,'','ObjectCreator / 実ゲーム',[c(0,.5,.36,1.22),c(.18,.5,.36,1.22),c(1.2,.5,.58,1.22)],{rate:1.2,transition:'whipL'}),
s(62,82,sword,190/30,'','ObjectCreator / 実ゲーム',[c(0,.5,.62,1.6),c(.15,.5,.62,1.35),c(.6,.5,.62,1.35)],{freeze:true,transition:'snap'}),
s(82,176,original+'chatgpt-real-three-games-question.png',0,'','実際のChatGPTの相談',[c(0,.5,.5,1),c(.18,.5,.5,1),c(3.0,.5,.5,1)],{fit:'contain',kind:'chat',transition:'slideR'}),
s(176,258,sword,2.6,'いま作ってる1本。','ObjectCreator / 開発中',[c(0,.5,.49,1.18),c(.2,.5,.49,1.02),c(2.6,.5,.49,1.02)],{rate:1.1,captionY:1370,captionSize:78,transition:'whipR'}),
s(258,306,sword,190/30,'剣の「中」まで、','ObjectCreator / 分解した部品',[c(0,.5,.28,1.7),c(.17,.5,.28,1.6),c(1.5,.5,.31,1.6)],{freeze:true,captionY:1310,captionSize:87,transition:'snap'}),
s(306,348,sword,190/30,'つくる。','ObjectCreator / 分解した部品',[c(0,.5,.31,1.6),c(.55,.5,.65,1.7),c(1.3,.5,.65,1.7)],{freeze:true,captionY:470,captionSize:105}),
s(348,430,original+'editor-blender-sword-orbit.mp4',0,'モデル原本も。','Blender / 実プロジェクト',[c(0,.52,.48,1.05),c(.18,.52,.48,1.05),c(2.5,.61,.48,1.38)],{fit:'contain',crop:[240,230,1200,650],captionY:1390,captionSize:84,transition:'slideL',kind:'editor'}),
s(430,492,original+'editor-objectcreator-code.png',0,'コードも。','C# / 実コード',[c(0,.49,.25,1.1),c(.17,.49,.25,1.45),c(1.15,.49,.68,1.45),c(1.9,.49,.68,1.45)],{fit:'contain',captionY:1390,captionSize:88,transition:'slideR',kind:'editor'}),
s(492,552,sword,7,'開いて、戻せる。','ObjectCreator / 実再組立',[c(0,.5,.62,1.6),c(.3,.5,.62,1.6),c(1.7,.5,.49,1.02)],{rate:.6,captionY:470,captionSize:82,transition:'snap'}),
s(552,618,sword,8.2,'つくってる途中。','ObjectCreator / 開発中',[c(0,.5,.49,1.02),c(.25,.5,.49,1.02),c(2,.5,.49,1.16)],{freeze:true,captionY:1370,captionSize:82}),
s(618,660,portrait,0,'この声も、ぷい。','medicate / 曲・歌・MV：ぷい',[c(0,.5,.46,1.12),c(.2,.5,.46,1),c(1.3,.5,.46,1)],{captionY:570,captionSize:86,transition:'whipL',kind:'music-intro'}),
s(660,763,mv,76.3,'','medicate / サビ',[c(0,.5,.5,1),c(3.35,.5,.5,1)],{showLabel:false,chorus:true,fit:'pixel',kind:'music'}),
s(763,818,sword,8.2,'','ぷい',[c(0,.5,.5,1),c(1.7,.5,.5,1)],{freeze:true,end:true,kind:'end'})
],endTiles:[{source:sword,at:190/30}]}];
