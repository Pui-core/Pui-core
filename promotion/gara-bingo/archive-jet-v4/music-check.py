"""Independent, audio-only proof of constant scalar music and final bus gain."""
import argparse
import importlib.util
import json
import math
from pathlib import Path
import sys

import numpy as np

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('osayu_audio_qa',Path(__file__).with_name('audio-check.py'))
audio = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audio)
RATE = audio.RATE


def load(filename):
    return json.loads(filename.read_text())


def resolve_file(root, folder, value):
    p = Path(value)
    if p.is_absolute():
        return p
    for candidate in [root/p,folder/p,folder/'media'/p,root/'audio-preview'/p]:
        if candidate.is_file():
            return candidate
    raise RuntimeError('Missing audio input: '+str(value))


def fixed_comparison(reference, test, gain):
    """No fitted gain can hide automation: compare the declared scalar first."""
    if not math.isfinite(gain) or gain <= 0:
        raise RuntimeError('Expected a positive, finite constant scalar.')
    same_length = len(reference)==len(test)
    n=min(len(reference),len(test))
    if n < RATE//2:
        raise RuntimeError('Insufficient waveform samples for fixed gain QA.')
    a=reference[:n].astype(np.float64); b=test[:n].astype(np.float64)
    error=b-a*gain
    maximum=float(np.max(np.abs(error)))
    rms=float(np.sqrt(np.mean(error*error)))
    denominator=float(np.sum(a*a))
    fitted=float(np.sum(a*b)/max(denominator,1e-30))
    # 50ms windows retain the source song's natural dynamics. Each window's
    # gain is measured against its own original samples, not against LUFS.
    windows=[]
    for start in range(0,n,2400):
        x=a[start:start+2400]; y=b[start:start+2400]
        norm=float(np.sum(x*x))
        if np.sqrt(norm/max(x.size,1)) < .0001:
            continue
        value=float(np.sum(x*y)/norm)
        windows.append({'start':start/RATE,'gain':value})
    deviations=[abs(w['gain']/gain-1) for w in windows]
    max_deviation=max(deviations,default=float('inf'))
    checks={'sameLength':same_length,'maximumSampleError':maximum<=2e-6,
            'rmsSampleError':rms<=2e-7,'declaredGain':abs(fitted/gain-1)<=.0001,
            'activeWindowsPresent':len(windows)>0,'constantWindowGain':max_deviation<=.001}
    return {'declaredGain':gain,'measuredGain':fitted,'frames':n,'sameLength':same_length,
            'maximumSampleError':maximum,'rmsSampleError':rms,
            'maximumWindowGainRelativeDeviation':max_deviation,'windowSeconds':.05,
            'windowReferenceRmsThreshold':.0001,'activeWindowCount':len(windows),
            'maximumSampleErrorTolerance':2e-6,'rmsSampleErrorTolerance':2e-7,
            'windowGainRelativeTolerance':.001,'windows':windows,
            'checks':checks,'passed':all(checks.values())}


def negative_control(edit):
    n=round(edit['duration']*RATE); t=np.arange(n)/RATE
    # Natural amplitude modulation must pass; speech-triggered gain must fail.
    a=(.12+.06*np.sin(2*np.pi*t/.83))*np.sin(2*np.pi*440*t)
    reference=np.column_stack([a,a*.8]).astype(np.float32)
    gain=.37
    positive=fixed_comparison(reference,reference*gain,gain)
    envelope=np.ones(n)
    for event in edit['voice']:
        start=round(event['start']*RATE); end=round((event['start']+event['duration'])*RATE)
        envelope[start:end]=.22
    negative=fixed_comparison(reference,reference*gain*envelope[:,None],gain)
    return {'method':'Naturally varying tone at a fixed scalar passes; a 0.22 gain only during actual voice intervals must fail.',
            'voiceTriggeredGain':.22,'positive':positive,'negative':negative,
            'positivePassed':positive['passed'],'voiceDuckRejected':not negative['passed'],
            'passed':positive['passed'] and not negative['passed']}


