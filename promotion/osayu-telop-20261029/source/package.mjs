import fs from 'node:fs';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {ROOT, WORDS, FONT, init, exec, win, run, author, sha} from './build.mjs';

const STAGE='/mnt/c/Users/pui/AppData/Local/Temp/osayu-telop-149';
const DELIVERY=process.env.OSAYU_TELOP_DELIVERY || '/mnt/f/Users/pui/Documents/gara/おさゆ_ぷくフォント_20261029';
const IM='/mnt/c/Program Files/ImageMagick-7.1.2-Q16-HDRI/magick.exe';
const REPO=path.resolve(new URL('../',import.meta.url).pathname);
const PHONE=path.join(ROOT,'iPhone-font');
init();
const fontBuild=JSON.parse(fs.readFileSync(path.join(ROOT,'font/font-qa.json'),'utf8'));
fs.mkdirSync(PHONE,{recursive:true});
function pngSize(file) {
  const b=fs.readFileSync(file); if (b.subarray(1,4).toString()!=='PNG') throw Error('Not PNG');
  return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
}
const layout=[];
for(let i=0;i<WORDS.length;i++) {
  const [id,text]=WORDS[i], file=path.join(ROOT,'PNG',id+'.png'), {width,height}=pngSize(file);
  layout.push({id,text,file,width,height,x:400+(i%2)*800,y:145+Math.floor(i/2)*280,scale:Math.min(690/width,212/height,1)*100});
}
function placed(item,offset=0) {
  return [['file.placeEmbedded',{path:win(item.file),scale:item.scale,fit:false,smartObject:false,center:[item.x,item.y+offset]}],
    ['layer.setProps',{name:`${item.id} ${item.text}`}]];
}
author('osayu-layer-sheet',1600,1120,layout.flatMap(x=>placed(x)),path.join(STAGE,'osayu-layer-sheet.pcraft'));
run(['convert',win(path.join(STAGE,'osayu-layer-sheet.pcraft')),win(path.join(STAGE,'osayu-layer-sheet.psd')),'--format','psd'],'sheet-psd');
const preview=[
  ['type.create',{text:'おさゆのテロップ',font:'Noto Sans JP',size:36,x:72,y:75,color:'#345969',weight:700,name:'見本の見出し'}],
  ['type.create',{text:'水色 / 透過PNG 8点',font:'Noto Sans JP',size:19,x:74,y:112,color:'#678794',name:'見本の説明'}],
];
for(const item of layout) preview.push(...placed(item,140));
author('osayu-preview',1600,1260,preview,path.join(STAGE,'osayu-preview.pcraft'),'#f5f9fb');
run(['convert',win(path.join(STAGE,'osayu-preview.pcraft')),win(path.join(STAGE,'osayu-preview.png')),'--format','png'],'preview');

