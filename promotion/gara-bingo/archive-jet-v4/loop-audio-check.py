"""Physical PCM/AAC seam proof for the single A edit and its two-cycle export."""
import argparse
import importlib.util
import json
from pathlib import Path
import sys

import numpy as np

sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('osayu_music_qa',Path(__file__).with_name('music-check.py'))
music=importlib.util.module_from_spec(spec);spec.loader.exec_module(music)
audio=music.audio
RATE=audio.RATE


def load(p):
    return json.loads(p.read_text())


def rms(x):
    return float(np.sqrt(np.mean(np.asarray(x,dtype=np.float64)**2)))


def seam(before,after,natural_before,natural_after,tolerance=2e-6):
    delta=after[0].astype(np.float64)-before[-1]
    natural_delta=natural_after[0].astype(np.float64)-natural_before[-1]
    error=float(np.max(np.abs(delta-natural_delta)))
    envelope_error=max(abs(rms(before)-rms(natural_before)),abs(rms(after)-rms(natural_after)))
    envelope_tolerance=max(.002,.1*max(rms(natural_before),rms(natural_after)))
    checks={'naturalNeighborDelta':error<=tolerance,'naturalNeighborEnvelope':envelope_error<=envelope_tolerance}
    return {'actualDelta':delta.tolist(),'naturalNeighborDelta':natural_delta.tolist(),
            'maximumDeltaError':error,'deltaErrorTolerance':tolerance,
            'beforeRms':rms(before),'afterRms':rms(after),
            'naturalBeforeRms':rms(natural_before),'naturalAfterRms':rms(natural_after),
            'envelopeRmsError':envelope_error,'envelopeRmsTolerance':envelope_tolerance,
            'checks':checks,'passed':all(checks.values())}


def abrupt_control():
    t=np.arange(48000)/RATE; x=.2*np.sin(2*np.pi*440*t)
    x=np.column_stack([x,x]); before=x[-48:]; after=x[:48]
    positive=seam(before,after,before,after)
    abrupt=before.copy();abrupt[-1]+=.25
    negative=seam(abrupt,after,before,after)
    return {'method':'Original adjacent periodic-tone samples pass; an inserted 0.25 endpoint step must fail.',
            'positive':positive,'negative':negative,'abruptSeamRejected':not negative['passed'],
            'passed':positive['passed'] and not negative['passed']}


def aac_seam(decoded,pcm,boundary=None):
    # boundary=None represents the real decoded MP4 EOF -> start replay seam.
    n=len(pcm); w=960
    if boundary is None:
        left=decoded[n-w:n];right=decoded[:w];pl=pcm[-w:];pr=pcm[:w]
    else:
        left=decoded[boundary-w:boundary];right=decoded[boundary:boundary+w]
        pl=pcm[boundary-w:boundary];pr=pcm[boundary:boundary+w]
    if left.shape!=pl.shape or right.shape!=pr.shape:
        raise RuntimeError('AAC lacks the declared seam samples.')
    noise=rms(np.concatenate([left-pl,right-pr]))
    # AAC is lossy. The bound is tied to observed adjacent codec noise and
    # capped, so a large discontinuity cannot grant itself a broad tolerance.
    tolerance=min(.03,max(.005,8*noise))
    result=seam(left[-48:],right[:48],pl[-48:],pr[:48],tolerance)
    result['codecNeighborRmsError']=noise
    joined=np.concatenate([left,right]); expected=np.concatenate([pl,pr])
    correlation=audio.similarity(expected,joined,trim=0,lag_seconds=.002)
    dropouts=audio.dropout_check(expected,joined,trim=0)
    result['correlation']=correlation;result['unexpectedEnergyDropouts']=dropouts
    result['checks']['codecWaveform']=correlation['normalizedCorrelation'] is not None and correlation['normalizedCorrelation']>=.94 and abs(correlation['lagMs'])<=2
    result['checks']['noNewSeamDropouts']=dropouts['unexpectedDropoutCount']==0
    result['passed']=all(result['checks'].values())
    return result