def raw_from_original(source, start, duration):
    filter_=f'atrim=start={start}:duration={duration},asetpts=PTS-STARTPTS,aresample=48000:async=0,aformat=channel_layouts=stereo,apad,atrim=duration={duration}'
    command=[audio.FF,'-v','error','-i',audio.native(source),'-vn','-map','0:a:0',
             '-af',filter_,'-ac','2','-ar','48000','-f','f32le','-']
    samples=np.frombuffer(audio.call(command),dtype='<f4').reshape(-1,2).copy()
    return samples,command


def boundary_ramps(raw, fade_in, fade_out):
    x=raw.astype(np.float64).copy(); n=len(x)
    ni=round(fade_in*RATE); no=round(fade_out*RATE)
    if ni:
        x[:ni]*=(np.arange(ni)/ni)[:,None]
    if no:
        x[-no:]*=((no-np.arange(no))/no)[:,None]
    return x


def cyclic_music(root, folder, source, meta, edit):
    """Only one declared 150ms linear original-source preroll wrap is allowed."""
    join=meta['loopJoin']
    count=round(edit['duration']*RATE)
    origin=int(join['sourceStartSample']); wrap_start=int(join['wrapStartSample'])
    wrap_end=int(join['wrapEndSampleExclusive']); blend_start=int(join['blendStartSample'])
    blend_count=int(join['blendSampleCount']); denominator=int(join['weightDenominator'])
    contract={'declaredMode':join['mode']=='linear-preroll-wrap',
              'sourceOrigin':origin==10080,'mainLength':int(join['mainSampleCount'])==count,
              'oneDeclared150msBlend':blend_count==7200 and blend_start==count-blend_count,
              'adjacentPreroll':wrap_start==2880 and wrap_end==origin and wrap_end-wrap_start==blend_count,
              'complementaryLinearWeights':denominator==blend_count-1,
              'noBoundaryFade':meta['fadeInSeconds']==0 and meta['fadeOutSeconds']==0}
    if not all(contract.values()):
        raise RuntimeError('Cyclic music contract differs: '+str(contract))
    full=audio.decode(source)
    main=full[origin:origin+count].copy(); preroll=full[wrap_start:wrap_end].copy()
    if len(main)!=count or len(preroll)!=blend_count:
        raise RuntimeError('Original music has insufficient cyclic source samples.')
    full_path=resolve_file(root,folder,join['fullSourceFile'])
    wrap_path=resolve_file(root,folder,join['wrapFile'])
    full_comparison=fixed_comparison(full,audio.decode(full_path),1)
    # The wrap is shorter than fixed_comparison's 0.5s analysis window. Its
    # entire sample array is checked directly instead, without fitting gain.
    actual_wrap=audio.decode(wrap_path)
    wrap_error=float(np.max(np.abs(actual_wrap.astype(np.float64)-preroll))) if actual_wrap.shape==preroll.shape else None
    expected=main.astype(np.float64)
    weight=np.arange(blend_count,dtype=np.float64)/denominator
    expected[blend_start:]=(1-weight[:,None])*expected[blend_start:]+weight[:,None]*preroll
    checks={**contract,'fullSourceHash':audio.digest(full_path)==join['fullSourceSha256'],
            'wrapHash':audio.digest(wrap_path)==join['wrapSha256'],
            'fullContinuousDecode':full_comparison['passed'],
            'prerollSamples':wrap_error is not None and wrap_error<=2e-6}
    proof={'mode':join['mode'],'parameters':join,'fullSourceFile':str(full_path),'fullSourceSha256':audio.digest(full_path),
           'wrapFile':str(wrap_path),'wrapSha256':audio.digest(wrap_path),'wrapMaximumSampleError':wrap_error,
           'fullSourceComparison':full_comparison,'checks':checks,'passed':all(checks.values())}
    return main,expected,proof


