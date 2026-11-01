function r(i,p){return app.run(i,p||{});}
app.beginUndoGroup('156 v06 align result caption to lamp-on frame');
var comp=app.project.activeItem,light=comp.layer('Detail light').index,sw=comp.layer('Detail switch').index;
function mv(l,p,a,b){r('keys.set',{layer:l,path:p,time:a/30,newTime:b/30,timeBase:'comp'});}
// 後ろのkeyから移動(衝突回避)。light: 15.1s(453f)=entry開始 → 点灯frame。 switch: 18.1s(543f) → 結果字幕の終端。
mv(light,'transform/position',457,457+70);mv(light,'transform/position',453,453+70);
mv(light,'transform/opacity',455,455+70);mv(light,'transform/opacity',453,453+70);
r('layer.timing',{layers:[light],in:17.433333333333334,out:18.9});
mv(sw,'transform/position',547,547+24);mv(sw,'transform/position',543,543+24);
mv(sw,'transform/opacity',545,545+24);mv(sw,'transform/opacity',543,543+24);
r('layer.timing',{layers:[sw],in:18.9,out:21});
app.endUndoGroup();
writeLn(JSON.stringify({light:[comp.layer('Detail light').inPoint,comp.layer('Detail light').outPoint],sw:[comp.layer('Detail switch').inPoint,comp.layer('Detail switch').outPoint]}));