def main():
    parser=argparse.ArgumentParser();parser.add_argument('root');args=parser.parse_args()
    root=Path(args.root).resolve();folder=root/'a-baibai'
    report={'status':'RUNNING','plan':'a-baibai','videoOrImagesSubmittedToAI':False,'humanListening':False,'inputs':[]}
    seen=set()
    def seal(p,role):
        p=p.resolve()
        if p not in seen:
            report['inputs'].append({'file':str(p),'sha256':audio.digest(p),'role':role});seen.add(p)
        return audio.digest(p)
    try:
        manifest=root/'edit-manifest.json';edit=load(manifest);manifest_sha=seal(manifest,'manifest')
        report['manifestSha256']=manifest_sha
        n=round(edit['duration']*RATE);join=edit['loop']['voiceJoin'];split=int(join['splitSamples'])
        audio_file=root/'qa/audio-waveform-check.json';audio_report=load(audio_file);seal(audio_file,'final-audio-proof')
        music_file=root/'qa/music-check.json';music_report=load(music_file);seal(music_file,'fixed-music-proof')
        if audio_report['status']!='PASS_PITCH_CONTINUITY_FINAL' or music_report['status']!='PASS_FIXED_MUSIC_LEVEL' or audio_report['manifestSha256']!=manifest_sha or music_report['manifestSha256']!=manifest_sha:
            raise RuntimeError('Current final audio and fixed music proofs are required before loop QA.')
        if not audio_report.get('joinedVoiceProof',{}).get('passed'):
            raise RuntimeError('Independent original-source whole sentence proof is required.')
        report['negativeControl']=abrupt_control()
        meta_path=folder/'qa/music-source.json';meta=load(meta_path);seal(meta_path,'music-metadata')
        source=music.resolve_file(root,folder,meta['sourceFile']);seal(source,'original-music')
        full=audio.decode(source);mj=meta['loopJoin'];origin=int(mj['sourceStartSample'])
        music_path=folder/'media/music.wav';music_pcm=audio.decode(music_path);seal(music_path,'music-pcm')
        music_gain=float(meta['musicGain']);natural_music_before=full[origin-48:origin]*music_gain;natural_music_after=full[origin:origin+48]*music_gain
        report['musicSeam']=seam(music_pcm[-48:],music_pcm[:48],natural_music_before,natural_music_after)

        whole_path=root/'media/voice-loop-whole.wav';whole=audio.decode(whole_path);seal(whole_path,'single-tempo-whole-voice')
        prefix_path=root/'media/voice'/(join['prefixCueId']+'.wav');head_path=root/'media/voice'/(join['headCueId']+'.wav')
        prefix=audio.decode(prefix_path);head=audio.decode(head_path);seal(prefix_path,'voice-tail');seal(head_path,'voice-head')
        concat=np.concatenate([prefix,head])
        split_error=float(np.max(np.abs(concat-whole))) if concat.shape==whole.shape else None
        voice_sum_path=root/'media/voice-sum.wav';voice_sum=audio.decode(voice_sum_path);seal(voice_sum_path,'voice-placement-sum')
        expected_sum=np.zeros((n,2),dtype=np.float64)
        for event in edit['voice']:
            p=root/'media/voice'/(event['id']+'.wav');x=audio.decode(p);seal(p,'voice-cue')
            start=round(event['start']*RATE)
            expected_sum[start:start+len(x)]+=x
        placement=music.fixed_comparison(expected_sum,voice_sum,1)
        voice_meta_path=root/'qa/voice-static-gain.json';voice_meta=load(voice_meta_path);seal(voice_meta_path,'voice-static-gain-metadata')
        voice_gain=float(voice_meta['gain'])
        voice_path=root/'media/voice-mix.wav';voice=audio.decode(voice_path);voice_sha=seal(voice_path,'static-voice-bus')
        static=music.fixed_comparison(voice_sum,voice,voice_gain)
        voice_natural_before=whole[split-48:split]*voice_gain;voice_natural_after=whole[split:split+48]*voice_gain
        voice_seam=seam(voice[-48:],voice[:48],voice_natural_before,voice_natural_after)
        voice_checks={'wholeExactSplit':split_error is not None and split_error<=2e-6,'placement':placement['passed'],
                      'singleStaticGain':static['passed'],'sameSourceSentenceSeam':voice_seam['passed'],
                      'metadataManifest':voice_meta['editManifestSha256']==manifest_sha,
                      'metadataOutputHash':voice_meta['outputSha256']==voice_sha,
                      'metadataInputHash':voice_meta['inputSha256']==audio.digest(voice_sum_path)}
        report['joinedVoice']={'wholeSplitMaximumSampleError':split_error,'placementComparison':placement,'staticGainComparison':static,
                               'seam':voice_seam,'checks':voice_checks,'passed':all(voice_checks.values())}

        report['finalAudio']=[]
        for variant in ['voice-only','reference']:
            pcm_path=folder/'media'/(variant+'-mix.wav');pcm=audio.decode(pcm_path);seal(pcm_path,'final-'+variant+'-pcm')
            video=folder/'videos'/('a-baibai-'+variant+'.mp4');decoded=audio.decode(video);video_sha=seal(video,'final-'+variant+'-mp4')
            mix_meta_path=folder/'qa'/(variant+'-fixed-mix.json');mix_meta=load(mix_meta_path);seal(mix_meta_path,'fixed-'+variant+'-metadata')
            gain=float(mix_meta['busGain'])
            natural_before=voice_natural_before.copy();natural_after=voice_natural_after.copy()
            if variant=='reference':
                natural_before+=natural_music_before;natural_after+=natural_music_after
            pcm_seam=seam(pcm[-48:],pcm[:48],natural_before*gain,natural_after*gain)
            lossy=aac_seam(decoded,pcm)
            row={'variant':variant,'videoFile':str(video),'videoSha256':video_sha,'pcmFile':str(pcm_path),'pcmSha256':audio.digest(pcm_path),
                 'pcmNaturalSeam':pcm_seam,'aacReplaySeam':lossy,'passed':pcm_seam['passed'] and lossy['passed']}
            report['finalAudio'].append(row)

        two_pcm_path=folder/'media/reference-2cycle.wav';two_pcm=audio.decode(two_pcm_path);seal(two_pcm_path,'two-cycle-pcm')
        two_video=folder/'videos/a-baibai-loop-2cycle.mp4';two_decoded=audio.decode(two_video);two_sha=seal(two_video,'two-cycle-mp4')
        loop_meta_path=folder/'qa/loop-validation.json';seal(loop_meta_path,'two-cycle-export-metadata')
        reference_path=folder/'media/reference-mix.wav';reference=audio.decode(reference_path)
        expected_two=np.concatenate([reference,reference]);two_comparison=music.fixed_comparison(expected_two,two_pcm,1)
        correlation=audio.similarity(two_pcm,two_decoded)
        drops=audio.dropout_check(two_pcm[:2*n],two_decoded[:2*n])
        two_seam=aac_seam(two_decoded,two_pcm,boundary=n)
        checks={'twoExactPcmCycles':two_comparison['passed'],'aacWaveform':correlation['normalizedCorrelation'] is not None and correlation['normalizedCorrelation']>=.94 and abs(correlation['lagMs'])<=2,
                'noAddedEnergyDropouts':drops['unexpectedDropoutCount']==0,'internalDecodedSeam':two_seam['passed']}
        report['twoCycle']={'videoFile':str(two_video),'videoSha256':two_sha,'pcmFile':str(two_pcm_path),'pcmSha256':audio.digest(two_pcm_path),
                            'seamTime':edit['duration'],'comparison':two_comparison,'aacCorrelation':correlation,
                            'unexpectedEnergyDropouts':drops,'aacSeam':two_seam,'checks':checks,'passed':all(checks.values())}
        report['checks']={'abruptSeamNegativeControlRejected':report['negativeControl']['passed'],
                          'musicNaturalNeighborSeam':report['musicSeam']['passed'],'originalSentenceVoiceJoin':report['joinedVoice']['passed'],
                          'bothFinalReplaySeams':len(report['finalAudio'])==2 and all(r['passed'] for r in report['finalAudio']),
                          'twoCycleExport':report['twoCycle']['passed'],
                          'inputsUnchanged':all(audio.digest(r['file'])==r['sha256'] for r in report['inputs'])}
        report['passed']=all(report['checks'].values());report['status']='PASS_AUDIO_LOOP' if report['passed'] else 'FAIL'
        report['limitations']=['Numeric PCM/AAC continuity and a local two-cycle export are verified; replay behavior of TikTok or a particular player is not measured.',
                              'No human listening was performed. This does not claim a perceptually invisible musical arrangement change or certify the wording from ASR alone.']
        audio.save(root/'qa/loop-audio-check.json',report)
        print(json.dumps({'status':report['status'],'checks':report['checks'],'output':str(root/'qa/loop-audio-check.json')}))
        return 0 if report['passed'] else 1
    except Exception as error:
        report['status']='FAIL';report['passed']=False;report['error']=str(error);audio.save(root/'qa/loop-audio-check.json',report)
        print(json.dumps({'status':'FAIL','error':str(error)}),file=sys.stderr);return 1


if __name__=='__main__':
    sys.exit(main())
