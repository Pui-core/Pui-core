import pathlib, json, math, sys, importlib.util, hashlib
import numpy as np
spec=importlib.util.spec_from_file_location('production',pathlib.Path(__file__).with_name('preview-production.py'))
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
R=p.R;final=(R/'videos/emberwake-v07-checkpoint-preview16.mp4').as_posix()
probe=p.native('final-probe',p.FP,['-v','error','-show_streams','-show_format','-of','json',final])
j=json.loads(probe['stdout']);v=next(s for s in j['streams'] if s['codec_type']=='video');a=next(s for s in j['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'],v['r_frame_rate'],v['codec_name'],int(v['nb_frames']))==(1080,1920,'30/1','h264',480)
assert a['codec_name']=='aac' and a['channels']==2 and abs(float(j['format']['duration'])-16)<.1
d=p.native('final-full-av-decode',p.FF,['-nostdin','-hide_banner','-loglevel','error','-xerror','-threads','2','-i',final,'-map','0:v:0','-map','0:a:0','-f','null','-'])
assert not d['stderr'].strip()
p.native('final-sheet',p.FF,['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-i',final,'-vf','fps=1,scale=270:480,tile=4x4:padding=6:margin=6','-frames:v','1',(R/'qa/preview-whole-sheet.png').as_posix()])
p.native('final-fall-strip',p.FF,['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-i',final,'-vf',"select='between(n,99,170)',scale=180:320,tile=12x6:padding=2:margin=2",'-frames:v','1',(R/'qa/preview-fall-continuous.png').as_posix()])
for file,name in [(p.RAW,'raw'),(final,'final')]:
    p.native(name+'-audio-decode',p.FF,['-nostdin','-hide_banner','-loglevel','error','-threads','2','-i',file,'-map','0:a:0','-ar','48000','-ac','2','-f','f32le',(R/f'qa/{name}-audio.f32').as_posix()])
raw=np.fromfile(R/'qa/raw-audio.f32',dtype='<f4').reshape(-1,2);actual=np.fromfile(R/'qa/final-audio.f32',dtype='<f4').reshape(-1,2)
expected=np.zeros((16*48000,2),np.float32)
plan=json.loads((R/'qa/edit-plan.json').read_text(encoding='utf8'))
for shot in plan['shots']:
    if shot.get('image'):continue
    start=shot['timelineFrame']*1600;src=shot['sourceFrame']*1600;n=shot['frames']*1600
    expected[start:start+n]=raw[src:src+n]
assert np.isfinite(actual).all() and abs(len(actual)-len(expected))<=2048 and np.max(np.abs(actual))<.999
channels=[]
for c in range(2):
    aa=expected[48000:8*48000:16,c].astype(np.float64)
    def metric(lag):
        bb=actual[48000+lag:8*48000+lag:16,c].astype(np.float64)
        return float(np.dot(aa,bb)/np.sqrt(np.dot(aa,aa)*np.dot(bb,bb)))
    lag=max(range(-2048,2049,32),key=metric);lag=max(range(lag-31,lag+32),key=metric)
    corr=metric(lag);assert abs(lag)<=2 and corr>.96,(c,lag,corr)
    channels.append({'channel':'LR'[c],'lagSamples':lag,'correlation':corr})
capture=json.loads((R/'episode2-capture01/capture.json').read_text(encoding='utf8'))
events={e['label']:e for e in capture['events']}
names=['episode2-title-before-input-memory1','second-checkpoint-before-fall','actual-fall-return-second-checkpoint','episode2-title-after-memory1-without-clear']
for name in names:assert events[name]['selected_episode']==2
for name in [names[0],names[-1]]:assert any('失った記憶 1 / 15' in s for s in events[name]['labels'])
assert events[names[1]]['falls']==0 and events[names[2]]['falls']==1 and events[names[2]]['hearths']==[0,1]
launch=json.loads((R/'episode2-capture01/launch.json').read_text(encoding='utf8'));assert launch['code']==0 and launch['coreChanged']==[]
deps=[]
for folder in ['projects','media']:
    for path in (R/folder).iterdir():
        if path.is_file():deps.append({'file':path.as_posix(),'sha256':p.sha(path),'bytes':path.stat().st_size})
result={'version':'v07 representative cut, not full65','final':final,'sha256':p.sha(final),'bytes':pathlib.Path(final).stat().st_size,'format':{'duration':j['format']['duration'],'frames':480,'width':1080,'height':1920,'video':'h264','audio':'aac','fps':30},'fullAvDecodeExit':0,'nativeDependencyFiles':deps,'raw':{'file':p.RAW,'sha256':p.sha(p.RAW),'sourceCommit':'71584a6bd0c8852885157de71032fd9252e7a04c','version':'0.12.0','dimensions':[1440,810],'frames':1140,'inputLog':'episode2-capture01/capture.json','productFilesChanged':[],'newCapture':True,'previousFinalOrOldRawUsed':False},'audio':{'kind':'newly captured native game audio only','narration':False,'addedMusic':False,'actualPeak':float(np.max(np.abs(actual))),'clippedSamples':int(np.sum(np.abs(actual)>=.999)),'channels':channels,'headTailVoiceCheck':'not applicable: no narration in representative cut','subjectiveListen':False},'observations':[{'event':name,'frame':events[name]['frame'],'falls':events[name]['falls'],'hearths':events[name]['hearths'],'labels':events[name]['labels']} for name in names],'wholeRealtimeWatch':False,'mobilePhysicalDevice':False,'independentReview':'pending Root','ownerCreativeAcceptance':'pending','published':False,'nasCopy':False}
(R/'qa/preview-delivery.json').write_bytes((json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
print(json.dumps({'preview':final,'sha256':result['sha256'],'channels':channels,'technicalPass':True}))
