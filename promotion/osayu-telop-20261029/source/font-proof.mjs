import fs from 'node:fs';
import path from 'node:path';
import {ROOT,FONT,init,author,run,win,sha} from './build.mjs';
const stage='/mnt/c/Users/pui/AppData/Local/Temp/osayu-telop-149';
const delivery=process.env.OSAYU_TELOP_DELIVERY||'/mnt/f/Users/pui/Documents/gara/おさゆ_ぷくフォント_20261029';
init();
const lines=[
 ['おさゆ ぷく',108,'#345969'],
 ['Osayu Puku  /  好きな言葉を、ぷっくりと。',45,'#678794'],
 ['あいうえお　かきくけこ',80,'#55bcd7'],
 ['さしすせそ　たちつてと',80,'#55bcd7'],
 ['なにぬねの　はひふへほ',80,'#55bcd7'],
 ['まみむめも　やゆよ　らりるれろ　わをん',72,'#55bcd7'],
 ['がぎぐげご　ざじずぜぞ　だぢづでど',72,'#55bcd7'],
 ['ばびぶべぼ　ぱぴぷぺぽ　ぁぃぅぇぉっゃゅょ',68,'#55bcd7'],
 ['アイウエオ　カキクケコ　サシスセソ',72,'#345969'],
 ['タチツテト　ナニヌネノ　ハヒフヘホ',72,'#345969'],
 ['マミムメモ　ヤユヨ　ラリルレロ　ワヲン',68,'#345969'],
 ['初見・配信・歌・感謝・応援・音桜夢',72,'#345969'],
 ['雑談　記念　誕生日　歌枠　ありがとう',72,'#345969'],
 ['ABCDEFGHIJKLMNOPQRSTUVWXYZ',64,'#55bcd7'],
 ['abcdefghijklmnopqrstuvwxyz',64,'#55bcd7'],
 ['0123456789　!? ！？ ♪ ♡',68,'#55bcd7'],
];
const commands=lines.map(([text,size,color],i)=>['type.create',{x:80,y:150+i*108,text,font:FONT,size,color,name:'自由入力 '+(i+1)}]);
const project=path.join(stage,'font-proof.pcraft');
author('osayu-font-proof',1800,1900,commands,project,'#f8fbfc');
const png=path.join(stage,'font-proof.png'),round=path.join(stage,'font-proof-reopened.pcraft'),again=path.join(stage,'font-proof-reopened.png');
run(['convert',win(project),win(png),'--format','png'],'font-proof');
run(['run',win(project),'--out',win(round)],'font-proof-reopen');
run(['convert',win(round),win(again),'--format','png'],'font-proof-reopen-render');
if(sha(png)!==sha(again))throw Error('Font proof roundtrip mismatch');
const info=JSON.parse(run(['info',win(project),'--compact'],'font-proof-info'));
const typed=info.layers.filter(x=>x.kind==='Type');
if(info.warnings?.length||typed.length!==lines.length||typed.some(x=>x.text.font!==FONT))throw Error('Font proof fallback/missing layer');
for(const x of typed)if(x.bounds[0]<0||x.bounds[1]<0||x.bounds[0]+x.bounds[2]>info.width||x.bounds[1]+x.bounds[3]>info.height)throw Error('Font proof clipped '+x.name);
fs.copyFileSync(project,path.join(delivery,'PhotoCraft/フォント見本.pcraft'));
fs.copyFileSync(png,path.join(delivery,'フォント見本.png'));
fs.copyFileSync(png,new URL('../delivery/font-preview.png',import.meta.url));
fs.writeFileSync(new URL('../font-proof.json',import.meta.url),JSON.stringify({font:FONT,sha256:sha(path.join(ROOT,'font/OsayuPuku-Regular.ttf')),pngSha256:sha(png),lines:lines.map(x=>x[0]),nativeTextLayers:typed.length,nativeRoundtrip:true,iphoneTest:false,ibisPaintTest:false},null,2));
console.log('Free text proof: '+typed.length+' editable native text layers / roundtrip equal');
