import production as p,json,pathlib,numpy as np
R=p.R;final=(R/'videos/emberwake-v08-code-circuit-preview17.mp4').as_posix()
j=json.loads(p.native('final-probe',p.FP,['-v','error','-show_streams','-show_format','-of','json',final])['stdout'])
v=next(s for s in j['streams'] if s['codec_type']=='video');a=next(s for s in j['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'],v['r_frame_rate'],v['codec_name'],int(v['nb_frames']))==(1080,1920,'30/1','h264',510)
assert a['codec_name']=='aac' and a['channels']==2 and abs(float(j['format']['duration'])-17)<.1
d=p.native('final-full-av-decode',p.FF,['-nostdin','-hide_banner','-loglevel','error','-xerror','-threads','2','-i',final,'-map','0:v:0','-map','0:a:0','-f','null','-']);assert not d['stderr'].strip()
for tag,filters in [('whole-sheet','fps=1,scale=270:480,tile=6x3:padding=4:margin=4'),('activation-continuous',"select='between(n,105,134)',scale=216:384,tile=10x3:padding=2:margin=2"),('landing-continuous',"select='between(n,400,429)',scale=216:384,tile=10x3:padding=2:margin=2"),('small-screen',"select='eq(n,30)+eq(n,195)+eq(n,285)+eq(n,450)',scale=320:568,tile=4x1:padding=4:margin=4")]:
    p.native(tag,p.FF,['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-i',final,'-vf',filters,'-frames:v','1',(R/f'qa/{tag}.png').as_posix()])
for f,n in [(p.RAW,'raw'),(final,'final')]:p.native(n+'-audio',p.FF,['-nostdin','-hide_banner','-loglevel','error','-threads','2','-i',f,'-map','0:a:0','-ar','48000','-ac','2','-f','f32le',(R/f'qa/{n}.f32').as_posix()])
raw=np.fromfile(R/'qa/raw.f32',dtype='<f4').reshape(-1,2);actual=np.fromfile(R/'qa/final.f32',dtype='<f4').reshape(-1,2);expected=np.zeros((17*48000,2),np.float32)
for s in json.loads((R/'qa/edit-plan.json').read_text(encoding='utf8'))['shots']:
    if s.get('image'):continue
    at=s['timelineFrame']*1600;start=s['sourceFrame']*1600;n=s['frames']*1600;expected[at:at+n]=raw[start:start+n]
channels=[]
for c in range(2):
    aa=expected[48000:5*48000:16,c].astype(float)
    def metric(lag):
        bb=actual[48000+lag:5*48000+lag:16,c].astype(float);return float(np.dot(aa,bb)/np.sqrt(np.dot(aa,aa)*np.dot(bb,bb)))
    lag=max(range(-2048,2049,32),key=metric);lag=max(range(lag-31,lag+32),key=metric);corr=metric(lag)
    assert abs(lag)<=2 and corr>.96
    channels.append({'channel':'LR'[c],'lagSamples':lag,'correlation':corr})
assert np.isfinite(actual).all() and np.max(np.abs(actual))<.999
capture=json.loads((R/'circuit-capture01/capture.json').read_text(encoding='utf8'));events={e['label']:e for e in capture['events']}
before=events['second-circle-control-before'];after=events['second-circle-control-after'];land=events['standing-on-newly-solid-circle-step']
assert before['switches']==[0] and after['switches']==[0,1] and land['on_floor'] and land['falls']==0 and land['selected_episode']==2
trajectory=capture['trajectory'];off=next(t for t in trajectory if t['frame']==before['frame']);on=next(t for t in trajectory if t['frame']==after['frame'])
assert off['route_collision_layers'][3:6]==[0,0,0] and on['route_collision_layers'][3:6]==[1,1,1]
assert all(t['completed']==[1] for t in trajectory)
launch=json.loads((R/'circuit-capture01/launch.json').read_text(encoding='utf8'));assert launch['code']==0 and not launch['coreChanged']
pin=json.loads((R/'code-pin.json').read_text(encoding='utf8'))
for q in pin['quotes']:
    f=R/'circuit-capture01/product'/q['file'];assert p.sha(f)==q['fullFileSha256'];assert q['displayFragment'] in q['exactUtf8']
refs=[]
def visit(x):
    if isinstance(x,dict):
        for k,v in x.items():
            if k=='path' and isinstance(v,str) and v.startswith('C:/'):
                f=pathlib.Path(v);assert f.is_file();refs.append({'path':v,'bytes':f.stat().st_size,'sha256':p.sha(f)})
            else:visit(v)
    elif isinstance(x,list):
        for v in x:visit(v)
for n in ['circuit-cut.fcproj','circuit-preview-v2.ecproj','circuit-final.fcproj']:visit(json.loads((R/'projects'/n).read_text(encoding='utf8')))
originals=[]
for name,sha in [('emberwake-v07-checkpoint-preview16.mp4','713209531a563549132bd2ab97ed4203fa3527f07908f657958a138d6171c524'),('emberwake-v07-checkpoint-preview16-v2.mp4','5cadde6d29a96d80d4c58add22242384d413ec0bbe6802725aca3413d717c3ce')]:
    f=R.parent/'v07/videos'/name;assert p.sha(f)==sha;originals.append({'path':f.as_posix(),'sha256':sha,'bytes':f.stat().st_size})
result={'phase':'new code-linked representative cut v08, not final ad','final':final,'sha256':p.sha(pathlib.Path(final)),'bytes':pathlib.Path(final).stat().st_size,'metadata':{'duration':17,'frames':510,'fps':30,'width':1080,'height':1920,'video':'h264','audio':'aac stereo'},'fullAvDecode':{'code':0,'stderr':''},'raw':{'path':p.RAW,'sha256':p.sha(pathlib.Path(p.RAW)),'newRecording':True,'oldV07RawUsed':False,'version':'0.12.0','source':pin['sourceCommit'],'scene':'res://scenes/campaign.tscn','coreChanged':[],'codeFilesPinned':71,'ordinaryProcessInputOnly':True,'completedThroughout':[1],'falls':0,'actualSwitch1OffOn':[[0,0,0],[1,1,1]],'firstNewStepLandingObserved':True},'code':pin,'nativeMediaReferences':refs,'nativeMissing':0,'audio':{'kind':'new actual game event tones; Dummy driver omits ambient start','addedBgm':False,'VOICEVOX':False,'editorialSE':False,'codeSectionSilent':[5,11],'channels':channels,'peak':float(np.max(np.abs(actual))),'clippedSamples':0,'subjectiveListen':False},'preservedOwnerLinkedV07':originals,'realtimeWholeWatch':False,'mobilePhysicalDevice':False,'independentReview':'pending Root','ownerCreativeAcceptance':'pending','NASCopy':False,'published':False,'visualReview':'separate visual-review.json after actual extracted-image review','sourcePR96':'7d2d3aabaa0b71ff602a110e4c74cc6bb916e84b preserved, no new push in this milestone'}
(R/'qa/delivery.json').write_bytes((json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
print(json.dumps({'sha256':result['sha256'],'bytes':result['bytes'],'channels':channels,'references':len(refs),'missing':0}))
