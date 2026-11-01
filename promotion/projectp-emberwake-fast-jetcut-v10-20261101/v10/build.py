import production as p,json,pathlib,sys,wave,math
R=p.R;V9=R.parent/'v09';V8=R.parent/'v08';T=p.TICK
B=json.loads((R/'qa/voice-binding.json').read_text(encoding='utf8'));N=B['wholeFrames'];D=N/30;PREVIEW=450
S=[round(c['at']*30) for c in B['cues']];S[0]=0
def graphics():
    specs=[('code-state','switch_lit.has(group)','刻印の色が参照する状態','L77内の式だけを抜粋',50),('code-collision','1 if on else 0','collision_layer の値','L38末尾だけを抜粋',68)]
    for name,code,caption,pin,size in specs:
        file=(R/f'projects/{name}.pcraft').as_posix();assert not pathlib.Path(file).exists()
        args=['run','--new',json.dumps({'width':1080,'height':520,'background':'#14333e','name':name})]
        for text,x,y,font,col in [(caption,60,100,45,'#f4bc68'),(code,60,230,size,'#ffffff'),(pin,60,370,31,'#a8c8bd'),('campaign/world.gd @71584a6 / 0.12.0',60,455,31,'#a8c8bd')]:
            args+=['--cmd','type.create','--params',json.dumps({'text':text,'x':x,'y':y,'size':font,'font':'Consolas' if text==code else 'Meiryo','color':col},ensure_ascii=False)]
        p.native(name+'-save',p.PC,args+['--out',file]);p.native(name+'-reopen',p.PC,['info',file,'--compact']);p.native(name+'-png',p.PC,['convert',file,(R/f'media/{name}.png').as_posix()])
