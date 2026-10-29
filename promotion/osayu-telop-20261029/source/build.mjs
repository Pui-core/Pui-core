import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

// PhotoCraft is the authoring and rendering engine. No generated image is used.
export const ROOT = process.env.OSAYU_TELOP_ROOT || '/home/pui/Videos/Osayu-Telop/2026-10-29';
const PC = process.env.PHOTOCRAFT_CLI || '/mnt/c/Program Files/PhotoCraft/photocraft-cli.exe';
const IM = '/mnt/c/Program Files/ImageMagick-7.1.2-Q16-HDRI/magick.exe';
const STAGE = process.env.OSAYU_TELOP_STAGE || '/mnt/c/Users/pui/AppData/Local/Temp/osayu-telop-149';
export const FONT = 'Cherry Bomb One';
export const WORDS = [
  ['01-arigatou', 'ありがとう'], ['02-ohasayu', 'おはさゆ'],
  ['03-welcome', 'はじめまして'], ['04-wait', 'ちょっとまってね'],
  ['05-live', 'はいしんちゅう'], ['06-sing', 'うたいます'],
  ['07-otsusayu', 'おつさゆ'], ['08-matane', 'またね'],
];

export function exec(exe, args, options = {}) {
  const r = spawnSync(exe, args, {encoding: 'utf8', timeout: 180000, maxBuffer: 16 * 1024 * 1024, ...options});
  if (r.error || r.status !== 0) throw Error(`${exe}: ${r.error?.message || r.stderr || r.stdout}`);
  return typeof r.stdout === 'string' ? r.stdout.replace(/^\uFEFF/, '') : r.stdout;
}
export const win = p => exec('wslpath', ['-w', path.resolve(p)]).trim();
export const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export function run(args, receipt) {
  const stdout = exec(PC, args);
  if (receipt) fs.writeFileSync(path.join(ROOT, 'qa', receipt + '.json'), JSON.stringify({args, stdout}, null, 2));
  // The CLI can report an individual failed command on stdout.
  for (const line of stdout.trim().split('\n')) {
    let result; try { result = JSON.parse(line); } catch { continue; }
    if (result.error || result.ok === false) throw Error(line);
  }
  return stdout;
}
export function author(name, width, height, commands, output, background = 'transparent') {
  const args = ['run', '--new', JSON.stringify({width, height, name, background, resolution: 72})];
  for (const [id, params] of commands) args.push('--cmd', id, '--params', JSON.stringify(params));
  args.push('--out', win(output));
  run(args, name + '-build');
}
function text(x, y, value, size, name, color) {
  return ['type.create', {x, y, text: value, font: FONT, size, color, tracking: -12, name}];
}
export function styleCommands(value, size = 230) {
  const x = 100, y = size + 110;
  return [
    text(x, y, value, size, '白いステッカー縁', '#ffffff'),
    ['layer.layerStyle.stroke', {size: 20, color: '#ffffff', position: 'outside'}],
    ['layer.layerStyle.dropShadow', {color: '#355765', opacity: 12, angle: 90, useGlobalLight: false, distance: 6, spread: 0, size: 10}],
    text(x, y, value, size, '水色の文字', '#70d0e7'),
    ['layer.layerStyle.gradientOverlay', {from: '#89dced', to: '#4fc0dc', angle: 90, reverse: true}],
    ['layer.layerStyle.stroke', {size: 2.2, position: 'outside', color: '#49a9c5', opacity: 100}],
    ['layer.layerStyle.bevelEmboss', {style: 'inner', technique: 'smooth', depth: 72, size: 17, soften: 4, direction: 'up', angle: 120, altitude: 60, glossContour: 'Linear'}],
  ];
}
function softenBevel(project) {
  const j = JSON.parse(exec('unzip', ['-p', project, 'manifest.json']));
  let bevel;
  function visit(v) {
    if (!v || typeof v !== 'object') return;
    if (v.BevelEmboss) bevel = structuredClone(v.BevelEmboss);
    for (const x of Object.values(v)) visit(x);
  }
  visit(j);
  if (!bevel) throw Error('Native bevel missing');
  bevel.shadow.opacity = 0.26;
  bevel.shadow_color.c = [0.12, 0.54, 0.66, 0];
  bevel.highlight.opacity = 0.76;
  bevel.use_global_light = false;
  const info = JSON.parse(run(['info', win(project), '--compact']));
  const layer = info.layers.find(x => x.name === '水色の文字');
  run(['run', win(project), '--cmd', 'layer.layerStyle.replace', '--params', JSON.stringify({layer: layer.id, effects: [
    {kind: 'stroke', params: {size: 2.8, position: 'outside', color: '#49a9c5', opacity: 100}},
    {kind: 'gradientOverlay', params: {from: '#89dced', to: '#4fc0dc', angle: 90, reverse: true}},
    {kind: 'bevelEmboss', params: {}, fx: {BevelEmboss: bevel}},
  ]}), '--out', win(project)], info.name + '-bevel-colour');
}
// A small, individually positioned highlight for each kana; same light direction.
const GLINTS = {
  'あ':[.27,-.54], 'り':[.16,-.57], 'が':[.33,-.57], 'と':[.27,-.55], 'う':[.32,-.60],
  'お':[.29,-.56], 'は':[.13,-.57], 'さ':[.36,-.58], 'ゆ':[.15,-.46],
  'じ':[.16,-.58], 'め':[.32,-.53], 'ま':[.34,-.59], 'し':[.14,-.59], 'て':[.48,-.58],
  'ち':[.29,-.59], 'っ':[.34,-.30], 'つ':[.27,-.43], 'ん':[.36,-.56], 'ゅ':[.20,-.35],
  'い':[.14,-.59], 'た':[.19,-.56], 'す':[.39,-.58], 'ね':[.23,-.55],
};
function highlights(project, value) {
  const args = ['run', win(project), '--cmd', 'layer.select', '--params', '{"name":"水色の文字"}'];
  for (let i=0; i<=value.length; i++) args.push('--cmd', 'type.caret', '--params', JSON.stringify({index:i}));
  const carets = run(args).trim().split('\n').map(s=>JSON.parse(s)).filter(x=>x.command==='type.caret').map(x=>x.result?.segment?.[0]);
  if (carets.length !== value.length+1 || carets.some(x=>!x?.every(Number.isFinite))) throw Error('Invalid text caret geometry');
  const base=project+'.base.png';
  run(['convert',win(project),win(base),'--format','png']);
  const header=fs.readFileSync(base), width=header.readUInt32BE(16), height=header.readUInt32BE(20);
  const pixels=exec(IM,[win(base),'-depth','8','rgba:-'],{encoding:'buffer'});
  if(pixels.length!==width*height*4) throw Error('Highlight reference decode mismatch');
  const offsets=[];
  for(let dy=-24;dy<=24;dy+=3)for(let dx=-24;dx<=24;dx+=3)offsets.push([dx,dy]);
  offsets.sort((a,b)=>a[0]**2+a[1]**2-b[0]**2-b[1]**2);
  function inside(x,y,w,h,c,s) {
    for(let v=-1;v<=1;v+=.25)for(let u=-1;u<=1;u+=.25) {
      if(u*u+v*v>1)continue;
      const px=Math.round(x+c*u*w/2-s*v*h/2),py=Math.round(y+s*u*w/2+c*v*h/2);
      if(px<0||py<0||px>=width||py>=height)return false;
      const at=(py*width+px)*4,[r,g,b,a]=pixels.subarray(at,at+4);
      if(a<250||g-r<15||b-r<25)return false;
    }
    return true;
  }
  const commands=[];
  for (let i=0; i<value.length; i++) {
    const p=GLINTS[value[i]]; if (!p) continue;
    let x=carets[i][0]+p[0]*(carets[i+1][0]-carets[i][0]), y=340+p[1]*230;
    const w=[22,16,18,21,22][i%5], h=[12,10,13,10,10][i%5];
    const a=[-28,-35,-24,-32,-18][i%5]*Math.PI/180, c=Math.cos(a), s=Math.sin(a);
    const safe=offsets.find(([dx,dy])=>inside(x+dx,y+dy,w+2,h+2,c,s));
    if(!safe)continue;
    x+=safe[0]; y+=safe[1];
    commands.push(['shape.create',{kind:'ellipse',rect:[x-w/2,y-h/2,w,h],fill:'#ffffff',name:`ツヤ ${i+1} ${value[i]}`}]);
    commands.push(['shape.edit',{transform:[c,s,-s,c,x-c*x+s*y,y-s*x-c*y]}]);
    commands.push(['layer.setProps',{opacity:.9}]);
  }
  const apply=['run',win(project)];
  for(const [id,params] of commands) apply.push('--cmd',id,'--params',JSON.stringify(params));
  apply.push('--out',win(project)); run(apply, path.basename(project)+'-glints');
}
export function buildWord([id, value]) {
  const width = 220 + value.length * 238, height = 530;
  const project = path.join(STAGE, id + '.pcraft');
  const commands = styleCommands(value);
  author(id, width, height, commands, project);
  softenBevel(project);
  highlights(project, value);
  run(['run',win(project),'--cmd','image.trim','--params','{"basedOn":"transparent"}',
    '--cmd','image.canvasSize','--params','{"width":48,"height":48,"relative":true,"extensionColor":"transparent"}',
    '--out',win(project)],id+'-trim');
  fs.writeFileSync(path.join(ROOT, 'qa', id + '-commands.json'), JSON.stringify(commands, null, 2));
  const png = path.join(STAGE, id + '.png');
  run(['convert', win(project), win(png), '--format', 'png'], id + '-export');
  for (const [src, dst] of [[project, 'PhotoCraft/' + id + '.pcraft'], [png, 'PNG/' + id + '.png']]) {
    const dest = path.join(ROOT, dst); fs.copyFileSync(src, dest);
    if (sha(src) !== sha(dest)) throw Error('Copy mismatch');
  }
  console.log(`Rendered ${value}`);
}
export function init() {
  for (const p of [STAGE, ROOT, ...['PNG', 'PSD', 'PhotoCraft', 'qa'].map(p => path.join(ROOT, p))]) fs.mkdirSync(p, {recursive: true});
  const fontList = JSON.parse(run(['run', '--new', '{"width":16,"height":16,"background":"transparent"}', '--cmd', 'type.fonts', '--params', JSON.stringify({family: FONT})]).trim());
  if (!fontList.result?.faces?.some(f => f.family === FONT)) throw Error('Install the bundled OFL font in Windows before rendering.');
  const font=path.join(ROOT,'assets/cherry-bomb-one/CherryBombOne-Regular.ttf');
  const installed='/mnt/c/Users/pui/AppData/Local/Microsoft/Windows/Fonts/CherryBombOne-Regular.ttf';
  if (sha(font)!==sha(installed)) throw Error('Installed font differs from the bundled original');
  fs.writeFileSync(path.join(ROOT,'qa/font.json'),JSON.stringify({family:FONT,sha256:sha(font),faces:fontList.result.faces,source:'https://github.com/google/fonts/tree/main/ofl/cherrybombone',license:'OFL-1.1',modified:false},null,2));
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  init();
  const words = process.argv.includes('--sample') ? WORDS.slice(0, 1) : WORDS;
  for (const word of words) buildWord(word);
}