fs.cpSync(path.join(ROOT,'PNG'),path.join(PHONE,'PNG'),{recursive:true});
fs.copyFileSync(path.join(STAGE,'osayu-layer-sheet.psd'),path.join(PHONE,'おさゆ_レイヤー素材.psd'));
fs.copyFileSync(path.join(STAGE,'osayu-preview.png'),path.join(PHONE,'見本一覧.png'));
const fonts=path.join(PHONE,'フォント');fs.mkdirSync(fonts,{recursive:true});
fs.copyFileSync(path.join(ROOT,'font/OsayuPuku-Regular.ttf'),path.join(fonts,'OsayuPuku-Regular.ttf'));
fs.copyFileSync(path.join(ROOT,'assets/cherry-bomb-one/OFL.txt'),path.join(fonts,'OFL-CherryBombOne.txt'));
fs.copyFileSync(path.join(ROOT,'assets/OFL.txt'),path.join(fonts,'OFL-MochiyPopOne.txt'));
const guide=`おさゆ ぷく / Osayu Puku / 2026-10-29

【好きな文字を入力するフォントを追加】
1. ZIPをiPhoneの「ファイル」に保存し、タップして展開します。
2. フォント/OsayuPuku-Regular.ttf を長押し→共有→ibisPaintを選びます。
3. ibisPaintでキャンバスを開き、文字入れのフォント一覧から
   「おさゆ ぷく」または「Osayu Puku」を選び、好きな言葉を入力します。
   外部ブラウザから取得したファイルを共有するのが現在の公式手順です。

【水色のぷっくり文字にする】
1. 文字入れの「スタイル」で文字色を #70D0E7、ふちどりの色を白へ。
   ふちの太さは文字サイズの約7〜9%を出発点に、読める太さへ調整します。
2. 元の文字レイヤーを複製して残します。
3. 加工用レイヤーに「ベベル (内側)」を使い、光源を左上へ。
   高さ・滑らかさ・ハイライトの大きさを調整します。
   編集可能な文字に直接フィルターを掛けられない場合は、複製側をラスタライズします。
4. 文言を変えるときは残しておいた文字レイヤーを編集し、効果を掛け直します。
   TTF自体に色やツヤは含まれません。上記は見本へ近づける調整手順です。

【フォントについて】
PhotoCraftで英数字・かな・記号294文字の輪郭と太さ・間隔を調整しました。
Cherry Bomb One (Satsuyako) と Mochiy Pop One (FONTDASU) を元にした派生書体です。
日本語の常用漢字2,136字とJIS第1・第2水準の漢字6,355字に対応しています。
かな等以外は元のMochiy Pop Oneを継承しています。中国語の網羅を目的にしていません。
すべての漢字・絵文字への対応は保証しません。横書きの表示用として検証しています。
元の著作権表示とOFL-1.1を同梱。動画・配信などで利用できます。

【すぐ使える見本画像】
PNGフォルダには水色のツヤ・白フチ込みで、背景が透明な画像8点があります。

【ibisPaintに画像を入れる】
1. ibisPaintでキャンバスを開き、レイヤー画面の写真読み込みからPNGを選びます。
   または「ファイル」でPNGの共有→ibisPaintへ読み込みます。
2. サイズと位置を調整します。白い紙のように見えても、PNGの背景は透明です。
3. 素材を書き出すときは「透過PNG」を選びます。

【レイヤー版】
「おさゆ_レイヤー素材.psd」は、言葉ごとに画像レイヤーを分けた素材一覧です。
「ファイル」等の共有→ibisPaintで取り込めます。各レイヤーを選択・移動できます。
PSD上の文字は画像です。文章の打ち替えはできません。

【内容】
${WORDS.map(([,t],i)=>String(i+1).padStart(2,'0')+' '+t).join('\n')}

【利用・確認】
PCで透過・文字表示・PhotoCraft再読込・PSD往復を検証します。
iPhone実機/ibisPaintでの取り込み・表示は未検証です。

公式の取り込み案内:
https://ibispaint.com/historyAndRights.jsp?newsID=290994073
https://ibispaint.com/newFeature.jsp?lang=ja
https://ibispaint.com/lecture/index.jsp?lang=ja&no=37
https://ibispaint.com/lecture/index.jsp?no=113
`;
fs.writeFileSync(path.join(PHONE,'はじめに.txt'),guide);
fs.mkdirSync(DELIVERY,{recursive:true});
for(const d of ['PNG','PhotoCraft']) fs.cpSync(path.join(ROOT,d),path.join(DELIVERY,d),{recursive:true});
fs.cpSync(PHONE,path.join(DELIVERY,'iPhone'),{recursive:true});
fs.mkdirSync(path.join(DELIVERY,'制作ソース'),{recursive:true});
for(const file of ['build.mjs','package.mjs','extract-glyphs.mjs','compile-font.py','requirements-font.txt','font-proof.mjs']) fs.copyFileSync(new URL(file,import.meta.url),path.join(DELIVERY,'制作ソース',file));
fs.copyFileSync(path.join(ROOT,'native-glyphs.json'),path.join(DELIVERY,'制作ソース/native-glyphs.json'));
fs.copyFileSync(path.join(STAGE,'osayu-preview.png'),path.join(DELIVERY,'見本一覧.png'));

