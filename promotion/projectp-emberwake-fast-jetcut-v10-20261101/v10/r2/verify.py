import os
os.environ['OPENBLAS_NUM_THREADS']='2';os.environ['OMP_NUM_THREADS']='2'
import production as p,json,sys,pathlib,wave,numpy as np
R=p.R;tag='final';preview=False;binding=json.loads((R/'qa/voice-binding.json').read_text(encoding='utf8'));cues=binding['cues'][:5] if preview else binding['cues'];frames=450 if preview else binding['wholeFrames'];final=(R/'videos/emberwake-v10-r2-fast12-campfire.mp4').as_posix();sha=p.sha(pathlib.Path(final))
probe=json.loads(p.native(tag+'-probe',p.FP,['-v','error','-show_streams','-show_format','-of','json',final])['stdout']);v=next(s for s in probe['streams'] if s['codec_type']=='video');a=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'],v['r_frame_rate'],v['codec_name'],int(v['nb_frames']))==(1080,1920,'30/1','h264',frames);assert a['channels']==2 and a['codec_name']=='aac'
d=p.native(tag+'-full-decode',p.FF,['-nostdin','-hide_banner','-loglevel','error','-xerror','-threads','2','-i',final,'-map','0:v:0','-map','0:a:0','-f','null','-']);assert not d['stderr'].strip() and p.sha(pathlib.Path(final))==sha
for name,filters in [('sheet','fps=1,scale=216:384,tile=6x5:padding=3:margin=3'),('320px',"select='eq(n,30)+eq(n,105)+eq(n,180)+eq(n,550)+eq(n,700)+eq(n,950)',scale=320:568,tile=3x2:padding=4:margin=4"),('action',"select='between(n,75,124)',scale=180:320,tile=10x5:padding=2:margin=2")]:
    p.native(tag+'-'+name,p.FF,['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-i',final,'-vf',filters,'-frames:v','1',(R/f'qa/{tag}-{name}.png').as_posix()])
p.native(tag+'-audio',p.FF,['-nostdin','-hide_banner','-loglevel','error','-threads','2','-i',final,'-map','0:a:0','-ar','48000','-ac','2','-f','f32le',(R/f'qa/{tag}-audio.f32').as_posix()])
actual=np.fromfile(R/f'qa/{tag}-audio.f32',dtype='<f4').reshape(-1,2);assert np.isfinite(actual).all() and np.max(np.abs(actual))<.999
project=json.loads((R/'projects/fast12-campfire.fcproj').read_text(encoding='utf8'));seq=next(x['kind']['Sequence'] for x in project['project']['items'].values() if 'Sequence' in x['kind']);clips=seq['audio_tracks'][0]['items'];assert len(clips)==len(cues)
checks=[]
for cue,clip in zip(cues,clips):
    path=pathlib.Path(cue['file']);assert path.is_absolute() and p.sha(path)==cue['sha256']
    with wave.open(str(path),'rb') as w:data=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).astype(float)/32768
    off=round(clip['start']*48000/p.TICK);limit=round(clip['duration']*48000/p.TICK);active=np.where(np.max(np.abs(data),axis=1)>.003)[0];assert len(active) and active[-1]<limit-192,(cue['id'],limit,active[-1])
    details=[]
    for ch in range(2):
        for part,begin in [('head',int(active[0])),('tail',max(int(active[0]),int(active[-1])-12000))]:
            end=min(begin+12000,len(data));ref=data[begin:end:8,ch]
            def metric(lag):
                got=actual[off+begin+lag:off+end+lag:8,ch];den=np.sqrt(np.dot(ref,ref)*np.dot(got,got));return float(np.dot(ref,got)/den) if den>0 else -1
            lag=max(range(-2048,2049,32),key=metric);lag=max(range(lag-31,lag+32),key=metric);corr=metric(lag);assert abs(lag)<=2 and corr>.94,(cue['id'],ch,part,lag,corr)
            details.append({'channel':'LR'[ch],'part':part,'lagSamples':lag,'correlation':corr})
    checks.append({'id':cue['id'],'plannedAt':cue['at'],'nativeAt':off/48000,'voicedStart':(off+int(active[0]))/48000,'voicedEnd':(off+int(active[-1]))/48000,'clipVoiceTailMargin':(limit-int(active[-1]))/48000,'checks':details})
assert all(checks[i]['voicedEnd']<checks[i+1]['voicedStart'] for i in range(len(checks)-1));assert checks[-1]['voicedEnd']<frames/30
result={'version':'v10 r2 voice1.20 CAMPFIRE '+tag,'final':final,'sha256':sha,'bytes':pathlib.Path(final).stat().st_size,'videoSeconds':v['duration'],'audioSeconds':a['duration'],'containerSeconds':probe['format']['duration'],'frames':frames,'fps':30,'size':[1080,1920],'codecs':['h264','aac stereo'],'fullAvDecode':0,'decodeStderr':'','oldVoiceSpeed':1.02,'newVoiceSpeed':1.224,'relativeRate':1.2,'globalVideoSpeedup':False,'cueCount':len(checks),'cueQA':checks,'minCorrelation':min(k['correlation'] for c in checks for k in c['checks']),'clippedSamples':0,'peak':float(np.max(np.abs(actual))),'minVoicedGap':min(checks[i+1]['voicedStart']-checks[i]['voicedEnd'] for i in range(len(checks)-1)),'oldFinalSeconds':45.6,'newWholeTargetSeconds':binding['wholeFrames']/30,'oldChars':281,'newBodyChars':225,'newCTAChars':len(binding['cues'][-1]['text']),'removedCueGapsSeconds':.64,'jetCutPlan':'reuse-edit-plan.json','ctaURL':'https://camp-fire.jp/projects/993744/view','ctaStartSeconds':round(binding['cues'][9]['at']*30)/30,'imageReview':'separate visual review after actual viewing','subjectiveListen':False,'wholeRealtimeWatch':False,'physicalMobile':False,'independentQA':'pending Root','ownerCreativeAcceptance':'pending','NASCopy':False,'published':False}
(R/f'qa/{tag}-delivery.json').write_bytes((json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode('utf8'));print(json.dumps({'sha256':sha,'bytes':result['bytes'],'seconds':result['videoSeconds'],'correlation':result['minCorrelation'],'voiceGap':result['minVoicedGap'],'headTailChecks':len(checks)*4}))
