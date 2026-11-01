import pathlib,json,urllib.request,urllib.parse,wave,hashlib,time
R=pathlib.Path(__file__).parent;plan=json.loads((R/'source/narration-plan.json').read_text(encoding='utf8'));B='http://127.0.0.1:50031';start=time.monotonic();cues=[];cursor=.04
with urllib.request.urlopen(B+'/speakers',timeout=10) as r:speakers=json.load(r)
assert next(s for s in speakers if any(t['id']==11 for t in s['styles']))['name']=='玄野武宏'
for cue in plan['cues']:
    assert time.monotonic()-start<180
    req=urllib.request.Request(B+'/audio_query?'+urllib.parse.urlencode({'speaker':11,'text':cue['readingInput']}),data=b'',method='POST')
    with urllib.request.urlopen(req,timeout=20) as f:q=json.load(f)
    q.update(speedScale=plan['newSpeed'],intonationScale=1.2,pitchScale=0,prePhonemeLength=.025,postPhonemeLength=.045,outputSamplingRate=48000,outputStereo=True)
    if cue['id']=='06':assert 'ギョ' in q['kana'] and 'クダリ' not in q['kana']
    (R/'source'/('query-'+cue['id']+'.json')).write_bytes((json.dumps(q,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
    req=urllib.request.Request(B+'/synthesis?speaker=11',data=json.dumps(q,ensure_ascii=False).encode('utf8'),headers={'Content-Type':'application/json'},method='POST')
    with urllib.request.urlopen(req,timeout=30) as f:data=f.read()
    wav=R/'audio'/('voice-'+cue['id']+'.wav');assert not wav.exists()
    with wav.open('xb') as f:f.write(data)
    with wave.open(str(wav),'rb') as f:duration=f.getnframes()/f.getframerate()
    cues.append(dict(cue,at=cursor,duration=duration,end=cursor+duration,file=wav.resolve().as_posix(),sha256=hashlib.sha256(data).hexdigest(),kana=q['kana']))
    cursor+=duration+.04
result={'speaker':'VOICEVOX:玄野武宏','speakerId':11,'oldSpeed':plan['oldSpeed'],'newSpeed':plan['newSpeed'],'relativeRate':plan['relativeRate'],'oldFinalSeconds':45.6,'newInterCueGap':.04,'oldInterCueGap':.12,'prePhonemeLength':.025,'postPhonemeLength':.045,'cues':cues,'wholeFrames':__import__('math').ceil((cursor+.25)*30),'previewCueCount':5,'previewFrames':__import__('math').ceil((cues[4]['end']+.24)*30),'subjectiveListen':False}
(R/'qa/voice-binding.json').write_bytes((json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
print(json.dumps({'relativeRate':1.3,'newSpeed':plan['newSpeed'],'previewSeconds':result['previewFrames']/30,'wholeSeconds':result['wholeFrames']/30,'cues':[(c['id'],round(c['at'],3),round(c['end'],3)) for c in cues]}))
