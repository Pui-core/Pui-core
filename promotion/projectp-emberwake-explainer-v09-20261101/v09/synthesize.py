import json,pathlib,urllib.request,urllib.parse,wave,hashlib,time
R=pathlib.Path(__file__).parent;BASE='http://127.0.0.1:50031';started=time.monotonic()
plan=json.loads((R/'source/narration-plan.json').read_text(encoding='utf8'))
speakers=json.loads((R/'qa/voicevox-speakers.json').read_text(encoding='utf8'))
assert next(s for s in speakers if any(t['id']==11 for t in s['styles']))['name']=='玄野武宏'
def request(path,data=None):
    assert time.monotonic()-started<210
    req=urllib.request.Request(BASE+path,data=data if data is not None else b'',headers={'Content-Type':'application/json'},method='POST')
    with urllib.request.urlopen(req,timeout=35) as q:return q.read()
queries=[];base_duration=0
for cue in plan['cues']:
    q=json.loads(request('/audio_query?'+urllib.parse.urlencode({'text':cue['text'],'speaker':11})))
    q.update(speedScale=1.12,intonationScale=1.2,pitchScale=0.0,prePhonemeLength=.055,postPhonemeLength=.14,outputSamplingRate=48000,outputStereo=True)
    duration=q['prePhonemeLength']+q['postPhonemeLength']
    for phrase in q['accent_phrases']:
        for m in phrase['moras']+[phrase['pause_mora']] if phrase.get('pause_mora') else phrase['moras']:
            duration+=float(m.get('consonant_length') or 0)+m['vowel_length']
    base_duration+=duration;queries.append(q)
# Put a connected spoken explanation first; choose a readable tempo before synthesis.
speed=max(1.02,min(1.25,base_duration/51.8))
bound=[];cursor=.12
for cue,q in zip(plan['cues'],queries):
    q['speedScale']=speed
    query=R/'source'/('query-'+cue['id']+'.json');query.write_bytes((json.dumps(q,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
    wav=R/'audio'/('voice-'+cue['id']+'.wav');assert not wav.exists()
    data=request('/synthesis?speaker=11',json.dumps(q,ensure_ascii=False).encode('utf8'))
    with wav.open('xb') as f:f.write(data)
    with wave.open(str(wav),'rb') as f:
        assert f.getframerate()==48000 and f.getnchannels()==2
        duration=f.getnframes()/48000
    bound.append(dict(cue,at=cursor,duration=duration,end=cursor+duration,file=wav.as_posix(),sha256=hashlib.sha256(data).hexdigest(),kana=q['kana'],speedScale=speed))
    cursor+=duration+.12
result={'speaker':'VOICEVOX:玄野武宏','speakerId':11,'engine':'0.25.1 at pre-existing127.0.0.1:50031 (WSL forwarded; Windows client, no new engine instance)','temporaryNarration':True,'ownerOrHytackaVoiceImitation':False,'speedScale':speed,'cues':bound,'spokenTimelineEnd':cursor-.12,'recommendedFrames':__import__('math').ceil((cursor+.45)*30),'subjectiveListen':False,'gameAudioUsed':False,'musicUsed':False}
(R/'qa/voice-binding.json').write_bytes((json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
print(json.dumps({'speed':speed,'spokenEnd':result['spokenTimelineEnd'],'frames':result['recommendedFrames'],'cues':[(c['id'],round(c['at'],2),round(c['duration'],2)) for c in bound]}))
