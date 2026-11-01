import production as p,json,pathlib,sys,wave,shutil
R=p.R;V8=R.parent/'v08';T=p.TICK
B=json.loads((R/'qa/voice-binding-r3.json').read_text(encoding='utf8'));N=B['recommendedFrames'];D=N/30
assert N==1368
times=[0]+[round(c['at']*30) for c in B['cues'][1:]]+[N]
def graphics():
    for name,source,crop in [('control-clear','detail-01.png',[830,480,190,190]),('target-outline','detail-01.png',[290,445,215,190]),('control-occluded','raw-01.png',[630,480,190,190])]:
        project=(R/f'projects/{name}.pcraft').as_posix();assert not pathlib.Path(project).exists()
        x,y,w,h=crop
        p.native(name+'-save',p.PC,['run',(V8/'frames'/source).as_posix(),'--cmd','image.crop','--params',json.dumps({'x':x,'y':y,'width':w,'height':h,'targetWidth':430,'targetHeight':430,'resample':'lanczos','deleteCroppedPixels':True}),'--out',project])
        p.native(name+'-reopen',p.PC,['info',project,'--compact'])
        p.native(name+'-png',p.PC,['convert',project,(R/f'media/{name}.png').as_posix()])
    project=(R/'projects/state-label.pcraft').as_posix()
    p.native('diagram-label-save',p.PC,['run','--new',json.dumps({'width':900,'height':220,'background':'#14333e','name':'Shared switch state explanation'}),'--cmd','type.create','--params',json.dumps({'text':'同じスイッチの状態','x':60,'y':85,'size':58,'font':'Meiryo','style':'Bold','color':'#f4bc68'},ensure_ascii=False),'--cmd','type.create','--params',json.dumps({'text':'switch_lit.has(group)','x':60,'y':168,'size':52,'font':'Consolas','color':'#d9f0e6'}),'--out',project])
    p.native('diagram-label-reopen',p.PC,['info',project,'--compact'])
    p.native('diagram-label-png',p.PC,['convert',project,(R/'media/state-label.png').as_posix()])
    source=V8/'code-pin.json';shutil.copy2(source,R/'source/code-pin.json')
