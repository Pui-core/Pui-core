import sys, pathlib, json, hashlib, contextlib, io
sys.path.insert(0,str(pathlib.Path(__file__).parent.parent))
from run import run
R=pathlib.Path(__file__).parent
EC='C:/Program Files/EffectCraft/effectcraft-cli.exe'
FC='C:/Program Files/FilmCraft/filmcraft-cli.exe'
PC='C:/Program Files/PhotoCraft/photocraft-cli.exe'
FF='C:/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe'
FP='C:/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe'
RAW=(R/'episode2-capture01/capture.avi').as_posix()
TICK=254016000000
def native(tag,exe,args,input=None,timeout=180):
    with contextlib.redirect_stdout(io.StringIO()):
        p=run('v07-'+tag,[exe]+args,timeout,input)
    print(json.dumps({'nativeStep':tag,'code':p['code'],'seconds':round(p['elapsed'],2)}),flush=True)
    (R/'qa'/f'{tag}.json').write_bytes((json.dumps(p,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
    return p
def jsrun(tag,project,commands,new=False):
    args=(['--save-as',project] if new else ['--project',project,'--save'])+['run','-']
    return native(tag,FC,args,'\n'.join(json.dumps(c,ensure_ascii=False) for c in commands)+'\n')
def results(rec):return [json.loads(l) for l in rec['stdout'].splitlines() if l.strip()]
def sha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()

def extract():
    native('raw-frames-ok',FF,['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-i',RAW,'-vf',"select='eq(n,90)+eq(n,739)+eq(n,810)+eq(n,850)+eq(n,862)+eq(n,949)+eq(n,1060)'",'-fps_mode','vfr',(R/'frames/raw-%02d.png').as_posix()])

def cuts():
    # Native FilmCraft makes all moving-picture edits at original speed.
    shots=[{'name':'checkpoint-fall-return','sourceFrame':739,'frames':210},
           {'name':'pause-rule','sourceFrame':949,'frames':60},
           {'name':'memory-before','sourceFrame':60,'frames':60},
           {'name':'memory-after','sourceFrame':1049,'frames':90},
           {'name':'result-still','image':True,'frames':60}]
    p=(R/'projects/v07-cut.fcproj').as_posix()
    if pathlib.Path(p).exists():
        rec=json.loads((R/'qa/cut-save.json').read_text(encoding='utf8'))
        native('cut-empty-resume-inspect',FC,['--project',p,'inspect'])
    else:
        rec=jsrun('cut-save',p,[{'id':'file.newProject','params':{'name':'156 v07 new checkpoint capture'}},{'id':'file.newSequence','params':{'name':'new-fall-preview16','width':1440,'height':810,'fps':30,'sampleRate':48000,'video':1,'audio':1}},{'id':'file.import','params':{'paths':[RAW,(R/'frames/raw-05.png').as_posix()]}}],True)
    imports=next(j['result']['items'] for j in results(rec) if 'items' in (j.get('result') or {}))
    cmds=[];cursor=0
    for shot in shots:
        shot['timelineFrame']=cursor
        params={'item':imports[1 if shot.get('image') else 0],'track':'V1','seconds':cursor/30,'duration':shot['frames']*TICK//30,'video':True,'audio':not shot.get('image',False)}
        if not shot.get('image'):params['sourceIn']=shot['sourceFrame']*TICK//30
        cmds.append({'id':'timeline.place','params':params});cursor+=shot['frames']
    assert cursor==480
    jsrun('cut-place',p,cmds)
    native('cut-reopen',FC,['--project',p,'inspect'])
    native('cut-export',FC,['--project',p,'exec','file.exportMedia',json.dumps({'path':(R/'media/v07-cut.mov').as_posix(),'format':'prores','audio':False,'hardwareEncoding':'off','gpuRendering':'off','wait':True})],timeout=240)
    (R/'qa/edit-plan.json').write_bytes((json.dumps({'frames':cursor,'fps':30,'shots':shots,'raw':RAW,'rawSha256':sha(RAW),'sourceCommit':'71584a6bd0c8852885157de71032fd9252e7a04c','rawActualDimensions':[1440,810],'harnessConfiguredDimensions':[960,540],'note':'MovieWriter uses project window override dimensions; actual stream metadata controls all edits. Capture callback count1139 vs native movie1140: event frame labels are observational, verify pixel boundaries.'},ensure_ascii=False,indent=2)+'\n').encode('utf8'))

def graphics():
    p=(R/'projects/v07-heading.pcraft').as_posix()
    args=['run','--new',json.dumps({'width':1080,'height':330,'background':'#eee8dc','name':'v07 new question'}),
          '--cmd','type.create','--params',json.dumps({'text':'落ちたら、','x':70,'y':120,'size':78,'font':'Meiryo','style':'Bold','weight':700,'color':'#173f47','name':'question first line'},ensure_ascii=False),
          '--cmd','type.create','--params',json.dumps({'text':'思い出も消える？','x':70,'y':230,'size':78,'font':'Meiryo','style':'Bold','weight':700,'color':'#173f47','name':'question second line'},ensure_ascii=False),'--out',p]
    native('heading-save',PC,args)
    native('heading-reopen',PC,['info',p,'--compact'])
    native('heading-render',PC,['convert',p,(R/'media/v07-heading.png').as_posix()])
    for name,source in [('before','raw-01.png'),('after','raw-07.png')]:
        out=(R/f'projects/v07-memory-{name}.pcraft').as_posix()
        native('memory-'+name+'-save',PC,['run',(R/'frames'/source).as_posix(),'--cmd','image.crop','--params',json.dumps({'x':65,'y':765,'width':235,'height':40,'targetWidth':940,'targetHeight':160,'resample':'lanczos','deleteCroppedPixels':True}),'--out',out])
        native('memory-'+name+'-reopen',PC,['info',out,'--compact'])
        native('memory-'+name+'-render',PC,['convert',out,(R/f'media/v07-memory-{name}.png').as_posix()])

def picture():
    media=[(R/'media/v07-cut.mov').as_posix(),(R/'media/v07-heading.png').as_posix(),(R/'media/v07-memory-before.png').as_posix(),(R/'media/v07-memory-after.png').as_posix()]
    jsx="""app.newProject();app.beginUndoGroup('156 new design preview');
function r(i,p){return app.run(i,p||{});}function s(l,p,v){r('prop.set',{layer:l,path:p,value:v});}function k(l,p,t,v){r('prop.addKey',{layer:l,path:p,time:t,timeBase:'comp',value:v});}function span(l,a,b){r('layer.timing',{layers:[l],in:a,out:b});}
function rect(n,w,h,x,y,c,a,b){var l=r('layer.newShape',{name:n,kind:'rect',size:[w,h],position:[x,y],fill:c,strokeWidth:0}).layer;span(l,a,b);return l;}
function txt(n,v,x,y,z,c,a,b){var l=r('layer.newText',{name:n,text:v,font:'Meiryo',style:'Bold',size:z,fill:c,position:[x,y],justify:'center'}).layer;var q=app.project.activeItem.layer(n).sourceRectAtTime(a,false);if(q.width>940){z=Math.floor(z*940/q.width);r('layer.setText',{layer:l,size:z});q=app.project.activeItem.layer(n).sourceRectAtTime(a,false);}s(l,'transform/anchor',[q.left+q.width/2,q.top+q.height/2,0]);s(l,'transform/position',[x,y,0]);span(l,a,b);return l;}
var items=r('file.import',{paths:MEDIA,sequence:false}).items;
var body=r('comp.new',{name:'new episode2 viewport crop',width:1080,height:1170,frameRate:30,duration:16,background:'#0a202a'}).comp;
var action=r('layer.addItem',{item:items[0],time:0,duration:16}).layer;span(action,0,7);s(action,'transform/anchor',[800,555,0]);s(action,'transform/position',[540,585,0]);s(action,'transform/scale',[230,230,100]);
var pause=r('layer.addItem',{item:items[0],time:0,duration:16}).layer;span(pause,7,9);s(pause,'transform/anchor',[720,405,0]);s(pause,'transform/position',[540,585,0]);s(pause,'transform/scale',[75,75,100]);
var comp=r('comp.new',{name:'156 v07 new checkpoint preview16',width:1080,height:1920,frameRate:30,duration:16,background:'#eee8dc'}).comp;
r('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});
var game=r('layer.addItem',{item:body,time:0,duration:16}).layer;s(game,'transform/anchor',[540,585,0]);s(game,'transform/position',[540,950,0]);span(game,0,9);
var title=r('layer.addItem',{item:items[1],time:0,duration:7}).layer;s(title,'transform/anchor',[540,165,0]);s(title,'transform/position',[540,165,0]);
txt('action setup','この中継点の先で、落下。',540,1640,52,'#173f47',0,4.2);
txt('actual return','同じ中継点へ、戻った。',540,1640,52,'#173f47',5.3,7);
rect('result header clean',1080,330,540,165,'#eee8dc',7,9);txt('result line1','戻るのは、',540,115,84,'#173f47',7,9);txt('result line2','今の中継点。',540,225,84,'#173f47',7,9);
txt('pause context','落下後に開いた、実ゲームの表示',540,1600,38,'#173f47',7,9);
rect('comparison surface',1080,1535,540,767.5,'#eee8dc',9,16);
txt('comparison heading1','失った記憶は、',540,140,76,'#173f47',9,16);txt('comparison heading2','増えていない。',540,245,76,'#173f47',11,16);
txt('before label','落下する前',540,510,48,'#567375',9,16);
var before=r('layer.addItem',{item:items[2],time:9,duration:7}).layer;s(before,'transform/anchor',[470,80,0]);s(before,'transform/position',[540,680,0]);k(before,'transform/opacity',9,0);k(before,'transform/opacity',9.1,100);
txt('after label','落下した後',540,960,48,'#567375',11,16);
var after=r('layer.addItem',{item:items[3],time:11,duration:5}).layer;s(after,'transform/anchor',[470,80,0]);s(after,'transform/position',[540,1130,0]);k(after,'transform/opacity',11,0);k(after,'transform/opacity',11.1,100);
txt('comparison conditions','第2話・物語モード／クリアせず比較',540,1450,36,'#567375',11,16);
txt('result statement','落下は、中継点からやり直せる。',540,1640,46,'#173f47',14,16);
txt('brand','EMBERWAKE / 開発中の実ゲーム',540,1825,30,'#567375',0,16);
app.endUndoGroup();writeLn(JSON.stringify({frames:480,newCaptureOnly:true,bodyComp:body,comp:comp}));
""".replace('MEDIA',json.dumps(media,ensure_ascii=False))
    script=R/'source-v07.jsx';script.write_bytes(jsx.encode('utf8'))
    p=(R/'projects/v07-preview.ecproj').as_posix()
    native('ec-save',EC,['--empty','script',script.as_posix(),'--save-as',p,'--json'])
    native('ec-reopen',EC,['--gpu','--project',p,'info','--json'])
    native('ec-frame-0',EC,['--gpu','--project',p,'render-frame','--comp','156 v07 new checkpoint preview16','--frame','30','--out',(R/'qa/native-frame-1.png').as_posix(),'--json'])
    native('ec-render',EC,['--gpu','--project',p,'render','--comp','156 v07 new checkpoint preview16','--out',(R/'media/v07-picture.mov').as_posix(),'--format','prores','--prores','standard','--audio','off','--progress','--json'],timeout=180)

def export():
    p=(R/'projects/v07-final.fcproj').as_posix()
    rec=jsrun('final-save',p,[{'id':'file.newProject','params':{'name':'156 v07 new design representative cut'}},{'id':'file.newSequence','params':{'name':'v07 preview16','width':1080,'height':1920,'fps':30,'sampleRate':48000,'video':1,'audio':1}},{'id':'file.import','params':{'paths':[(R/'media/v07-picture.mov').as_posix(),RAW]}}],True)
    imports=next(j['result']['items'] for j in results(rec) if 'items' in (j.get('result') or {}))
    cmds=[{'id':'timeline.place','params':{'item':imports[0],'track':'V1','seconds':0,'duration':16*TICK,'video':True,'audio':False}}]
    plan=json.loads((R/'qa/edit-plan.json').read_text(encoding='utf8'))
    for shot in plan['shots']:
        if not shot.get('image'):
            cmds.append({'id':'timeline.place','params':{'item':imports[1],'track':'A1','seconds':shot['timelineFrame']/30,'sourceIn':shot['sourceFrame']*TICK//30,'duration':shot['frames']*TICK//30,'video':False,'audio':True}})
    jsrun('final-place',p,cmds)
    native('final-reopen',FC,['--project',p,'inspect'])
    raw=(R/'media/v07-native-final.mp4').as_posix()
    native('final-export',FC,['--project',p,'exec','file.exportMedia',json.dumps({'path':raw,'format':'h264','audio':True,'audioCodec':'aac','crf':18,'hardwareEncoding':'off','gpuRendering':'off','wait':True})],timeout=240)
    native('final-metadata',FF,['-nostdin','-hide_banner','-loglevel','error','-i',raw,'-map','0','-c','copy','-metadata','title=落ちたら、思い出も消える？ / EMBERWAKE v07 代表カット','-metadata','comment=New episode2 practice capture, Source 71584a6bd0c8852885157de71032fd9252e7a04c, Godot 4.6.3. Ordinary process-local input automation; no game-code changes or product-state setters. One fall after second checkpoint, return, no clear, memory1/15 before/after. Native MovieWriter game audio; no narration or added BGM. Editorial crops and comparison cards. Preview only, not publication acceptance.',(R/'videos/emberwake-v07-checkpoint-preview16.mp4').as_posix()])

if __name__=='__main__':
    {'extract':extract,'cuts':cuts,'graphics':graphics,'picture':picture,'export':export}[sys.argv[1]]()