def check_plan(root, edit, manifest_sha, plan, pcm_only=False):
    folder=root/plan; meta_file=folder/'qa/music-source.json'; meta=load(meta_file)
    source=resolve_file(root,folder,meta.get('file') or meta['sourceFile'])
    source_sha=audio.digest(source)
    raw_path=folder/'media/music-source.wav'; music_path=folder/'media/music.wav'
    raw_sha=audio.digest(raw_path); music_sha=audio.digest(music_path)
    start=float(meta['sourceStart'] if 'sourceStart' in meta else meta['previewStart'])
    duration=float(meta['sourceDuration'] if 'sourceDuration' in meta else meta['previewEnd']-meta['previewStart'])
    music_start=float(meta['musicStart'] if 'musicStart' in meta else meta['videoStart'])
    fade_in=float(meta['fadeInSeconds']); fade_out=float(meta['fadeOutSeconds'])
    gain=float(meta['musicGain'])
    loop_proof=None
    if meta.get('loopJoin'):
        original,expected,loop_proof=cyclic_music(root,folder,source,meta,edit)
        command={'method':'Continuous full source decode then sample slicing and the single declared complementary linear wrap.'}
    else:
        original,command=raw_from_original(source,start,duration)
    raw=audio.decode(raw_path); music=audio.decode(music_path)
    source_comparison=fixed_comparison(original,raw,1)
    if loop_proof is None:
        expected=boundary_ramps(raw,fade_in,fade_out)
    music_comparison=fixed_comparison(expected,music,gain)
    source_metadata_sha=audio.digest(meta_file)
    checks={'musicStartsAtZero':music_start==0 and edit.get('musicStart')==0,
            'constantGainDeclared':meta.get('musicGainMode')=='constant' and edit.get('musicGainMode')=='constant',
            'onlyBoundaryRamps':0<=fade_in<=.010 and 0<=fade_out<=.010,
            'completeMusicDuration':abs(duration-edit['duration'])<=1/RATE and len(music)==round(edit['duration']*RATE),
            'sourceHash':source_sha==meta['sha256'],
            'musicHash':music_sha==meta['musicSha256'],
            'manifestHash':meta['editManifestSha256']==manifest_sha,
            'sourceMatchesOriginal':source_comparison['passed'],
            'musicFixedGain':music_comparison['passed']}
    if loop_proof is not None:
        checks['onlyDeclaredCyclicJoin']=loop_proof['passed']
    checks['rawPcmHash']=raw_sha==meta['rawPcmSha256'] and resolve_file(root,folder,meta['rawPcmFile']).resolve()==raw_path.resolve()
    # sourceFile/sourceSha256 may name the raw PCM or the original M4A; both
    # are sealed independently above, so require that pair to agree as well.
    recorded_source=resolve_file(root,folder,meta['sourceFile'])
    checks['recordedSourceHash']=audio.digest(recorded_source)==meta['sourceSha256']
    voice_path=folder/'media/voice.wav'; voice=audio.decode(voice_path); voice_sha=audio.digest(voice_path)
    final=[]
    for variant in ['voice-only','reference']:
        mix_meta_file=folder/'qa'/(variant+'-fixed-mix.json'); mix_meta=load(mix_meta_file)
        pcm_path=folder/'media'/(variant+'-mix.wav'); pcm=audio.decode(pcm_path)
        video=folder/'videos'/(plan+'-'+variant+'.mp4')
        combined=voice.astype(np.float64)
        if variant=='reference':
            if len(voice)!=len(music):
                raise RuntimeError('Voice and music bus lengths differ.')
            combined=combined+music.astype(np.float64)
        comparison=fixed_comparison(combined,pcm,float(mix_meta['busGain']))
        row_checks={'fixedScalarSum':mix_meta['mixMode']=='fixed-scalar-sum',
                    'manifestHash':mix_meta['editManifestSha256']==manifest_sha,
                    'voiceHash':voice_sha==mix_meta['inputVoiceSha256'],
                    'musicHash':mix_meta['inputMusicSha256']==(music_sha if variant=='reference' else None),
                    'pcmHash':audio.digest(pcm_path)==mix_meta['pcmSha256'] and resolve_file(root,folder,mix_meta['pcmFile']).resolve()==pcm_path.resolve(),
                    'fixedBusGain':comparison['passed']}
        final.append({'variant':variant,'metadataFile':str(mix_meta_file),'metadataSha256':audio.digest(mix_meta_file),
                      'voiceFile':str(voice_path),'voiceSha256':voice_sha,
                      'pcmFile':str(pcm_path),'pcmSha256':audio.digest(pcm_path),
                      'videoFile':str(video),'videoSha256':None if pcm_only else audio.digest(video),
                      'videoStatus':'NOT_RUN' if pcm_only else 'SHA_BOUND',
                      'comparison':comparison,'checks':row_checks,'passed':all(row_checks.values())})
    checks['allFinalMixes']=all(row['passed'] for row in final)
    checks['inputsUnchanged']=audio.digest(source)==source_sha and audio.digest(raw_path)==raw_sha and audio.digest(music_path)==music_sha and audio.digest(meta_file)==source_metadata_sha
    return {'plan':plan,'sourceMetadataFile':str(meta_file),'sourceMetadataSha256':source_metadata_sha,
            'sourceFile':str(source),'sourceSha256':source_sha,'sourcePcmFile':str(raw_path),'sourcePcmSha256':raw_sha,
            'musicFile':str(music_path),'musicSha256':music_sha,'sourceCommand':command,
            'loopJoinProof':loop_proof,
            'sourceComparison':source_comparison,'musicFixedGainComparison':music_comparison,
            'finalMixes':final,'checks':checks,'passed':all(checks.values())}


