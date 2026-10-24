import {fileURLToPath} from 'node:url';
const captureMedia=fileURLToPath(new URL('../media/',import.meta.url));
/**
 * Issue85: actual-work camera data only. No renderer or v1 episode changes.
 * Every input stays uncropped. u/v are focal points in the ORIGINAL full image.
 * All cuts/source starts are on 30fps frames; 0.4/0.2s is the common beat grid.
 *
 * Source checks, 2026-10-24:
 * - Sword 1280x720, 8.3s: viewed 3.0s (release), 5.6s (OPEN / core below
 *   blade, u~.52 v~.62), 7.6s (REBUILDING). The 6.4–8.2s section is real
 *   reverse assembly; it is not fabricated by reversing an opening clip.
 * - Actual axe Source screenshot: code around u=.46–.89/v=.27–.47;
 *   power=2 / useSeconds=.65 / reach=6. Actual tree contact checked at9.2s.
 * - EMBERWAKE raw probe: 1280x720 /30fps /14.2s. Viewed actual full frames:
 *   1.4s hero(.20,.70), 3s(.24,.71), 5.5/6.3s(.303,.706),
 *   6.7s(.359,.706), 7.5s(.455,.65), 8.4s(.497,.656),
 *   9s(.497,.728), 10s(.503,.735), 12/14s(.497,.725).
 *   A short replay and actual-frame holds provide time without reading beyond EOF.
 * - Glass Folders real synthetic-fixture screenshots, viewed in full:
 *   popup690x720, prior-page566x552, overview1000x740, Windows-dialog463x354.
 *   Thumbnails: current popup v~.28–.73; older first row v~.23.
 *   Overview: category rows u~.05–.35/v~.20–.62, name/edit area v~.83.
 *   Initial/current are distinct revisions, not an invented UI animation.
 * - All ObjectCreator/EMBERWAKE footage is adopted actual development footage.
 *   Do not claim unreleased chip PRs or a released product. No ally-follow claim.
 * - Instrumentals are original synthesis from this commission, not a new Pui song.
 */

const ev='/mnt/f/dev/Object_creator-source/docs/evidence';
const sword=ev+'/physical-disassembly/media/sword-rear.mp4';
const axe=ev+'/programmable-tools/media/tool-program.mp4';
const axeCode=ev+'/programmable-tools/media/tool-source.jpg';
const ember='/home/pui/Videos/Studio-PV/2026-10-23/EMBERWAKE/revision-02/media/gameplay-lossless.mp4';
const glass='/mnt/f/dev/glass-folders/docs/screenshots';
const earlier='/mnt/f/dev/glass-folders/docs/evidence';
const popup=glass+'/redesign-popup.png';
const previous=earlier+'/photos-page2.png';
const overview=glass+'/redesign-overview.png';
const dialog=earlier+'/collision-dialog.png';
const score='/home/pui/Videos/Pui-Promo/2026-10-24/kinetic-five/media/';
const C=(t,u,v,z=1,r=0)=>({t,u,v,z,r});
const S=(a,b,source,at,caption,label,cam,options={})=>({
  a,b,source,at,rate:1,freeze:false,fit:'cover',caption,captionY:1470,
  label,transition:'cut',cam,end:false,...options
});