const checks=[];
for(const [id,text] of WORDS) {
  const project=path.join(DELIVERY,'PhotoCraft',id+'.pcraft'), png=path.join(DELIVERY,'PNG',id+'.png');
  const info=JSON.parse(run(['info',win(project),'--compact'],id+'-delivery-info'));
  if(info.warnings?.length || info.layers.filter(x=>x.kind==='Type').length!==2) throw Error('Native text mismatch');
  if(info.layers.some(x=>x.text && (x.text.font!==FONT || x.text.text!==text))) throw Error('Native font/text mismatch');
  const round=path.join(STAGE,id+'-reopened.pcraft'), render=path.join(STAGE,id+'-reopened.png');
  run(['run',win(project),'--out',win(round)],id+'-reopen');
  run(['convert',win(round),win(render),'--format','png'],id+'-reopen-export');
  if(sha(png)!==sha(render)) throw Error('Native roundtrip changed PNG');
  const size=pngSize(png);
  const raw=Buffer.from(exec(IM,[win(png),'-depth','8','rgba:-'],{encoding:'buffer'}));
  let count=0, transparent=0, minX=size.width,minY=size.height,maxX=-1,maxY=-1;
  if(raw.length!==size.width*size.height*4) throw Error('RGBA length mismatch');
  for(let y=0;y<size.height;y++)for(let x=0;x<size.width;x++) {
    const a=raw[(y*size.width+x)*4+3];
    if(!a)transparent++; else {count++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  }
  if(count<1000 || transparent<1000 || minX<16 || minY<16 || maxX>size.width-17 || maxY>size.height-17) throw Error('Empty, opaque, or clipped PNG: '+id);
  checks.push({id,text,...size,sha256:sha(png),nontransparent:count,transparent,alphaBounds:[minX,minY,maxX,maxY],nativeRoundtrip:true});
}
const psd=path.join(DELIVERY,'iPhone/おさゆ_レイヤー素材.psd');
const psdInfo=JSON.parse(run(['info',win(psd),'--compact'],'psd-readback'));
if(psdInfo.warnings?.length || psdInfo.layers.filter(x=>x.bounds[2]>0).length!==8) throw Error('PSD layers missing');
run(['convert',win(path.join(STAGE,'osayu-layer-sheet.pcraft')),win(path.join(STAGE,'sheet-native.png')),'--format','png'],'sheet-native');
run(['convert',win(psd),win(path.join(STAGE,'sheet-psd.png')),'--format','png'],'sheet-readback');
if(sha(path.join(STAGE,'sheet-native.png'))!==sha(path.join(STAGE,'sheet-psd.png'))) throw Error('PSD roundtrip changed composite');
const report={checkedAt:new Date().toISOString(),issue:'https://github.com/Pui-core/-/issues/149',renderer:'PhotoCraft CLI',font:JSON.parse(fs.readFileSync(path.join(ROOT,'qa/font.json'),'utf8')),images:checks,psd:{layers:8,pixelRoundtrip:true,sha256:sha(psd)},iphoneTest:false,ibisPaintTest:false,sourceCodeIsReproductionAuthority:true};
if(fontBuild.sha256!==report.font.sha256 || !fontBuild.deterministicRebuild || !fontBuild.replacementCountersPreserved)throw Error('Font compilation mismatch');
if(fontBuild.japaneseCoverage?.joyo?.supportedNonempty!==2136 || fontBuild.japaneseCoverage?.jis0208Level1And2?.supportedNonempty!==6355)throw Error('Required Japanese kanji missing');
report.fontBuild=structuredClone(fontBuild);delete report.fontBuild.replacements;
delete report.fontBuild.charsetSelection.removedCodepoints;
fs.writeFileSync(path.join(ROOT,'qa/validation.json'),JSON.stringify(report,null,2));
fs.mkdirSync(path.join(REPO,'delivery'),{recursive:true});
fs.mkdirSync(path.join(REPO,'font'),{recursive:true});
fs.copyFileSync(path.join(fonts,'OsayuPuku-Regular.ttf'),path.join(REPO,'font/OsayuPuku-Regular.ttf'));
for(const file of ['OFL-CherryBombOne.txt','OFL-MochiyPopOne.txt'])fs.writeFileSync(path.join(REPO,'font',file),fs.readFileSync(path.join(fonts,file),'utf8').replace(/\r\n/g,'\n').replace(/[ \t]+$/gm,''));
fs.writeFileSync(path.join(REPO,'font/native-glyphs.json.gz'),gzipSync(fs.readFileSync(path.join(ROOT,'native-glyphs.json')),{level:9}));
fs.copyFileSync(path.join(ROOT,'cherry-codepoints.json'),path.join(REPO,'font/cherry-codepoints.json'));
for(const file of ['joyo-codepoints.json','jis0208-level1-level2-codepoints.json'])fs.copyFileSync(path.join(ROOT,'kanji-qa',file),path.join(REPO,'font',file));
const zip=path.join(DELIVERY,'osayu-telop-iphone.zip');
const archive=path.join(STAGE,'osayu-telop-iphone-build.zip');
fs.rmSync(archive,{force:true});
exec('zip',['-q','-r',archive,'.'],{cwd:PHONE});
exec('unzip',['-tq',archive]);
fs.copyFileSync(archive,zip);
fs.copyFileSync(zip,path.join(REPO,'delivery/osayu-telop-iphone.zip'));
fs.copyFileSync(path.join(STAGE,'osayu-preview.png'),path.join(REPO,'delivery/preview.png'));
fs.copyFileSync(path.join(ROOT,'qa/validation.json'),path.join(REPO,'validation.json'));
fs.copyFileSync(zip,path.join(ROOT,'osayu-telop-iphone.zip'));
fs.copyFileSync(path.join(ROOT,'qa/validation.json'),path.join(DELIVERY,'検証結果.json'));
console.log(JSON.stringify({delivery:DELIVERY,zip,bytes:fs.statSync(zip).size,sha256:sha(zip),images:checks.length,psdLayers:8}));
