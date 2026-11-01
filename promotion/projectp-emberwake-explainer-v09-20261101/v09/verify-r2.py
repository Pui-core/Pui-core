import os
os.environ['OMP_NUM_THREADS']='2';os.environ['OPENBLAS_NUM_THREADS']='2'
import production as p,json,pathlib,wave,numpy as np,hashlib
R=p.R;final=(R/'videos/emberwake-v09-narrated-intro45-r2.mp4').as_posix();binding=json.loads((R/'qa/voice-binding-r3.json').read_text(encoding='utf8'))
sha=p.sha(pathlib.Path(final));probe=json.loads(p.native('final-r2-probe',p.FP,['-v','error','-show_streams','-show_format','-of','json',final])['stdout']);v=next(s for s in probe['streams'] if s['codec_type']=='video');a=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'],v['r_frame_rate'],v['codec_name'],int(v['nb_frames']))==(1080,1920,'30/1','h264',1368)
assert a['channels']==2 and a['codec_name']=='aac' and 45<=float(probe['format']['duration'])<=60
d=p.native('full-av-r2-decode',p.FF,['-nostdin','-hide_banner','-loglevel','error','-xerror','-threads','2','-i',final,'-map','0:v:0','-map','0:a:0','-f','null','-']);assert d['code']==0 and not d['stderr'].strip() and p.sha(pathlib.Path(final))==sha
video_hashes=[]
for f,name in [(final,'repaired'),((R/'videos/emberwake-v09-narrated-intro45.mp4').as_posix(),'first')]:
    rec=p.native('video-stream-'+name,p.FF,['-nostdin','-hide_banner','-loglevel','error','-i',f,'-map','0:v:0','-c','copy','-f','hash','-hash','sha256','-']);video_hashes.append(rec['stdout'].strip())
assert video_hashes[0]==video_hashes[1],video_hashes

filters=[('whole-sheet','fps=1,scale=216:384,tile=8x6:padding=3:margin=3'),('key-images',"select='eq(n,30)+eq(n,180)+eq(n,330)+eq(n,480)+eq(n,650)+eq(n,840)+eq(n,1015)+eq(n,1120)+eq(n,1280)',scale=320:568,tile=3x3:padding=4:margin=4"),('landing-continuous',"select='between(n,1030,1059)',scale=216:384,tile=10x3:padding=2:margin=2")]
for tag,filt in filters:
    if (R/f'qa/{tag}.png').exists():continue
    p.native(tag,p.FF,['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-i',final,'-vf',filt,'-frames:v','1',(R/f'qa/{tag}.png').as_posix()])
if not (R/'qa/final-r2-audio.f32').exists():p.native('final-r2-audio-decode',p.FF,['-nostdin','-hide_banner','-loglevel','error','-threads','2','-i',final,'-map','0:a:0','-ar','48000','-ac','2','-f','f32le',(R/'qa/final-r2-audio.f32').as_posix()])
actual=np.fromfile(R/'qa/final-r2-audio.f32',dtype='<f4').reshape(-1,2);assert np.isfinite(actual).all() and np.max(np.abs(actual))<.999
project=json.loads((R/'projects/explainer-final-r2.fcproj').read_text(encoding='utf8'));seq=next(i['kind']['Sequence'] for i in project['project']['items'].values() if 'Sequence' in i['kind']);clips=seq['audio_tracks'][0]['items'];assert len(clips)==9
expected=np.zeros((1368*1600,2),np.float32);cues=[]
for cue,clip in zip(binding['cues'],clips):
    path=pathlib.Path(cue['file']);assert p.sha(path)==cue['sha256']
    with wave.open(str(path),'rb') as f:
        assert f.getsampwidth()==2 and f.getnchannels()==2
        data=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').reshape(-1,2).astype(np.float32)/32768
    offset=round(clip['start']*48000/p.TICK);planned=round(cue['at']*48000);assert abs(offset-planned)<=800
    clip_samples=round(clip['duration']*48000/p.TICK);count=min(len(data),clip_samples);expected[offset:offset+count]=data[:count];active=np.where(np.max(np.abs(data),axis=1)>.003)[0];assert len(active)>0 and active[-1]<count-480
    checks=[]
    for channel in range(2):
        for part,begin in [('head',int(active[0])),('tail',max(int(active[0]),int(active[-1])-14400))]:
            end=min(begin+14400,len(data));ref=data[begin:end:8,channel].astype(float)
            def metric(lag):
                got=actual[offset+begin+lag:offset+end+lag:8,channel].astype(float)
                den=np.sqrt(np.dot(ref,ref)*np.dot(got,got));return float(np.dot(ref,got)/den) if den>0 else -1.0
            lag=max(range(-2048,2049,32),key=metric);lag=max(range(lag-31,lag+32),key=metric);corr=metric(lag);assert abs(lag)<=2 and corr>.94,(cue['id'],channel,part,lag,corr)
            checks.append({'channel':'LR'[channel],'part':part,'lagSamples':lag,'correlation':corr})
    cues.append({'id':cue['id'],'text':cue['text'],'readingInput':cue.get('readingInput',cue['text']),'file':cue['file'],'sha256':cue['sha256'],'timelineSample':offset,'plannedSample':planned,'nativeRoundingSamples':offset-planned,'clipDurationSamples':clip_samples,'voicedTailMarginInsideClip':(clip_samples-int(active[-1]))/48000,'start':offset/48000,'duration':len(data)/48000,'voicedStart':(offset+int(active[0]))/48000,'voicedEnd':(offset+int(active[-1]))/48000,'checks':checks})