def cuts():
    # Actual action stays at original speed; jet cuts omit waiting/walking only.
    shots=[]
    def add(a,b,source=None,still='detail-01.png',mode='network',why=''):
        assert b>a;shots.append({'at':a,'frames':b-a,'sourceFrame':source,'still':still,'mode':mode,'why':why})
    add(0,18,840,why='before E, wide')
    add(18,45,858,why='same action contiguous; E and materialization')
    add(45,135,950,why='omit idle after activation; keep actual takeoff and landing')
    add(135,S[2],mode='still',why='before question closeup')
    add(S[2],S[2]+25,mode='control',why='focus circle')
    add(S[2]+25,S[2]+52,mode='target',why='focus target outline')
    add(S[2]+52,S[3],mode='still',why='show connecting wire')
    add(S[3],S[3]+25,660,mode='wide',why='approach prior to control; replay disclosed')
    add(S[3]+25,S[4],685,mode='wide',why='contiguous approach, tighter attention text')
    add(S[4],S[5],mode='diagram',why='state to separate systems')
    add(S[5],S[6],mode='code',why='reduce code to two relevant expressions')
    add(S[6],S[6]+30,840,why='E action replay')
    add(S[6]+30,S[7],990,why='omit walking; preserve actual jump start and landing')
    add(S[7],S[7]+30,still='raw-01.png',mode='occluded',why='observed covered mark')
    add(S[7]+30,S[7]+60,mode='control',why='same place without overlap')
    add(S[7]+60,S[8],mode='comparison',why='compare, no false improvement')
    add(S[8],N,mode='comparison',why='remaining test question')
    assert shots[-1]['at']+shots[-1]['frames']==N
    project=(R/'projects/jet-cut.fcproj').as_posix();assert not pathlib.Path(project).exists()
    rec=p.jsrun('cut-save',project,[{'id':'file.newProject','params':{'name':'156 v10 jet cuts'}},{'id':'file.newSequence','params':{'name':'jet whole','width':1440,'height':810,'fps':30,'sampleRate':48000,'video':1,'audio':1}},{'id':'file.import','params':{'paths':[p.RAW,(V8/'frames/detail-01.png').as_posix(),(V8/'frames/raw-01.png').as_posix()]}}],True)
    items=next(j['result']['items'] for j in p.results(rec) if 'items' in (j.get('result') or {}));cmds=[]
    for s in shots:
        params={'item':items[0 if s['sourceFrame'] is not None else (1 if s['still']=='detail-01.png' else 2)],'track':'V1','seconds':s['at']/30,'duration':s['frames']*T//30,'video':True,'audio':False}
        if s['sourceFrame'] is not None:params['sourceIn']=s['sourceFrame']*T//30
        cmds.append({'id':'timeline.place','params':params})
    p.jsrun('cut-place',project,cmds);p.native('cut-reopen',p.FC,['--project',project,'inspect'])
    p.native('cut-export',p.FC,['--project',project,'exec','file.exportMedia',json.dumps({'path':(R/'media/jet-cut.mov').as_posix(),'format':'prores','audio':False,'hardwareEncoding':'off','gpuRendering':'off','wait':True})],timeout=180)
    (R/'qa/edit-plan.json').write_bytes((json.dumps({'frames':N,'fps':30,'seconds':D,'previewFrames':PREVIEW,'shots':shots,'voiceRate':B['newSpeed'],'relativeRate':B['relativeRate'],'oldSeconds':45.6,'removedInterCueGap':.64,'oldTextCharacters':281,'newTextCharacters':225,'raw':p.RAW,'rawSha256':p.sha(p.RAW),'globalVideoSpeedup':False},ensure_ascii=False,indent=2)+'\n').encode('utf8'))
def picture():
    import numpy as np,cv2
    rgb=R/'qa/tracking.rgb';p.native('tracking',p.FF,['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-i',p.RAW,'-vf',"select='between(n,660,1112)',scale=360:202:flags=neighbor",'-fps_mode','vfr','-pix_fmt','rgb24','-f','rawvideo',rgb.as_posix()])
    pix=np.fromfile(rgb,dtype=np.uint8).reshape(453,202,360,3);cap=json.loads((V8/'circuit-capture01/capture.json').read_text(encoding='utf8'));pos={t['frame']:t['position'] for t in cap['trajectory']};keys=[]
    shots=json.loads((R/'qa/edit-plan.json').read_text(encoding='utf8'))['shots']
    for s in shots:
        if s['sourceFrame'] is None or s['mode']=='wide':continue
        for i in range(s['frames']):
            f=s['sourceFrame']+i;im=pix[f-660];rr,gg,bb=[im[:,:,c].astype(float) for c in range(3)];mask=((rr<110)&(gg>95)&(bb>110)&(gg>rr*1.7)).astype(np.uint8);mask[:80]=0
            count,lab,stats,center=cv2.connectedComponentsWithStats(cv2.dilate(mask,np.ones((3,3),np.uint8)));cand=[]
            for j in range(1,count):
                yy,xx=np.where((lab==j)&(mask>0))
                if len(xx)>=9:cand.append((len(xx),float(np.median(xx)*4)))
            assert cand;x=max(cand)[1];wx=pos.get(f,pos[max(k for k in pos if k<f)])[0];keys.append({'frame':s['at']+i,'anchor':[max(300,min(1140,x+(970-wx)*3)),535,0]})
    (R/'qa/tracking-keys.json').write_bytes((json.dumps(keys,indent=2)+'\n').encode())
    paths=[(R/'media/jet-cut.mov').as_posix()]+[(V9/'media'/n).as_posix() for n in ['control-clear.png','target-outline.png','control-occluded.png','state-label.png']]+[(R/'media'/n).as_posix() for n in ['code-state.png','code-collision.png']]+[(V8/'media/circle-before.png').as_posix()]
    helper=(R.parent/'v07/source-v07.jsx').read_text(encoding='utf8');helper=helper[helper.index('function r('):helper.index('var items=')]
    js="app.newProject();app.beginUndoGroup('156 v10 fast voice jetcut');\n"+helper+"var items=r('file.import',{paths:"+json.dumps(paths)+",sequence:false}).items;\n"
    js+="var body=r('comp.new',{name:'network crop',width:1080,height:650,frameRate:30,duration:DUR,background:'#07151e'}).comp;var action=r('layer.addItem',{item:items[0],time:0,duration:DUR}).layer;s(action,'transform/anchor',[442,535,0]);s(action,'transform/position',[540,325,0]);s(action,'transform/scale',[165,165,100]);\n"
    for key in keys:js+="k(action,'transform/anchor',%s,%s);\n"%(key['frame']/30,json.dumps(key['anchor']))
    js+="var comp=r('comp.new',{name:'156 v10 fast narration jetcut',width:1080,height:1920,frameRate:30,duration:DUR,background:'#07151e'}).comp;r('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});\n"
    js+="""function img(item,x,y,ax,ay,a,b,scale){var l=r('layer.addItem',{item:item,time:0,duration:DUR}).layer;s(l,'transform/anchor',[ax,ay,0]);s(l,'transform/position',[x,y,0]);if(scale)s(l,'transform/scale',[scale,scale,100]);span(l,a,b);return l;}
function head(t,a,b){txt(t,t,540,215,70,'#ffffff',a,b);}function note(t,a,b){txt(t,t,540,1300,44,'#f4bc68',a,b);}
txt('brand','EMBERWAKE / 開発解説・編集修正版',540,80,30,'#9eb9b4',0,DUR);
head('押すと、どの道が変わる？',0,5.2333);img(body,540,750,540,325,0,4.5);note('右の丸印 → 足場 → 実際に着地',0,4.5);
img(items[7],540,750,500,190,4.5,T2);note('操作前へ戻って確認',4.5,T2);
head('丸印 → 線 → 足場の輪郭',T2,T3);
img(items[1],540,750,215,215,T2,T2A,155);img(items[2],540,750,215,215,T2A,T2B,155);img(items[7],540,750,500,190,T2B,T3);
note('同じ実画面を拡大',T2,T3);
head('変化を予想して、次の一歩へ。',T3,T4);img(items[0],540,750,720,405,T3,T4,75);note('切替前の接近を再掲',T3,T4);
head('同じ状態を、別の処理へ。',T4,T5);img(items[4],540,530,450,110,T4,T5);
rect('stem',4,220,540,750,'#f4bc68',T4,T5);rect('branch',720,4,540,860,'#f4bc68',T4,T5);
for(var i=0;i<3;i++){var x=180+i*360;rect('line'+i,4,170,x,945,'#f4bc68',T4,T5);rect('base'+i,300,210,x,1140,'#14333e',T4,T5);txt('label'+i,['輪郭','刻印の色','通れる判定'][i],x,1140,38,'#ffffff',T4,T5);}
note('説明図：1つの状態を別々に参照',T4,T5);
head('読むのは、この条件。',T5,T6);img(items[5],540,900,540,260,T5,TMID);img(items[6],540,900,540,260,TMID,T6);note('配線・輪郭・刻印・判定は別処理',T5,T6);
head('押して、着地まで確かめる。',T6,T7);img(body,540,750,540,325,T6,T7);note('同じ実操作を再掲／移動の間をカット',T6,T7);
head('ただ、印が重なる場面も。',T7,T8);img(items[3],540,750,215,215,T7,T7A,155);img(items[1],540,750,215,215,T7A,T7B,155);
img(items[1],290,750,215,215,T7B,DUR);img(items[3],790,750,215,215,T7B,DUR);note('初見への伝わり方は未検証',T7,T8);
head('見落としても、読み直せる？',T8,DUR);note('次の検証課題',T8,DUR);
txt('voice','仮ナレーション VOICEVOX:玄野武宏',540,1720,30,'#9eb9b4',0,DUR);txt('pin','0.12.0 / Source71584a6 / 実装に基づく編集解説',540,1810,28,'#9eb9b4',0,DUR);
app.endUndoGroup();writeLn(JSON.stringify({frames:FRAMES,relativeVoiceRate:1.30}));
"""
    repl={'DUR':D,'FRAMES':N,'T2':S[2]/30,'T2A':(S[2]+25)/30,'T2B':(S[2]+52)/30,'T3':S[3]/30,'T4':S[4]/30,'T5':S[5]/30,'T6':S[6]/30,'TMID':(S[5]+S[6])/60,'T7':S[7]/30,'T7A':(S[7]+30)/30,'T7B':(S[7]+60)/30,'T8':S[8]/30}
    for key in sorted(repl,key=len,reverse=True):js=js.replace(key,str(repl[key]))
    script=R/'source/jetcut.jsx';script.write_bytes(js.encode('utf8'));project=(R/'projects/jetcut.ecproj').as_posix();assert not pathlib.Path(project).exists()
    p.native('ec-save',p.EC,['--empty','script',script.as_posix(),'--save-as',project,'--json']);p.native('ec-reopen',p.EC,['--gpu','--project',project,'info','--json'])
    p.native('preview-picture',p.EC,['--gpu','--project',project,'render','--comp','156 v10 fast narration jetcut','--start','0','--end','15','--out',(R/'media/preview-picture.mov').as_posix(),'--format','prores','--prores','standard','--audio','off','--progress','--json'],timeout=180)
def remaining():
    p.native('remaining-picture',p.EC,['--gpu','--project',(R/'projects/jetcut.ecproj').as_posix(),'render','--comp','156 v10 fast narration jetcut','--start','15','--end',str(D),'--out',(R/'media/remaining-picture.mov').as_posix(),'--format','prores','--prores','standard','--audio','off','--progress','--json'],timeout=180)
def export(preview):
    tag='preview' if preview else 'whole';frames=PREVIEW if preview else N;voice=B['cues'][:5] if preview else B['cues'];project=(R/f'projects/{tag}-final.fcproj').as_posix();assert not pathlib.Path(project).exists()
    pictures=[(R/'media/preview-picture.mov').as_posix()]+([] if preview else [(R/'media/remaining-picture.mov').as_posix()]);paths=pictures+[c['file'] for c in voice]
    rec=p.jsrun(tag+'-save',project,[{'id':'file.newProject','params':{'name':'156 v10 '+tag}},{'id':'file.newSequence','params':{'name':tag,'width':1080,'height':1920,'fps':30,'sampleRate':48000,'video':1,'audio':1}},{'id':'file.import','params':{'paths':paths}}],True)
    items=next(j['result']['items'] for j in p.results(rec) if 'items' in (j.get('result') or {}));cmds=[{'id':'timeline.place','params':{'item':items[0],'track':'V1','seconds':0,'duration':PREVIEW*T//30,'video':True,'audio':False}}]
    if not preview:cmds.append({'id':'timeline.place','params':{'item':items[1],'track':'V1','seconds':15,'duration':(N-PREVIEW)*T//30,'video':True,'audio':False}})
    for i,c in enumerate(voice):
        with wave.open(c['file'],'rb') as w:n=w.getnframes()
        length=math.ceil(n/1600);start=round(c['at']*30);nextstart=round(voice[i+1]['at']*30) if i+1<len(voice) else frames;length=min(length,nextstart-start)
        cmds.append({'id':'timeline.place','params':{'item':items[len(pictures)+i],'track':'A1','seconds':start/30,'duration':length*T//30,'video':False,'audio':True}})
    p.jsrun(tag+'-place',project,cmds);p.native(tag+'-reopen',p.FC,['--project',project,'inspect'])
    native=(R/f'media/{tag}-native.mp4').as_posix();p.native(tag+'-export',p.FC,['--project',project,'exec','file.exportMedia',json.dumps({'path':native,'format':'h264','audio':True,'audioCodec':'aac','crf':18,'hardwareEncoding':'off','gpuRendering':'off','wait':True})],timeout=180)
    p.native(tag+'-metadata',p.FF,['-nostdin','-hide_banner','-loglevel','error','-i',native,'-map','0','-c','copy','-metadata','title=EMBERWAKE v10 fast narration jetcut '+tag,'-metadata','comment=VOICEVOX:玄野武宏. TTS speed1.326 versus prior1.02 (relative1.30). Jet cuts remove waiting/repetition, preserve words and gameplay cause/effect. No global MP4 speedup, music or editorial SE. Source71584a6 campaign0.12.0. Preview/partial until independent QA and owner acceptance.',(R/f'videos/emberwake-v10-{tag}.mp4').as_posix()])
if __name__=='__main__':{'graphics':graphics,'cuts':cuts,'picture':picture,'remaining':remaining,'preview':lambda:export(True),'whole':lambda:export(False)}[sys.argv[1]]()
