import production as p, pathlib,json,sys,math,wave
R=p.R;OLD=R.parent;T=p.TICK
B=json.loads((R/'qa/voice-binding.json').read_text(encoding='utf8'));O=json.loads((OLD/'qa/voice-binding.json').read_text(encoding='utf8'))
S=[round(c['at']*30) for c in B['cues']];S[0]=0;OS=[round(c['at']*30) for c in O['cues']];OS[0]=0;N=B['wholeFrames'];CTA=S[9];CN=N-CTA
def graphics():
 f=(R/'projects/campfire.pcraft').as_posix();assert not pathlib.Path(f).exists()
 args=['run','--new',json.dumps({'width':1080,'height':1080,'background':'#14333e','name':'CAMPFIRE制作支援案内'})]
 for text,x,y,size,col in [('CAMPFIRE',90,180,104,'#f4bc68'),('制作支援を募集中',90,330,76,'#ffffff'),('EMBERWAKE',90,535,92,'#ffffff'),('灰の灯',90,625,58,'#a8c8bd'),('支援はプロフィールの',90,795,58,'#ffffff'),('リンクから',90,895,58,'#ffffff')]:
  args+=['--cmd','type.create','--params',json.dumps({'text':text,'x':x,'y':y,'size':size,'font':'Meiryo','color':col},ensure_ascii=False)]
 p.native('cta-save',p.PC,args+['--out',f]);p.native('cta-reopen',p.PC,['info',f,'--compact']);p.native('cta-png',p.PC,['convert',f,(R/'media/campfire.png').as_posix()])
 # A new native motion source for the added scene, with a fast entrance and readable hold.
 helper=(R.parents[1]/'v07/source-v07.jsx').read_text(encoding='utf8');helper=helper[helper.index('function r('):helper.index('var items=')]
 js="app.newProject();app.beginUndoGroup('156 v10 r3 CAMPFIRE');\n"+helper
 js+="var item=r('file.import',{paths:"+json.dumps([(R/'media/campfire.png').as_posix()])+",sequence:false}).items[0];var comp=r('comp.new',{name:'CAMPFIRE v10 r3',width:1080,height:1920,frameRate:30,duration:"+str(CN/30)+",background:'#07151e'}).comp;var l=r('layer.addItem',{item:item,time:0,duration:"+str(CN/30)+"}).layer;s(l,'transform/anchor',[540,540,0]);s(l,'transform/position',[540,900,0]);k(l,'transform/position',0,[540,960,0]);k(l,'transform/position',0.1333333333,[540,900,0]);"
 js+="txt('brand','EMBERWAKE / 制作支援のご案内',540,130,48,'#ffffff',0,"+str(CN/30)+");txt('voice','仮ナレーション VOICEVOX:玄野武宏',540,1720,30,'#9eb9b4',0,"+str(CN/30)+");app.endUndoGroup();"
 script=R/'source/campfire.jsx';script.write_bytes(js.encode('utf8'));project=(R/'projects/campfire.ecproj').as_posix()
 p.native('cta-ec-save',p.EC,['--empty','script',script.as_posix(),'--save-as',project,'--json']);p.native('cta-ec-reopen',p.EC,['--gpu','--project',project,'info','--json'])
 p.native('cta-render',p.EC,['--gpu','--project',project,'render','--comp','CAMPFIRE v10 r3','--start','0','--end',str(CN/30),'--out',(R/'media/campfire.mov').as_posix(),'--format','prores','--prores','standard','--audio','off','--progress','--json'],timeout=90)
def assemble():
 # Reuse already rendered silent v10 pictures at their original frame rate. Extra reading time is a native still hold, never slowed gameplay.
 plan=json.loads((R.parent/'r2/qa/reuse-edit-plan.json').read_text(encoding='utf8'));segments=plan['segments'];oldpics=plan['originalPictures'];assert CTA==plan['ctaStartFrame']
 project=(R/'projects/fast12-profile.fcproj').as_posix();assert not pathlib.Path(project).exists()
 paths=oldpics+[(R/'media/campfire.mov').as_posix()]+[s['hold'] for s in segments]+[c['file'] for c in B['cues']]
 rec=p.jsrun('final-save',project,[{'id':'file.newProject','params':{'name':'156 v10 r3 1.20 CAMPFIRE'}},{'id':'file.newSequence','params':{'name':'v10 r3','width':1080,'height':1920,'fps':30,'sampleRate':48000,'video':1,'audio':1}},{'id':'file.import','params':{'paths':paths}}],True)
 items=next(j['result']['items'] for j in p.results(rec) if 'items' in (j.get('result') or {}));cmds=[]
 for i,s in enumerate(segments):
  cmds.append({'id':'timeline.place','params':{'item':items[s['picture']],'track':'V1','seconds':s['at']/30,'sourceIn':s['sourceInFrame']*T//30,'duration':s['frames']*T//30,'video':True,'audio':False}})
  if s['holdFrames']:cmds.append({'id':'timeline.place','params':{'item':items[3+i],'track':'V1','seconds':(s['at']+s['frames'])/30,'duration':s['holdFrames']*T//30,'video':True,'audio':False}})
 cmds.append({'id':'timeline.place','params':{'item':items[2],'track':'V1','seconds':CTA/30,'duration':CN*T//30,'video':True,'audio':False}})
 for i,c in enumerate(B['cues']):
  with wave.open(c['file'],'rb') as w:n=w.getnframes()
  length=math.ceil(n/1600);start=round(c['at']*30);end=round(B['cues'][i+1]['at']*30) if i+1<len(B['cues']) else N
  cmds.append({'id':'timeline.place','params':{'item':items[3+len(segments)+i],'track':'A1','seconds':start/30,'duration':min(length,end-start)*T//30,'video':False,'audio':True}})
 p.jsrun('final-place',project,cmds);p.native('final-reopen',p.FC,['--project',project,'inspect'])
 native=(R/'media/final-native.mp4').as_posix();p.native('final-export',p.FC,['--project',project,'exec','file.exportMedia',json.dumps({'path':native,'format':'h264','audio':True,'audioCodec':'aac','crf':18,'hardwareEncoding':'off','gpuRendering':'off','wait':True})],timeout=180)
 p.native('final-metadata',p.FF,['-nostdin','-hide_banner','-loglevel','error','-i',native,'-map','0','-c','copy','-metadata','title=EMBERWAKE v10 r3 narration1.20 CAMPFIRE','-metadata','comment=VOICEVOX:玄野武宏. speedScale1.224 versus v09 1.02, relative1.20. Jet cuts preserve action and words. No music or SE. CAMPFIRE https://camp-fire.jp/projects/993744/view . Private preview. Root must verify actual profile link reaches project993744 before publication; not asserted configured. Subjective listening/mobile/acceptance pending.',(R/'videos/emberwake-v10-r3-fast12-profile.mp4').as_posix()])
 (R/'qa/reuse-edit-plan.json').write_bytes((json.dumps({'frames':N,'fps':30,'ctaStartFrame':CTA,'ctaFrames':CN,'segments':segments,'originalPictures':oldpics,'globalVideoSpeedup':False,'reusedExistingPicture':True,'omittedHeadingGapFrame':157,'relativeVoiceRate':1.2,'speedScale':1.224},ensure_ascii=False,indent=2)+'\n').encode('utf8'))
if __name__=='__main__':{'graphics':graphics,'assemble':assemble}[sys.argv[1]]()