def cuts():
    shots=[]
    def add(a,b,frame=None,still=None,role=''):
        shots.append({'timelineFrame':a,'frames':b-a,'sourceFrame':frame,'still':still,'role':role})
    add(0,times[1],840,role='phenomenon teaser')
    add(times[1],times[2],still='detail-01.png',role='before: freeze and inspect')
    add(times[2],times[3],still='detail-01.png',role='actual detail enlargements')
    add(times[3],times[4],660,role='newly used pre-control approach')
    add(times[4],times[5],still='detail-01.png',role='implementation diagram replaces picture')
    add(times[5],times[6],still='detail-01.png',role='original code explanation replaces picture')
    add(times[6],times[6]+60,840,role='same E action, explicitly revisited')
    add(times[6]+60,times[7],950,role='walk and actual landing; middle time omitted')
    add(times[7],times[8],still='raw-01.png',role='observed occlusion, freeze')
    add(times[8],N,still='detail-01.png',role='remaining question; comparison remains')
    project=(R/'projects/explainer-cut.fcproj').as_posix();assert not pathlib.Path(project).exists()
    media=[p.RAW,(V8/'frames/detail-01.png').as_posix(),(V8/'frames/raw-01.png').as_posix()]
    rec=p.jsrun('cut-save',project,[{'id':'file.newProject','params':{'name':'156 v09 narration-first explainer'}},{'id':'file.newSequence','params':{'name':'explainer45','width':1440,'height':810,'fps':30,'sampleRate':48000,'video':1,'audio':1}},{'id':'file.import','params':{'paths':media}}],True)
    items=next(j['result']['items'] for j in p.results(rec) if 'items' in (j.get('result') or {}));cmds=[]
    for shot in shots:
        item=items[0] if shot['sourceFrame'] is not None else items[1 if shot['still']=='detail-01.png' else 2]
        params={'item':item,'track':'V1','seconds':shot['timelineFrame']/30,'duration':shot['frames']*T//30,'video':True,'audio':False}
        if shot['sourceFrame'] is not None:params['sourceIn']=shot['sourceFrame']*T//30
        cmds.append({'id':'timeline.place','params':params})
    p.jsrun('cut-place',project,cmds);p.native('cut-reopen',p.FC,['--project',project,'inspect'])
    p.native('cut-export',p.FC,['--project',project,'exec','file.exportMedia',json.dumps({'path':(R/'media/explainer-cut.mov').as_posix(),'format':'prores','audio':False,'hardwareEncoding':'off','gpuRendering':'off','wait':True})],timeout=180)
    (R/'qa/edit-plan.json').write_bytes((json.dumps({'frames':N,'fps':30,'duration':D,'shots':shots,'raw':p.RAW,'rawSha256':p.sha(p.RAW),'narrationBinding':'voice-binding.json','oldMP4Stretched':False,'frozenEnlargementAndReplayDisclosed':True},ensure_ascii=False,indent=2)+'\n').encode('utf8'))
def picture():
    import numpy as np,cv2
    rgb=R/'qa/tracking.rgb'
    p.native('tracking-decode',p.FF,['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-i',p.RAW,'-vf',"select='between(n,660,1112)',scale=360:202:flags=neighbor",'-fps_mode','vfr','-pix_fmt','rgb24','-f','rawvideo',rgb.as_posix()])
    pixels=np.fromfile(rgb,dtype=np.uint8).reshape(453,202,360,3)
    cap=json.loads((V8/'circuit-capture01/capture.json').read_text(encoding='utf8'));pos={s['frame']:s['position'] for s in cap['trajectory']}
    plan=json.loads((R/'qa/edit-plan.json').read_text(encoding='utf8'));keys=[]
    for shot in plan['shots']:
        if shot['sourceFrame'] is None or shot['role']=='newly used pre-control approach':continue
        for i in range(shot['frames']):
            f=shot['sourceFrame']+i;im=pixels[f-660];rr,gg,bb=[im[:,:,c].astype(float) for c in range(3)];mask=((rr<110)&(gg>95)&(bb>110)&(gg>rr*1.7)).astype(np.uint8);mask[:80]=0
            count,labels,stats,centers=cv2.connectedComponentsWithStats(cv2.dilate(mask,np.ones((3,3),np.uint8)));cand=[]
            for label in range(1,count):
                yy,xx=np.where((labels==label)&(mask>0))
                if len(xx)>=9:cand.append((len(xx),float(np.median(xx)*4)))
            assert cand
            x=max(cand)[1];wx=pos.get(f,pos[max(k for k in pos if k<f)])[0];ax=max(300,min(1140,x+(970-wx)*3));keys.append({'frame':shot['timelineFrame']+i,'anchor':[ax,535,0]})
    (R/'qa/actual-tracking-keys.json').write_bytes((json.dumps(keys,indent=2)+'\n').encode())
    paths=[(R/'media/explainer-cut.mov').as_posix(),(R/'media/control-clear.png').as_posix(),(R/'media/target-outline.png').as_posix(),(R/'media/control-occluded.png').as_posix(),(R/'media/state-label.png').as_posix(),(V8/'media/code-draw-v2.png').as_posix(),(V8/'media/code-collision.png').as_posix(),(V8/'media/circle-before.png').as_posix()]
    helpers=(R.parent/'v07/source-v07.jsx').read_text(encoding='utf8');helpers=helpers[helpers.index('function r('):helpers.index('var items=')]
    js="app.newProject();app.beginUndoGroup('156 v09 narrated development explanation');\n"+helpers
    js+="var items=r('file.import',{paths:"+json.dumps(paths)+",sequence:false}).items;\n"
    js+="var body=r('comp.new',{name:'actual circuit crop',width:1080,height:650,frameRate:30,duration:DUR,background:'#07151e'}).comp;var moving=r('layer.addItem',{item:items[0],time:0,duration:DUR}).layer;s(moving,'transform/anchor',[442,535,0]);s(moving,'transform/position',[540,325,0]);s(moving,'transform/scale',[165,165,100]);\n".replace('DUR',str(D))
    for key in keys:js+="k(moving,'transform/anchor',%s,%s);\n"%(key['frame']/30,json.dumps(key['anchor']))
    js+="var comp=r('comp.new',{name:'156 v09 narrated explanation',width:1080,height:1920,frameRate:30,duration:DUR,background:'#07151e'}).comp;r('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});\n".replace('DUR',str(D))
    js+="""function img(n,item,x,y,ax,ay,a,b,scale){var l=r('layer.addItem',{item:item,time:0,duration:DUR}).layer;s(l,'transform/anchor',[ax,ay,0]);s(l,'transform/position',[x,y,0]);if(scale)s(l,'transform/scale',[scale,scale,100]);span(l,a,b);return l;}
function head(n,text,a,b){txt(n,text,540,235,68,'#ffffff',a,b);}
function note(n,text,a,b){txt(n,text,540,1260,43,'#f4bc68',a,b);}
txt('series','EMBERWAKE  /  開発解説・冒頭稿',540,90,32,'#9eb9b4',0,DUR);
img('teaser',body,540,750,540,325,0,T1);
head('initial question','押すと、どの道が変わる？',0,T1);note('direction','右の丸印 → 左の輪郭',0,T1);
img('before full still',items[7],540,720,500,190,T1,T2);
head('first-view question','初めてなら、どこを見る？',T1,T2);note('freeze note','切替前の実画面を止めて確認',T1,T2);
txt('not a keyword list','操作対象と、変わる場所を探す。',540,1450,48,'#ffffff',T1,T2);
head('clue','線と丸印を、手掛かりにする。',T2,T3);
img('control closeup',items[1],290,760,215,215,T2,T3);img('target closeup',items[2],790,760,215,215,T2,T3);
txt('control label','操作する丸印',290,1100,42,'#f4bc68',T2,T3);txt('target label','対象の足場',790,1100,42,'#f4bc68',T2,T3);
note('not invented UI','同じ実画面の別部分を拡大',T2,T3);
head('choice','変化を予想して、次の一歩へ。',T3,T4);
img('original approach',items[0],540,750,720,405,T3,T4,75);
note('return before operation','切替前へ戻って、接近の実プレイ',T3,T4);
head('state diagram title','状態を共有し、処理を分ける。',T4,T5);
img('state literal',items[4],540,560,450,110,T4,T5);
rect('diagram stem',4,220,540,780,'#f4bc68',T4,T5);rect('diagram branch',720,4,540,890,'#f4bc68',T4,T5);
for(var i=0;i<3;i++){var x=180+360*i;rect('branch'+i,4,160,x,970,'#f4bc68',T4,T5);rect('box'+i,300,200,x,1160,'#14333e',T4,T5);txt('box label'+i,['輪郭','刻印の色','通れる判定'][i],x,1160,38,'#ffffff',T4,T5);}
txt('diagram disclosure','実装の説明図：同じ状態を別々に参照',540,1450,40,'#f4bc68',T4,T5);
head('real source','表示と判定は、別の行で切替。',T5,T6);
img('rune color source',items[5],540,680,540,260,T5,T6);img('collision source',items[6],540,1280,540,260,T5,T6);
head('actual action again','実際に押して、渡ってみる。',T6,T7);
img('same action revisit',body,540,750,540,325,T6,T7);note('replay disclosure','同じ実操作を再掲／移動の間をカット',T6,T7);
head('remaining uncertainty','印が隠れる場面も、残っている。',T7,T8);
img('occlusion',items[3],540,780,215,215,T7,T8,160);note('observed issue','旅人と操作側の印が重なる実例',T7,T8);
txt('not playtested claim','初見に伝わるかは、未検証。',540,1460,50,'#ffffff',T7,T8);
head('next test','見落としても、読み直せる？',T8,DUR);
img('clear comparison',items[1],290,780,215,215,T8,DUR);img('blocked comparison',items[3],790,780,215,215,T8,DUR);
note('future scope','次の検証課題。改善済みとはしていません。',T8,DUR);
txt('credit','仮ナレーション：VOICEVOX:玄野武宏',540,1720,31,'#9eb9b4',0,DUR);
txt('source credit','0.12.0 / Source71584a6 / 実装に基づく編集解説',540,1810,28,'#9eb9b4',0,DUR);
"""
    for i,f in reversed(list(enumerate(times[1:-1],1))):js=js.replace('T'+str(i),str(f/30))
    js=js.replace('DUR',str(D));js+="app.endUndoGroup();writeLn(JSON.stringify({frames:"+str(N)+",narrationFirst:true}));\n"
    script=R/'source/explainer.jsx';script.write_bytes(js.encode('utf8'));project=(R/'projects/explainer.ecproj').as_posix();assert not pathlib.Path(project).exists()
    p.native('ec-save',p.EC,['--empty','script',script.as_posix(),'--save-as',project,'--json']);p.native('ec-reopen',p.EC,['--gpu','--project',project,'info','--json'])
    p.native('ec-render',p.EC,['--gpu','--project',project,'render','--comp','156 v09 narrated explanation','--out',(R/'media/explainer-picture.mov').as_posix(),'--format','prores','--prores','standard','--audio','off','--progress','--json'],timeout=240)
def export():
    project=(R/'projects/explainer-final-r2.fcproj').as_posix();assert not pathlib.Path(project).exists()
    paths=[(R/'media/explainer-picture.mov').as_posix()]+[c['file'] for c in B['cues']]
    rec=p.jsrun('final-r2-save',project,[{'id':'file.newProject','params':{'name':'156 v09 narrated development introduction'}},{'id':'file.newSequence','params':{'name':'v09 intro45','width':1080,'height':1920,'fps':30,'sampleRate':48000,'video':1,'audio':1}},{'id':'file.import','params':{'paths':paths}}],True)
    items=next(j['result']['items'] for j in p.results(rec) if 'items' in (j.get('result') or {}));cmds=[{'id':'timeline.place','params':{'item':items[0],'track':'V1','seconds':0,'duration':N*T//30,'video':True,'audio':False}}]
    for i,c in enumerate(B['cues']):
        with wave.open(c['file'],'rb') as w:duration=w.getnframes()*T//48000
        cmds.append({'id':'timeline.place','params':{'item':items[i+1],'track':'A1','seconds':c['at'],'duration':duration,'sourceIn':0,'video':False,'audio':True}})
    p.jsrun('final-r2-place',project,cmds);p.native('final-r2-reopen',p.FC,['--project',project,'inspect'])
    native=(R/'media/explainer-native-r2.mp4').as_posix()
    p.native('final-r2-export',p.FC,['--project',project,'exec','file.exportMedia',json.dumps({'path':native,'format':'h264','audio':True,'audioCodec':'aac','crf':18,'hardwareEncoding':'off','gpuRendering':'off','wait':True})],timeout=240)
    p.native('final-r2-metadata',p.FF,['-nostdin','-hide_banner','-loglevel','error','-i',native,'-map','0','-c','copy','-metadata','title=EMBERWAKE 開発解説：どの道が変わるかを、押す前に / v09 冒頭稿','-metadata','comment=Temporary narration VOICEVOX:玄野武宏 (speaker11). No owner/Hytacka voice imitation; no music, game audio or editorial SE. Original 0.12.0 Source71584a6 campaign.tscn recording and real bounded product-code excerpts. Annotated freezes, implementation diagram and explicit replay. Editorial explanation, not invented author history. 45.6-second opening preview; not full long-form or publication acceptance.',(R/'videos/emberwake-v09-narrated-intro45-r2.mp4').as_posix()])
if __name__=='__main__':{'graphics':graphics,'cuts':cuts,'picture':picture,'export':export}[sys.argv[1]]()
