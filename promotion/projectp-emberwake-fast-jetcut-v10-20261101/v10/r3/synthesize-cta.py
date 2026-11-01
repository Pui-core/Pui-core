import pathlib,json,urllib.request,urllib.parse,wave,math,hashlib,sys
R=pathlib.Path(__file__).parent;OLD=R.parent/'r2';BASE='http://127.0.0.1:50031'
# Only the HTTP client uses the existing Linux engine: Windows localhost forwarding timed out.
def physical(name):
 return pathlib.Path('/mnt/'+name[0].lower()+name[2:]) if sys.platform!='win32' and name[1:3]==':/' else pathlib.Path(name)
b=json.loads((OLD/'qa/voice-binding.json').read_text(encoding='utf8'));plan=json.loads((R/'source/narration-plan.json').read_text(encoding='utf8'));cue=plan['cues'][-1]
for c in b['cues'][:9]:assert hashlib.sha256(physical(c['file']).read_bytes()).hexdigest()==c['sha256']
with urllib.request.urlopen(BASE+'/version',timeout=10) as f:version=json.load(f)
assert version=='0.25.1'
req=urllib.request.Request(BASE+'/audio_query?'+urllib.parse.urlencode({'speaker':11,'text':cue['readingInput']}),data=b'',method='POST')
with urllib.request.urlopen(req,timeout=20) as f:q=json.load(f)
q.update(speedScale=1.224,intonationScale=1.2,pitchScale=0,prePhonemeLength=.025,postPhonemeLength=.045,outputSamplingRate=48000,outputStereo=True)
(R/'source/query-10.json').write_bytes((json.dumps(q,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
req=urllib.request.Request(BASE+'/synthesis?speaker=11',data=json.dumps(q,ensure_ascii=False).encode('utf8'),headers={'Content-Type':'application/json'},method='POST')
with urllib.request.urlopen(req,timeout=45) as f:data=f.read()
wav=R/'audio/voice-10-profile.wav';assert not wav.exists()
with wav.open('xb') as f:f.write(data)
with wave.open(str(wav),'rb') as w:duration=w.getnframes()/w.getframerate()
name='C:/Users/pui/private-use/emberwake-video156-20261101/v10/r3/audio/voice-10-profile.wav'
c=dict(cue,at=b['cues'][-1]['at'],duration=duration,end=b['cues'][-1]['at']+duration,file=name,sha256=hashlib.sha256(data).hexdigest(),kana=q['kana'])
b['cues'][-1]=c;b['wholeFrames']=math.ceil((c['end']+.29)*30);b.update(modifiedCues=['10'],reusedFirstNineWavs=True,profileRouteAcceptance='Root未確認・公開時必須',engineVersion=version,ttsClientRoute='既存Linux50031へ直接HTTP。Windows転送timeoutのため音声生成1句のみ。新engine/サービス変更無し。')
(R/'qa/voice-binding.json').write_bytes((json.dumps(b,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
print(json.dumps({'seconds':b['wholeFrames']/30,'ctaFrames':b['wholeFrames']-889,'cueEnd':c['end'],'kana':c['kana'],'firstNineUnchanged':True},ensure_ascii=False))