def main():
    parser=argparse.ArgumentParser(); parser.add_argument('root'); parser.add_argument('--plans',default='a-baibai'); parser.add_argument('--pcm-only',action='store_true')
    args=parser.parse_args(); root=Path(args.root).resolve(); plans=args.plans.split(',')
    name='music-pcm-check.json' if args.pcm_only else 'music-check.json'
    report={'status':'RUNNING','method':'Independent source PCM comparison, declared constant gain sample residuals and 50ms gain windows; fixed scalar final bus sum.',
            'finalAACStatus':'NOT_RUN' if args.pcm_only else 'SHA_BOUND_REQUIRES_AUDIO_WAVEFORM_CHECK',
            'videoOrImagesSubmittedToAI':False,'humanListening':False,'plansRequested':plans,'plans':[]}
    try:
        manifest=root/'edit-manifest.json'; manifest_sha=audio.digest(manifest); edit=load(manifest)
        report['manifestSha256']=manifest_sha; report['negativeControl']=negative_control(edit)
        for plan in plans:
            row=check_plan(root,edit,manifest_sha,plan,args.pcm_only); report['plans'].append(row)
            print(json.dumps({'plan':plan,'passed':row['passed'],'failed':[k for k,v in row['checks'].items() if not v]}),flush=True)
        report['checks']={'allRequestedPlans':len(report['plans'])==len(plans) and len(plans)>0 and all(r['passed'] for r in report['plans']),
                          'voiceDuckNegativeControlRejected':report['negativeControl']['passed'],
                          'manifestUnchanged':audio.digest(manifest)==manifest_sha}
        report['passed']=all(report['checks'].values()); report['status']=('PASS_FIXED_MUSIC_PCM' if args.pcm_only else 'PASS_FIXED_MUSIC_LEVEL') if report['passed'] else 'FAIL'
        report['limitations']=['A constant scalar preserves natural track dynamics; it does not make the song itself constant loudness.',
                              'Final AAC continuity is a separate mandatory audio-waveform-check.json gate. This report seals those MP4 files without reading video frames.',
                              'This is numeric audio QA; no subjective human listening was performed.']
        audio.save(root/'qa'/name,report)
        print(json.dumps({'status':report['status'],'output':str(root/'qa'/name)}))
        return 0 if report['passed'] else 1
    except Exception as error:
        report['status']='FAIL'; report['passed']=False; report['error']=str(error)
        audio.save(root/'qa'/name,report)
        print(json.dumps({'status':'FAIL','error':str(error)}),file=sys.stderr)
        return 1


if __name__=='__main__':
    sys.exit(main())