const failed=ev+'/physical-disassembly/runtime/iterations/unsupported-pommel/source-frame.jpg';
const fixed=ev+'/physical-disassembly/media/sword-open-detail.jpg';
const object={
 id:'02',slug:'pui-opens-the-inside-v2',title:'剣は開いた。けど、下が埋まってた。',duration:20.8,audio:score+'music-01.wav',audioAt:6.4,
 processEvidence:{before:failed,after:fixed,record:ev+'/physical-disassembly/runtime/iterations/unsupported-pommel/visual-review.json',editorialCaptions:true},
 shots:[
 S(0,.8,failed,0,'下、埋まってる。','ObjectCreator / 修正前の実画面',[C(0,.51,.78,1.8),C(.2,.51,.78,1.6),C(.8,.51,.78,1.6)],{freeze:true,captionY:430}),
 S(.8,2.4,captureMedia+'chatgpt-real-three-games-question.mp4',0,'制作の相談も。','ChatGPTとの実際の制作相談',[C(0,.5,.5,1),C(.3,.5,.5,1),C(1.6,.5,.5,1)],{fit:'contain',transition:'whipR',captionY:430}),
 S(2.4,4.8,failed,0,'台座に、埋まってた。','修正前 / 下の部品が隠れている',[C(0,.51,.61,1.1),C(.5,.51,.78,1.7),C(2.4,.51,.78,1.7)],{freeze:true,captionY:430}),
 S(4.8,6.4,fixed,0,'少し、上げる。','修正後 / 高さと支持具を変更',[C(0,.52,.69,1.7),C(.3,.52,.69,1.7),C(1.6,.52,.69,1.5)],{freeze:true,transition:'cut',captionY:430}),
 S(6.4,8,captureMedia+'editor-blender-sword-orbit.mp4',2,'原本も、確認。','Blender / 剣の実際のモデル原本',[C(0,.42,.5,1),C(.25,.42,.5,1.18),C(1.6,.42,.5,1.18)],{fit:'contain',captionY:1460}),
 S(8,10.4,sword,2.6,'もう一度、開く。','ObjectCreator / 修正後の実プレイ',[C(0,.5,.49,1),C(.8,.51,.55,1.15),C(2.4,.52,.61,1.5)],{rate:1.2,transition:'slideL',captionY:430}),
 S(10.4,12,sword,5.3,'','ObjectCreator / 部品を確認',[C(0,.52,.61,1.5),C(.5,.52,.68,1.7),C(1.6,.52,.68,1.6)],{rate:1.1}),
 S(12,14.4,sword,6.4,'戻すところも、確認。','ObjectCreator / 実再組立',[C(0,.52,.61,1.55),C(.8,.51,.55,1.3),C(1.6,.5,.50,1.05),C(2.4,.5,.50,1)],{rate:.75,transition:'whipR',captionY:430}),
 S(14.4,16.8,sword,8.1,'これで、次へ。','ぷいの制作記録',[C(0,.5,.5,1),C(.6,.5,.48,1.08),C(2.4,.5,.48,1.08)],{freeze:true,captionY:430}),
 S(16.8,19.2,sword,4.8,'まだ、作ってる。','ぷい / ObjectCreator 開発中',[C(0,.52,.61,1.35),C(.8,.52,.61,1.55),C(1.6,.5,.52,1.2),C(2.4,.5,.50,1)],{rate:1.3,transition:'whipL',captionY:430}),
 S(19.2,20.8,sword,8.1,'','ぷい / また、作ってる。',[C(0,.5,.5,1)],{freeze:true,end:true})
 ],endTiles:[{source:failed,at:0},{source:fixed,at:0},{source:sword,at:8.1}]
};

const pixel={
  id:'03',slug:'pui-builds-the-night-v2',title:'この一歩も、作ってる。',
  duration:20.8,audio:score+'music-03.wav',audioAt:8,
  shots:[
    // A real late jump, first. Slight rotation only with overscan above 1x.
    S(0,.8,ember,10,'この一歩、','EMBERWAKE / 開発中',[
      C(0,.503,.735,2.25,-1.4),C(.2,.503,.735,1.9),C(.8,.503,.735,1.9)
    ],{fit:'pixel',freeze:true,captionY:430}),
    S(.8,2.4,ember,1.4,'作ってる。','ぷいのゲーム',[
      C(0,.34,.50,1),C(.4,.20,.70,1.8),C(1.6,.24,.71,1.8)
    ],{fit:'pixel',transition:'whipR',captionY:430}),
    S(2.4,4,ember,3,'','EMBERWAKE / 実プレイ',[
      C(0,.24,.71,1.8),C(.8,.27,.71,1.9),C(1.6,.30,.71,1.8)
    ],{fit:'pixel'}),
    // Pull wide for the stepping stones, then follow the start of the jump.
    S(4,6.4,ember,4.6,'','EMBERWAKE / 実プレイ',[
      C(0,.30,.70,1.8),C(.6,.44,.50,1.05),C(1.2,.30,.70,1.6),C(2.4,.39,.62,1.8)
    ],{fit:'pixel',transition:'slideL'}),
    S(6.4,8,ember,6.1,'跳んで、','EMBERWAKE / 実プレイ',[
      C(0,.303,.706,1.85),C(.2,.303,.706,1.85),C(.6,.359,.706,1.85),
      C(1,.41,.59,1.9),C(1.4,.455,.65,1.85),C(1.6,.48,.66,1.85)
    ],{fit:'pixel',captionY:430}),
    S(8,10.4,ember,7.7,'','EMBERWAKE / 実プレイ',[
      C(0,.48,.67,1.85),C(.7,.497,.656,1.9),C(1.3,.497,.728,1.85),
      C(1.9,.503,.68,1.9),C(2.4,.503,.735,1.85)
    ],{fit:'pixel'}),
    S(10.4,12,ember,10.1,'','EMBERWAKE / 実プレイ',[
      C(0,.50,.73,1.85),C(.6,.50,.71,1.65),C(1.6,.52,.52,1.05)
    ],{fit:'pixel',transition:'cut'}),
    S(12,14.4,ember,11.7,'灯して、','EMBERWAKE / 実プレイ',[
      C(0,.50,.725,1.65),C(.6,.50,.725,1.9),C(1.5,.57,.63,1.35),C(2.4,.5,.5,1)
    ],{fit:'pixel',rate:.8,captionY:440}),
    // Actual near-end frame is already the lit bell. No source access beyond14.2s.
    S(14.4,16.8,ember,14,'この夜を、作る。','ぷいのゲーム EMBERWAKE',[
      C(0,.50,.725,1.8),C(.8,.54,.60,1.25),C(2.4,.50,.50,1)
    ],{fit:'pixel',freeze:true,transition:'whipL',captionY:450}),
    S(16.8,19.2,ember,6,'もう一回。','EMBERWAKE / 実プレイの再演',[
      C(0,.303,.706,1.8),C(.5,.39,.62,1.85),C(1.2,.48,.66,1.85),
      C(1.8,.497,.71,1.8),C(2.4,.50,.71,1.8)
    ],{fit:'pixel',rate:1.5,transition:'whipR',captionY:430}),
    S(19.2,20.8,ember,14,'','ぷい / また、作ってる。',[
      C(0,.50,.50,1.05),C(1.6,.50,.50,1.05)
    ],{fit:'pixel',freeze:true,end:true})
  ]
};

