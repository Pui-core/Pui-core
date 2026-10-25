import fs from 'node:fs';import path from 'node:path';
import {file,hash,save}from'./native.mjs';
const origin='/home/pui/Videos/ProjectP/2026-10-25/EMBERWAKE-demo',cinema='/home/pui/Videos/Studio-PV/2026-10-23/EMBERWAKE/media';
const manifest=JSON.parse(fs.readFileSync(origin+'/capture/capture-manifest.json'));
const inputs=[],sources=[];
function copy(src,rel){const dst=file(rel);fs.mkdirSync(path.dirname(dst),{recursive:true});if(!fs.existsSync(dst)||hash(src)!==hash(dst))fs.copyFileSync(src,dst);const sha=hash(src);if(hash(dst)!==sha)throw Error('Source copy differs '+rel);inputs.push({file:rel,sha256:sha,original:src});}
for(const ch of manifest.chapters){const rel='media/chapter-'+ch.roman;for(const name of fs.readdirSync(ch.frameDirectory).filter(x=>/^frame-\d+\.png$/.test(x)).sort())copy(path.join(ch.frameDirectory,name),rel+'/'+name);sources.push({name:'chapter-'+ch.roman,path:rel+'/frame-000000.png',sequence:true,width:1920,height:1080,frames:ch.frameCount,fps:30,kind:'game',chapter:ch.roman});}
for(const name of ['close','hero','high']){copy(cinema+'/'+name+'.mp4','media/cinema-'+name+'.mp4');sources.push({name:'cinema-'+name,path:'media/cinema-'+name+'.mp4',sequence:false,width:1280,height:720,kind:'cinema'});}
copy('/mnt/f/Videos/EMBERWAKE-CAMPFIRE-2026-10-25/EMBERWAKE-CAMPFIRE-main-1800x1200.png','media/campfire-main.png');sources.push({name:'campfire-main',path:'media/campfire-main.png',sequence:false,width:1800,height:1200,kind:'image'});
copy(origin+'/screenshots/08-V-dawn-district.png','media/dawn-still.png');sources.push({name:'dawn-still',path:'media/dawn-still.png',sequence:false,width:1920,height:1080,kind:'image'});
const codeSource=origin+'/capture-project/scripts/journey_cores.gd',code=fs.readFileSync(codeSource,'utf8').split('\n').slice(122,127).join('\n').replaceAll('\t','    ');fs.writeFileSync(file('source/real-code-excerpt.txt'),code.trimEnd()+'\n');
const traces=new Map();for(const ch of manifest.chapters){const raw=JSON.parse(fs.readFileSync(ch.directory+'/capture.json'));traces.set(ch.roman,ch.roman==='I'?JSON.parse(fs.readFileSync(origin+'/capture/chapter-I-frame-focus.json')).frames:raw.frame_positions);}
function follow(ch,at,d,look=[110,-35]){const rows=traces.get(ch),keys=[];for(let f=0;f<=Math.round(d*30);f+=3){const i=Math.min(rows.length-1,Math.round(at*30)+f),p=rows[i].player_screen_native;keys.push({t:f/30,x:p[0]+look[0],y:p[1]+look[1]});}const end=Math.round(d*30);if(keys.at(-1).t!==end/30){const p=rows[Math.min(rows.length-1,Math.round(at*30)+end)].player_screen_native;keys.push({t:end/30,x:p[0]+look[0],y:p[1]+look[1]});}return keys;}
const game=(a,b,ch,offset,heading,caption,extra={})=>({a,b,kind:'game',source:sources.findIndex(s=>s.chapter===ch),offset,heading,caption,label:'実ゲーム映像 / '+ch+'章 / 開発中',focus:follow(ch,offset,b-a),detailScale:100,transition:'cut',...extra});
const cinemaShot=(a,b,name,offset,heading,caption,extra={})=>({a,b,kind:'cinema',source:sources.findIndex(s=>s.name==='cinema-'+name),offset,heading,caption,label:'開発イメージ（3D演出）',transition:'whip',...extra});
const shots=[
game(0,1.2,'I',160/30,['この石を、','はめると…'],'同じ印の穴へ。',{detailScale:112}),
game(1.2,3.2,'I',196/30,['道が、','できる。'],'置く場所が、遊びになる。',{transition:'snap',detailScale:110}),
cinemaShot(3.2,6.8,'close',0,['EMBERWAKE','制作、本格化。'],'灰の灯 / ProjectP・ぷい',{rate:.75}),
cinemaShot(6.8,9.8,'hero',0,['この街に、','もう一度、灯を。'],'灯を運ぶ2Dアクションパズル。'),
game(9.8,12,'I',2.3,['制作中の','ぷいです。'],'ここから、この世界を育てます。'),
game(12,15.6,'I',3.4,['芯石を、','運ぶ。'],'同じ刻印の壁を探して。',{transition:'slideL'}),
game(15.6,18.6,'I',5.3,['はめると、','道が起きる。'],'現れた足場が、次の道になる。',{transition:'snap'}),
game(18.6,22,'I',7,['自分の足で、','登る。'],'跳んで、位置を見て、また跳ぶ。',{transition:'slideR'}),
game(22,26.2,'I',10.4,['灯した火が、','街へ返る。'],'遠くの窓が、灯に応える。'),
game(26.2,28.6,'II',3.1,['風の回廊も、','越えて。'],'II / 風と仕掛けを読む。',{transition:'whip'}),
game(28.6,31,'III',3.2,['雲の先には、','星の灯台。'],'III / 見上げる景色が変わる。',{transition:'snap'}),
game(31,33.6,'IV',3.4,['帰る道にも、','仕掛けを。'],'IV / 返り火の水脈。',{transition:'whip'}),
game(33.6,36.6,'V',3.6,['見上げた街へ、','帰ってくる。'],'V / 夜明けの街。',{transition:'snap'}),
{a:36.6,b:40,kind:'still',source:sources.findIndex(s=>s.name==='dawn-still'),offset:0,heading:['全5章のデモが、','できました。'],caption:'ここから、本制作へ。',label:'実ゲーム / 全5章デモ',transition:'slideL'},
{a:40,b:44,kind:'code',heading:['まだ、','制作の途中です。'],caption:'遊びの内側も、積み上げる。',code,codeSource:'journey_cores.gd / 123–127行（抜粋）',label:'実コード / GDScript',transition:'slideR'},
cinemaShot(44,48,'high',0,['この世界を、','もっと先まで。'],'その制作を、続けていきたい。',{rate:.70}),
{a:48,b:53,kind:'funding',source:sources.findIndex(s=>s.name==='campfire-main'),heading:['制作の応援を、','CAMPFIREで。'],caption:'支援募集の公開に向けて準備中。',label:'CAMPFIRE 公開準備中',transition:'whip'},
{a:53,b:60,kind:'end',source:sources.findIndex(s=>s.name==='dawn-still'),heading:['EMBERWAKE','灰の灯'],caption:'この制作を、応援してください。',label:'公開準備中',transition:'cut'}
];
for(const s of shots)if(Math.abs(s.a*30-Math.round(s.a*30))>.001||Math.abs(s.b*30-Math.round(s.b*30))>.001)throw Error('Not frame aligned');
const config={id:'01',slug:'emberwake-campfire-60',title:'EMBERWAKE、制作本格化。CAMPFIREに向けて。',duration:60,mix:'emberwake-60-mix.wav',compName:'EMBERWAKE Support 60',sourceCommit:manifest.sourceCommit,gameVersion:manifest.gameVersion,sources,shots,crowdfunding:{platform:'CAMPFIRE',projectId:993744,state:'unpublished',publicSupportUrl:null,checkedForDate:'2026-10-25',statusCopy:'公開に向けて準備中',actionCopy:'フォローで、公開のお知らせを。'}};
save('source/edit.json',config);fs.writeFileSync(file('source/episodes.mjs'),'export const episodes='+JSON.stringify([config],null,2)+';\n');save('qa/source-assets.json',{sourceCommit:manifest.sourceCommit,gameVersion:manifest.gameVersion,files:inputs,code:{source:codeSource,sha256:hash(codeSource),lines:[123,127],originalChanged:false},note:'Game footage is the existing actual-key/physics capture. I focus uses its documented deterministic coordinate replay; no game/world state was modified for this video.'});console.log('Sources copied and18-shot60-second edit planned');
