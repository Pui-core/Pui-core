import production as p,json,pathlib,sys
R=p.R;T=p.TICK
def cuts():
    shots=[{'sourceFrame':745,'frames':150,'role':'new before -> normal E -> actual activation'}, {'image':True,'frames':180,'role':'explicit code explanation still background'}, {'sourceFrame':933,'frames':180,'role':'new normal walk/jump -> solid step landing'}]
    project=(R/'projects/circuit-cut.fcproj').as_posix();assert not pathlib.Path(project).exists()
    rec=p.jsrun('cut-save',project,[{'id':'file.newProject','params':{'name':'156 v08 real code and circuit'}},{'id':'file.newSequence','params':{'name':'new circuit example17','width':1440,'height':810,'fps':30,'sampleRate':48000,'video':1,'audio':1}},{'id':'file.import','params':{'paths':[p.RAW,(R/'frames/raw-01.png').as_posix()]}}],True)
    items=next(j['result']['items'] for j in p.results(rec) if 'items' in (j.get('result') or {}));cursor=0;cmds=[]
    for s in shots:
        s['timelineFrame']=cursor;params={'item':items[1 if s.get('image') else 0],'track':'V1','seconds':cursor/30,'duration':s['frames']*T//30,'video':True,'audio':False}
        if not s.get('image'):params['sourceIn']=s['sourceFrame']*T//30
        cmds.append({'id':'timeline.place','params':params});cursor+=s['frames']
    assert cursor==510
    p.jsrun('cut-place',project,cmds)
    p.native('cut-reopen',p.FC,['--project',project,'inspect'])
    p.native('cut-export',p.FC,['--project',project,'exec','file.exportMedia',json.dumps({'path':(R/'media/circuit-cut.mov').as_posix(),'format':'prores','audio':False,'hardwareEncoding':'off','gpuRendering':'off','wait':True})],timeout=180)
    (R/'qa/edit-plan.json').write_bytes((json.dumps({'fps':30,'frames':510,'shots':shots,'raw':p.RAW,'rawSha256':p.sha(p.RAW),'source':'71584a6bd0c8852885157de71032fd9252e7a04c','codeInterval':[5,11],'codeIntervalAudio':'intentionally silent; no invented typing sound'},ensure_ascii=False,indent=2)+'\n').encode('utf8'))
def picture():
    # Track the source camera using read-only world coordinates and real cloak pixels.
    import numpy as np,cv2
    rgb=R/'qa/action.rgb'
    p.native('tracking-pixels',p.FF,['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-i',p.RAW,'-vf',"select='between(n,745,1112)',scale=360:202:flags=neighbor",'-fps_mode','vfr','-pix_fmt','rgb24','-f','rawvideo',rgb.as_posix()])
    raw=np.fromfile(rgb,dtype=np.uint8).reshape(-1,202,360,3);assert len(raw)==368
    log=json.loads((R/'circuit-capture01/capture.json').read_text(encoding='utf8'));positions={t['frame']:t['position'] for t in log['trajectory']};keys=[]
    for start,end,timeline in [(745,895,0),(933,1113,330)]:
        for frame in range(start,end):
            im=raw[frame-745];rr,gg,bb=[im[:,:,c].astype(float) for c in range(3)]
            mask=((rr<110)&(gg>95)&(bb>110)&(gg>rr*1.7)).astype(np.uint8);mask[:80]=0
            count,labels,stats,centers=cv2.connectedComponentsWithStats(cv2.dilate(mask,np.ones((3,3),np.uint8)))
            candidates=[]
            for label in range(1,count):
                yy,xx=np.where((labels==label)&(mask>0))
                if len(xx)>=9:candidates.append((len(xx),float(np.median(xx)*4)))
            assert candidates,(frame,'no actual actor pixels')
            actor_x=max(candidates)[1];world_x=positions.get(frame,positions[max(k for k in positions if k<frame)])[0]
            # Circle control at1058 and target first-stone center882: midpoint970.
            # During the walk to that stone keep the actor and nearby circuit in view.
            anchor_x=actor_x+(970-world_x)*3
            anchor_x=max(300,min(1140,anchor_x));time=(timeline+frame-start)/30
            keys.append({'time':time,'sourceFrame':frame,'anchor':[anchor_x,550,0]})
    (R/'qa/tracking-keys.json').write_bytes((json.dumps(keys,indent=2)+'\n').encode())
    media=[(R/'media'/n).as_posix() for n in ['circuit-cut.mov','code-draw.png','code-collision.png','circle-before.png','circle-after.png']]
    helpers=pathlib.Path('v07/source-v07.jsx').read_text(encoding='utf8');helpers=helpers[helpers.index('function r('):helpers.index('var items=')]
    jsx="app.newProject();app.beginUndoGroup('156 v08 actual circuit and runtime code');\n"+helpers
    jsx+="var items=r('file.import',{paths:"+json.dumps(media)+",sequence:false}).items;\n"
    jsx+="var body=r('comp.new',{name:'local circuit view',width:1080,height:650,frameRate:30,duration:17,background:'#091e27'}).comp;\n"
    jsx+="var action=r('layer.addItem',{item:items[0],time:0,duration:17}).layer;s(action,'transform/anchor',[650,550,0]);s(action,'transform/position',[540,325,0]);s(action,'transform/scale',[180,180,100]);\n"
    for key in keys:jsx+="k(action,'transform/anchor',%s,%s);\n"%(key['time'],json.dumps(key['anchor']))
    jsx+="""var comp=r('comp.new',{name:'156 v08 code circuit preview17',width:1080,height:1920,frameRate:30,duration:17,background:'#091e27'}).comp;
r('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});
function imageAt(n,item,x,y,ax,ay,a,b){var l=r('layer.addItem',{item:item,time:a,duration:b-a}).layer;s(l,'transform/anchor',[ax,ay,0]);s(l,'transform/position',[x,y,0]);span(l,a,b);return l;}
var g=imageAt('actual circuit',body,540,750,540,325,0,17);
rect('code section clean',1080,1550,540,775,'#091e27',5,11);
txt('question1','その灯、どの道に',540,130,78,'#ffffff',0,5);txt('question2','つながっている？',540,235,78,'#ffffff',0,5);
txt('before action','丸印と線が、切替先を示す。',540,1250,54,'#f4bc68',0,3.8);
txt('after action','輪郭だった場所に、足場が現れた。',540,1250,48,'#f4bc68',4.1,5);
txt('code heading1','押す前から、道の輪郭。',540,180,67,'#ffffff',5,8);
imageAt('actual before crop',items[3],540,710,500,190,5,8);
txt('before disclosure','同じ新収録・操作前の実画面',540,990,34,'#9eb9b4',5,8);
imageAt('real draw code',items[1],540,1410,540,260,5,8);
txt('code heading2','見た目だけで、終わらせない。',540,180,62,'#ffffff',8,11);
imageAt('actual after crop',items[4],540,710,500,190,8,11);
txt('after disclosure','同じ新収録・操作後の実画面',540,990,34,'#9eb9b4',8,11);
imageAt('real collision code',items[2],540,1410,540,260,8,11);
txt('jump result','その足場へ、実際に跳ぶ。',540,180,68,'#ffffff',11,17);
txt('design explanation1','見た目と、渡れる判定を、',540,1260,58,'#f4bc68',13.7,17);
txt('design explanation2','同じ切替でつなぐ。',540,1360,58,'#f4bc68',13.7,17);
txt('editor disclosure','実装に基づく編集解説',540,1630,32,'#9eb9b4',0,17);
txt('brand','EMBERWAKE / 開発中の実ゲーム＋実コード',540,1810,30,'#9eb9b4',0,17);
app.endUndoGroup();writeLn(JSON.stringify({frames:510,newCaptureOnly:true,realProductCode:true,comp:comp}));
"""
    script=R/'source-circuit.jsx';script.write_bytes(jsx.encode('utf8'));project=(R/'projects/circuit-preview.ecproj').as_posix();assert not pathlib.Path(project).exists()
    p.native('ec-save',p.EC,['--empty','script',script.as_posix(),'--save-as',project,'--json'])
    p.native('ec-reopen',p.EC,['--gpu','--project',project,'info','--json'])
    p.native('ec-render',p.EC,['--gpu','--project',project,'render','--comp','156 v08 code circuit preview17','--out',(R/'media/circuit-picture.mov').as_posix(),'--format','prores','--prores','standard','--audio','off','--progress','--json'],timeout=180)
def export():
    project=(R/'projects/circuit-final.fcproj').as_posix();assert not pathlib.Path(project).exists()
    rec=p.jsrun('final-save',project,[{'id':'file.newProject','params':{'name':'156 v08 actual code preview17'}},{'id':'file.newSequence','params':{'name':'code circuit17','width':1080,'height':1920,'fps':30,'sampleRate':48000,'video':1,'audio':1}},{'id':'file.import','params':{'paths':[(R/'media/circuit-picture-v2.mov').as_posix(),p.RAW]}}],True)
    items=next(j['result']['items'] for j in p.results(rec) if 'items' in (j.get('result') or {}));cmds=[{'id':'timeline.place','params':{'item':items[0],'track':'V1','seconds':0,'duration':17*T,'video':True,'audio':False}}]
    for s in json.loads((R/'qa/edit-plan.json').read_text(encoding='utf8'))['shots']:
        if not s.get('image'):cmds.append({'id':'timeline.place','params':{'item':items[1],'track':'A1','seconds':s['timelineFrame']/30,'duration':s['frames']*T//30,'sourceIn':s['sourceFrame']*T//30,'video':False,'audio':True}})
    p.jsrun('final-place',project,cmds);p.native('final-reopen',p.FC,['--project',project,'inspect'])
    native=(R/'media/circuit-native.mp4').as_posix()
    p.native('final-export',p.FC,['--project',project,'exec','file.exportMedia',json.dumps({'path':native,'format':'h264','audio':True,'audioCodec':'aac','crf':18,'hardwareEncoding':'off','gpuRendering':'off','wait':True})],timeout=180)
    p.native('final-metadata',p.FF,['-nostdin','-hide_banner','-loglevel','error','-i',native,'-map','0','-c','copy','-metadata','title=EMBERWAKE / 丸印と道をつなぐ実装 v08 代表カット','-metadata','comment=Source71584a6bd0c8852885157de71032fd9252e7a04c 0.12.0 campaign.tscn. New normal process-input capture; no product-code/state setters. Actual game code substrings: scripts/campaign/world.gd L77 and L38; exact pin in code-pin.json. Editorial explanation, not an author quotation. Native game event sound, no VOICEVOX, added music or editorial SE. Code section intentionally silent. Preview, no publication acceptance.',(R/'videos/emberwake-v08-code-circuit-preview17.mp4').as_posix()])
if __name__=='__main__':{'cuts':cuts,'picture':picture,'export':export}[sys.argv[1]]()