assert all(cues[i]['voicedEnd']<cues[i+1]['voicedStart'] for i in range(8))
refs=[]
def visit(o,project):
    if isinstance(o,dict):
        for k,value in o.items():
            if k=='path' and isinstance(value,str) and value.startswith('C:/'):
                f=pathlib.Path(value);assert f.is_file();refs.append({'project':project,'path':value,'sha256':p.sha(f),'bytes':f.stat().st_size})
            else:visit(value,project)
    elif isinstance(o,list):
        for value in o:visit(value,project)
for name in ['explainer-cut.fcproj','explainer.ecproj','explainer-final-r2.fcproj']:visit(json.loads((R/'projects'/name).read_text(encoding='utf8')),name)
assert p.sha(R.parent/'v08/videos/emberwake-v08-code-circuit-preview17.mp4')=='f036237e819b3b39e52d53bdaf6869f961bcaf52b183082628fa69c0c5c452d6'
assert p.sha(pathlib.Path(p.RAW))=='eaf9331496850d6cf86d885d8cff48a0cd45ea95b040b0fdd17c59024d31c5b3'
result={'version':'v09 narrated introduction45.6, representative opening','final':final,'sha256':sha,'bytes':pathlib.Path(final).stat().st_size,'metadata':{'videoDuration':v['duration'],'containerDuration':probe['format']['duration'],'audioDuration':a['duration'],'frames':1368,'fps':30,'width':1080,'height':1920,'video':'h264','audio':'aac stereo'},'fullAvDecode':{'code':0,'stderr':''},'narration':{'speaker':'VOICEVOX:玄野武宏','temporary':True,'voiceImitation':False,'cue06ReadingCorrected':'行 as gyou, old cue preserved','cues':cues,'peak':float(np.max(np.abs(actual))),'clipSamples':0,'minVoicedGap':min(cues[i+1]['voicedStart']-cues[i]['voicedEnd'] for i in range(8)),'endVoiceToVideoMargin':45.6-cues[-1]['voicedEnd'],'subjectiveListen':False},'nativeReferences':refs,'nativeMissing':0,'raw':{'path':p.RAW,'sha256':p.sha(pathlib.Path(p.RAW)),'source':'71584a6bd0c8852885157de71032fd9252e7a04c','version':'0.12.0','scene':'res://scenes/campaign.tscn','sameApprovedCaptureReused':True,'newCapture':False,'oldMP4Stretched':False},'voiceFirst':True,'oldV08MP4Unchanged':True,'firstUnpublishedExportHasSilentCue06':True,'repairedExportVideoStreamIdentical':video_hashes[0],'imageQAReusedFromIdenticalVideoStream':True,'music':False,'gameAudio':False,'editorialSE':False,'wholeRealtimeWatch':False,'physicalMobile':False,'independentQA':'pending Root','ownerCreativeAcceptance':'pending','published':False,'NASCopy':False}
(R/'qa/delivery-r2.json').write_bytes((json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
print(json.dumps({'sha256':sha,'bytes':result['bytes'],'metadata':result['metadata'],'headTailChecks':sum(len(c['checks']) for c in cues),'minCorrelation':min(k['correlation'] for c in cues for k in c['checks']),'peak':result['narration']['peak'],'minGap':result['narration']['minVoicedGap']}))