const tools={
  id:'04',slug:'pui-makes-their-tools-v2',title:'欲しい道具は、作る。',
  duration:20.8,audio:score+'music-04.wav',audioAt:6.4,
  shots:[
    // Current result first. Two thumbnails are the actual visual target.
    S(0,.8,popup,0,'欲しい道具、','Glass Folders / ぷいの道具',[
      C(0,.29,.30,2.7,-1),C(.2,.29,.30,2.3),C(.8,.29,.30,2.3)
    ],{fit:'contain',freeze:true,captionY:1540}),
    S(.8,2.4,popup,0,'自分で作る。','Glass Folders / 現行の実UI',[
      C(0,.29,.30,2.3),C(.4,.5,.5,1),C(1.6,.5,.5,1)
    ],{fit:'contain',freeze:true,captionY:1540}),
    S(2.4,4,previous,0,'もっと、エレガントに。','Glass Folders / 制作メモの要旨',[
      C(0,.5,.5,1.05),C(1.6,.5,.5,1.05)
    ],{fit:'contain',freeze:true,transition:'whipR',captionY:1540}),
    // Match the actual first two thumbnails across versions, not a made-up morph.
    S(4,5.6,previous,0,'','Glass Folders / 初版',[
      C(0,.5,.5,1.05),C(.4,.26,.23,2.3),C(1.6,.26,.23,2.3)
    ],{fit:'contain',freeze:true}),
    S(5.6,7.2,popup,0,'触って、直す。','Glass Folders / 現行版',[
      C(0,.29,.28,2.3),C(.2,.29,.28,2.45),C(.6,.29,.28,2.3),C(1.6,.29,.28,2.3)
    ],{fit:'contain',freeze:true,transition:'cut',captionY:1540}),
    S(7.2,9.6,overview,0,'','Glass Folders / 実UI',[
      C(0,.5,.5,1),C(.6,.24,.38,2.4),C(1.5,.24,.50,2.4),C(2.4,.24,.50,2.4)
    ],{fit:'contain',freeze:true,transition:'slideL'}),
    S(9.6,11.2,overview,0,'名前も、場所も。','Glass Folders / 実UI',[
      C(0,.24,.50,2.4),C(.4,.35,.81,2.65),C(1.6,.35,.81,2.65)
    ],{fit:'contain',freeze:true,captionY:370}),
    S(11.2,13.6,dialog,0,'確認を、はさむ。','検証用データ / Windowsの確認',[
      C(0,.5,.5,1.05),C(.4,.47,.47,1.55),C(2.4,.47,.47,1.55)
    ],{fit:'contain',freeze:true,transition:'whipL',captionY:1540}),
    // Pan across real folder thumbnails; no fabricated click or file movement.
    S(13.6,16,popup,0,'','Glass Folders / 実UI',[
      C(0,.28,.43,2.2),C(.4,.28,.43,2.2),C(1.2,.70,.43,2.2),C(2.4,.70,.43,2.2)
    ],{fit:'contain',freeze:true,transition:'slideL'}),
    S(16,19.2,popup,0,'まだ、好みに寄せる。','Glass Folders / ぷいの道具',[
      C(0,.70,.43,2.2),C(.8,.5,.5,1),C(3.2,.5,.5,1)
    ],{fit:'contain',freeze:true,captionY:1540}),
    S(19.2,20.8,popup,0,'','ぷい / また、作ってる。',[
      C(0,.5,.5,1.05),C(1.6,.5,.5,1.05)
    ],{fit:'contain',freeze:true,end:true})
  ]
};

export const motionEpisodes=[object,pixel,tools];
