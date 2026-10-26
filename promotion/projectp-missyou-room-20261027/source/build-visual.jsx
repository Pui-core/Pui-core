// EffectCraft visual master for ProjectP missyou #118.
// Real on-device offline footage + kinetic push-ins + Japanese subtitles.
// No Live2D avatar here (Cubism Core Java SDK not provisioned; documented in QA).
function run(id, p){ return app.run(id, p||{}); }
function set(l, path, v){ run('prop.set', {layer:l, path:path, value:v}); }
function key(l, path, t, v){ run('prop.addKey', {layer:l, path:path, time:t, timeBase:'comp', value:v}); }

var SEG = "\\\\wsl.localhost\\Ubuntu\\home\\pui\\.claude\\worktrees\\Pui-core-issue-118\\promotion\\projectp-missyou-room-20261027\\media\\segments\\";
var PROJ = "\\\\wsl.localhost\\Ubuntu\\home\\pui\\.claude\\worktrees\\Pui-core-issue-118\\promotion\\projectp-missyou-room-20261027\\projects\\missyou118-visual.ecproj";
var FONT = "UD Digi Kyokasho NP";

var W=1080, H=1920, FPS=30, DUR=30;
var comp = run('comp.new', {name:'missyou118', width:W, height:H, frameRate:FPS, duration:DUR, pixelAspect:1}).comp;
run('comp.settings', {shutterAngle:180, shutterPhase:-90, motionBlurSamples:12});
try{ run('comp.setSwitch', {switch:'motionBlur', value:true}); }catch(e){}

// soft cream background
var bg = run('layer.newSolid', {name:'bg', color:[0.96,0.94,0.90]}).layer;
set(bg,'transform/position',[540,960,0]);

// cues: start, dur, subtitle text, big(hook/title styling)
var cues = [
 {s:0.0 , d:5.6, t:'飾った日記は、\nアプリを閉じても残る？', big:true},
 {s:5.6 , d:4.4, t:'開いた日記を、額に飾って。'},
 {s:10.0, d:4.0, t:'折り紙の花にも、残せます。'},
 {s:14.0, d:4.0, t:'一度、アプリを終了。'},
 {s:18.0, d:4.0, t:'起動し直して、同じ日付を開くと。'},
 {s:22.0, d:4.0, t:'さっきの日記が、残っていました。'},
 {s:26.0, d:4.0, t:'次の変化も、ここで見届けて。', cta:true}
];

// footage layers with kinetic push-in + motion blur
for (var i=0;i<7;i++){
  var c=cues[i];
  var item = run('file.import', {paths:[SEG+'seg'+(i+1)+'.mp4']}).items[0];
  var lay = run('layer.addItem', {item:item, time:c.s, position:[540,960]}).layer;
  set(lay,'transform/anchor',[540,960,0]);
  set(lay,'transform/position',[540,960,0]);
  try{ run('layer.setSwitch', {layers:[lay], switch:'motion_blur', value:true}); }catch(e){}
  // quick entrance pop then slow push-in (subtle, keeps 額/花/日記 in frame)
  key(lay,'transform/scale', c.s,        [112,112,100]);
  key(lay,'transform/scale', c.s+0.35,   [102,102,100]);
  key(lay,'transform/scale', c.s+c.d,    [106,106,100]);
  key(lay,'transform/opacity', c.s,      0);
  key(lay,'transform/opacity', c.s+0.25, 100);
}

// readable light band + subtitle text per cue (top safe zone, clear of 額/花/日記)
function band(y,h,op){
  var s = run('layer.newSolid', {name:'band', color:[0.28,0.14,0.18]}).layer;
  set(s,'transform/anchor',[540,960,0]);
  set(s,'transform/position',[540,y,0]);
  set(s,'transform/scale',[100, (h/H)*100, 100]);
  set(s,'transform/opacity', op);
  return s;
}
for (var j=0;j<7;j++){
  var c=cues[j];
  var ty = c.big ? 470 : 250;
  var fs = c.big ? 74 : 58;
  var bh = c.big ? 330 : 190;
  var bd = band(ty, bh, 70);
  key(bd,'transform/opacity', c.s, 0);
  key(bd,'transform/opacity', c.s+0.2, 70);
  if (c.s>0) key(bd,'transform/opacity', c.s-0.001, 0);
  // hide band after its cue
  key(bd,'transform/opacity', c.s+c.d-0.2, 70);
  key(bd,'transform/opacity', c.s+c.d, 0);

  var tx = run('layer.newText', {text:c.t, font:FONT, size:fs, fill:[1,1,1], applyFill:true,
     applyStroke:true, stroke:[0.12,0.06,0.09], strokeWidth:5, strokeOverFill:false,
     justify:'center', leading: (fs*1.25), position:[540,ty]}).layer;
  // fade+rise in, hold, fade out within the cue window
  key(tx,'transform/opacity', c.s, 0);
  key(tx,'transform/opacity', c.s+0.3, 100);
  key(tx,'transform/opacity', c.s+c.d-0.25, 100);
  key(tx,'transform/opacity', c.s+c.d, 0);
  key(tx,'transform/position', c.s,     [540, ty+34, 0]);
  key(tx,'transform/position', c.s+0.35,[540, ty, 0]);
  if (c.s>0){ key(tx,'transform/opacity', c.s-0.001, 0); }
}

// persistent development/offline label (top ribbon) across the whole clip
var rib = band(60, 90, 60);
var ribt = run('layer.newText', {text:'開発中・オフライン検証データ（配信/実通信なし）', font:FONT, size:34,
   fill:[1,1,1], applyFill:true, applyStroke:true, stroke:[0.12,0.06,0.09], strokeWidth:3, justify:'center', position:[540,62]}).layer;

// CTA chip near the bottom chrome for the last cue
var cta = run('layer.newText', {text:'ProjectP・ぷい ／ missyou（開発中・フォローで続き）', font:FONT, size:33,
   fill:[1,1,1], applyFill:true, applyStroke:true, stroke:[0.20,0.10,0.13], strokeWidth:6, justify:'center', position:[540,1830]}).layer;
key(cta,'transform/opacity', 25.9, 0);
key(cta,'transform/opacity', 26.4, 100);
key(cta,'transform/opacity', 30, 100);
key(cta,'transform/opacity', 0, 0);
key(cta,'transform/opacity', 25.8, 0);

run('file.saveAs', {path: PROJ});
writeLn('BUILT comp='+comp);
