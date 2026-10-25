"""Reproducible, audio-only numeric QA. Requires NumPy; never loads video frames."""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import subprocess
import sys
import wave

import numpy as np

RATE = 48000
ZERO = 1 / 32768
MIN_HOLE = 96  # 2 ms; tiny zero crossings and quantization runs are excluded.


def digest(filename):
    h = hashlib.sha256()
    with Path(filename).open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def save(filename, data):
    filename.parent.mkdir(parents=True, exist_ok=True)
    filename.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def native(filename):
    return subprocess.check_output(['wslpath', '-w', str(Path(filename).resolve())], text=True).strip()


FF = str(Path(os.environ.get('OSAYU_AUDIO_QA_FFMPEG', '/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe')).resolve())
FP = str(Path(FF).with_name('ffprobe.exe'))


def call(args):
    return subprocess.check_output(args, stderr=subprocess.PIPE, timeout=180)


def probe(filename):
    return json.loads(call([FP, '-v', 'error', '-show_streams', '-show_format', '-of', 'json', native(filename)]))


def decode(filename):
    args = [FF, '-v', 'error', '-i', native(filename), '-map', '0:a:0', '-vn', '-ac', '2', '-ar', str(RATE),
            '-c:a', 'pcm_f32le', '-f', 'f32le', '-']
    return np.frombuffer(call(args), dtype='<f4').reshape(-1, 2).copy()


def original_excerpt(archive, event, tempo):
    # The source bound is INPUT-side. Resetting the output sample clock must
    # never allow later words beyond sourceOut to be read to fill a target time.
    duration = event['sourceOut'] - event['sourceIn']
    args = [FF, '-v', 'error', '-ss', str(event['sourceIn']), '-t', str(duration), '-i', native(archive),
            '-map', '0:a:0', '-vn', '-af', f'asetpts=N/SR/TB,aresample=48000:async=0,atempo={tempo},aformat=channel_layouts=stereo',
            '-ac', '2', '-ar', str(RATE), '-c:a', 'pcm_f32le', '-f', 'f32le', '-']
    return np.frombuffer(call(args), dtype='<f4').reshape(-1, 2).copy(), args


def spans(mask):
    edges = np.diff(np.r_[False, mask, False].astype(np.int8))
    return list(zip(np.where(edges == 1)[0], np.where(edges == -1)[0]))


def metrics(x, left=.020, right=.020):
    if len(x) < 2:
        raise RuntimeError('Empty audio samples.')
    magnitude = np.max(np.abs(x), axis=1)
    lo, hi = round(left * RATE), len(x) - round(right * RATE)
    holes = [(int(a), int(b)) for a, b in spans(magnitude <= ZERO)
             if a >= lo and b <= hi and b - a >= MIN_HOLE]
    core = x[max(0, lo):max(lo + 1, hi)]
    jumps = np.max(np.abs(np.diff(core, axis=0)), axis=1)
    edge = min(960, len(x))
    return {'frames':len(x), 'seconds':len(x)/RATE, 'interiorExclusionSeconds':[left, right],
            'nearZeroThreshold':ZERO, 'minimumHoleMs':2, 'internalHoleCount':len(holes),
            'internalHoleMs':sum(b-a for a, b in holes)/48,
            'internalHoles':[{'start':a/RATE, 'durationMs':(b-a)/48} for a, b in holes],
            'peak':float(magnitude.max()), 'rms':float(np.sqrt(np.mean(x*x))),
            'maxInteriorSampleJump':float(jumps.max()) if len(jumps) else 0,
            'jumpP999':float(np.quantile(jumps, .999)) if len(jumps) else 0,
            'firstSampleMax':float(magnitude[0]), 'lastSampleMax':float(magnitude[-1]),
            'first20msRms':float(np.sqrt(np.mean(x[:edge]**2))),
            'last20msRms':float(np.sqrt(np.mean(x[-edge:]**2)))}


def similarity(reference, test, trim=.030, lag_seconds=.010):
    n = min(len(reference), len(test))
    edge = round(trim*RATE)
    if n <= 2*edge + 480:
        raise RuntimeError('Insufficient common samples for waveform correlation.')
    a = reference[edge:n-edge].mean(axis=1).astype(np.float64)
    b = test[edge:n-edge].mean(axis=1).astype(np.float64)
    a -= np.mean(a); b -= np.mean(b)
    size = 1 << (2*len(a)-1).bit_length()
    corr = np.fft.irfft(np.fft.rfft(b, size)*np.conj(np.fft.rfft(a, size)), size)
    denominator = math.sqrt(float(np.dot(a, a)*np.dot(b, b)))
    if denominator < 1e-14:
        return {'normalizedCorrelation':None, 'lagSamples':None, 'reason':'Near-silent comparison.'}
    limit = round(lag_seconds*RATE)
    lags = np.arange(-limit, limit+1)
    scores = corr[lags % size]/denominator
    i = int(np.argmax(scores))
    return {'normalizedCorrelation':float(min(1, scores[i])), 'lagSamples':int(lags[i]),
            'lagMs':float(lags[i]/48), 'commonFrames':len(a), 'trimSeconds':trim}


def dropout_check(reference, test, trim=.030):
    n = min(len(reference), len(test)); e = round(trim*RATE)
    a = reference[e:n-e].mean(axis=1).astype(np.float64)
    b = test[e:n-e].mean(axis=1).astype(np.float64)
    gain = float(np.dot(a,b)/max(np.dot(a,a),1e-18))
    bins = len(a)//48
    ea = np.sqrt(np.mean(a[:bins*48].reshape(-1,48)**2,axis=1))*abs(gain)
    eb = np.sqrt(np.mean(b[:bins*48].reshape(-1,48)**2,axis=1))
    bad = (ea > .005) & (eb < ea*.10)
    holes = [(int(s),int(t)) for s,t in spans(bad) if t-s >= 2]
    return {'expectedGain':gain, 'activeReferenceRmsThreshold':.005, 'remainingEnergyRatioThreshold':.10,
            'minimumConsecutiveMs':2, 'unexpectedDropoutCount':len(holes),
            'dropouts':[{'start':trim+s/1000, 'durationMs':t-s} for s,t in holes]}


def peak_frequency(x):
    mono = x.mean(axis=1).astype(np.float64)
    edge = round(.25*RATE); mono = mono[edge:-edge]
    spectrum = np.abs(np.fft.rfft(mono*np.hanning(len(mono))))
    index = int(np.argmax(spectrum[1:]))+1
    y = np.log(np.maximum(spectrum[index-1:index+2],1e-30))
    shift = .5*(y[0]-y[2])/(y[0]-2*y[1]+y[2])
    return float((index+shift)*RATE/len(mono))


def calibrate(root):
    directory = root/'qa/audio-check/calibration'; directory.mkdir(parents=True, exist_ok=True)
    tone = directory/'tone-440Hz-4s.wav'
    signal = (.2*np.sin(2*np.pi*440*np.arange(RATE*4)/RATE)*32767).astype('<i2')
    with wave.open(str(tone),'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes(np.repeat(signal[:,None],2,axis=1).tobytes())
    samples = {}
    for name, filter_ in [('atempo125','atempo=1.25'),('wrongPitchControl','asetrate=60000,aresample=48000')]:
        args = [FF,'-v','error','-i',native(tone),'-vn','-af',filter_,'-ac','2','-ar','48000','-f','f32le','-']
        x = np.frombuffer(call(args),dtype='<f4').reshape(-1,2)
        samples[name] = {'frequencyHz':peak_frequency(x),'seconds':len(x)/RATE,'filter':filter_, 'command':args}
    correct, wrong = samples['atempo125'],samples['wrongPitchControl']
    result = {'method':'Known 440Hz tone through real installed atempo; wrong-pitch speedup is a negative control.',
              'inputHz':440,'inputSeconds':4,'expectedOutputSeconds':3.2,'frequencyToleranceHz':1,'durationToleranceSeconds':.020,
              'results':samples,'pitchPreserved':abs(correct['frequencyHz']-440)<=1,
              'durationRetimed':abs(correct['seconds']-3.2)<=.020,
              'wrongPitchControlRejected':abs(wrong['frequencyHz']-440)>50,
              'humanListening':False}
    result['passed'] = result['pitchPreserved'] and result['durationRetimed'] and result['wrongPitchControlRejected']
    save(root/'qa/audio-pitch-calibration.json',result)
    return result


def pcm_metadata(filename):
    p = probe(filename); a = p['streams'][0]
    return {'codec':a['codec_name'],'sampleRate':int(a['sample_rate']),'channels':a['channels'],
            'seconds':float(p['format']['duration'])}


def check_source(root, edit):
    rows = []
    for event in edit['voice']:
        rate = event.get('playbackRate',edit.get('playbackRate',1))
        if abs(rate-1.25)>1e-9:
            raise RuntimeError('Expected explicit 1.25 playbackRate: '+event['id'])
        duration = event.get('duration',(event['sourceOut']-event['sourceIn'])/rate)
        baseline, command = original_excerpt(edit['archive'],event,rate)
        raw_path = root/'media/voice-raw'/(event['id']+'.wav')
        voice_path = root/'media/voice'/(event['id']+'.wav')
        raw, voice = decode(raw_path),decode(voice_path)
        tail = max(0,duration-len(raw)/RATE)
        baseline_m = metrics(baseline)
        raw_m = metrics(raw)
        voice_m = metrics(voice,right=.020+tail)
        raw_corr = similarity(baseline,raw)
        voice_corr = similarity(raw,voice,trim=.030+tail)
        raw_meta, voice_meta = pcm_metadata(raw_path),pcm_metadata(voice_path)
        checks = {
            'rawMetadata':raw_meta['sampleRate']==RATE and raw_meta['channels']==2 and raw_meta['codec'].startswith('pcm_'),
            'voiceMetadata':voice_meta['sampleRate']==RATE and voice_meta['channels']==2 and voice_meta['codec'].startswith('pcm_'),
            'targetDuration':abs(len(voice)/RATE-duration)<=2/RATE,
            'rawTempoDuration':abs(len(raw)/RATE-duration)<=.040,
            'rawNoNewInternalHoles':raw_m['internalHoleCount']<=baseline_m['internalHoleCount'],
            'processedNoNewInternalHoles':voice_m['internalHoleCount']<=raw_m['internalHoleCount'],
            'rawMatchesIndependentAtTempo':raw_corr['normalizedCorrelation'] is not None and raw_corr['normalizedCorrelation']>=.985 and abs(raw_corr['lagMs'])<=2,
            'processedCorePreserved':voice_corr['normalizedCorrelation'] is not None and voice_corr['normalizedCorrelation']>=.985 and abs(voice_corr['lagMs'])<=2,
            'edgeSamplesFaded':voice_m['firstSampleMax']<=.003 and voice_m['lastSampleMax']<=.003,
        }
        row = {'id':event['id'],'sourceIn':event['sourceIn'],'sourceOut':event['sourceOut'],'outputStart':event['start'],
               'playbackRate':rate,'targetDuration':duration,'baselineCommand':command,
               'rawFile':str(raw_path),'rawSha256':digest(raw_path),'voiceFile':str(voice_path),'voiceSha256':digest(voice_path),
               'sourceBaseline':baseline_m,'raw':raw_m,'processed':voice_m,'rawMetadata':raw_meta,'voiceMetadata':voice_meta,
               'rawVsIndependentAtTempo':raw_corr,'processedVsRaw':voice_corr,'tailPaddingSeconds':tail,
               'checks':checks,'passed':all(checks.values())}
        rows.append(row)
        print(json.dumps({'voice':event['id'],'passed':row['passed'],'failed':[k for k,v in checks.items() if not v],
                          'holes':[baseline_m['internalHoleCount'],raw_m['internalHoleCount'],voice_m['internalHoleCount']],
                          'baselineCorrelation':raw_corr['normalizedCorrelation']},ensure_ascii=False),flush=True)
    return rows


def check_final(root, edit, plans):
    rows = []
    for plan in plans:
        for variant in ['voice-only','reference']:
            folder = root/plan
            pcm_path = folder/'media'/(variant+'-mix.wav')
            video_path = folder/'videos'/(plan+'-'+variant+'.mp4')
            before = digest(video_path)
            pcm, decoded = decode(pcm_path),decode(video_path)
            global_corr = similarity(pcm,decoded)
            checks = []
            for event in edit['voice']:
                duration = event.get('duration',(event['sourceOut']-event['sourceIn'])/event.get('playbackRate',1.25))
                lo, hi = round(event['start']*RATE),round((event['start']+duration)*RATE)
                a,b = pcm[lo:hi],decoded[lo:hi]
                corr = similarity(a,b)
                drops = dropout_check(a,b)
                ok = corr['normalizedCorrelation'] is not None and corr['normalizedCorrelation']>=.94 and abs(corr['lagMs'])<=2 and drops['unexpectedDropoutCount']==0
                checks.append({'id':event['id'],'correlation':corr,'unexpectedEnergyDropouts':drops,'passed':ok})
            result = {'plan':plan,'variant':variant,'pcmFile':str(pcm_path),'pcmSha256':digest(pcm_path),
                      'videoFile':str(video_path),'videoSha256':before,'decodedAudioFrames':len(decoded),
                      'videoPassedToModel':False,'globalCorrelation':global_corr,'cues':checks,
                      'inputsUnchanged':digest(video_path)==before}
            result['passed'] = all(c['passed'] for c in checks) and result['inputsUnchanged'] and global_corr['normalizedCorrelation']>=.94
            rows.append(result)
            print(json.dumps({'final':plan+'/'+variant,'passed':result['passed'],
                              'minimumCueCorrelation':min(c['correlation']['normalizedCorrelation'] for c in checks),
                              'unexpectedDropouts':sum(c['unexpectedEnergyDropouts']['unexpectedDropoutCount'] for c in checks)},ensure_ascii=False),flush=True)
    return rows


def main():
    parser=argparse.ArgumentParser(); parser.add_argument('root'); parser.add_argument('--skip-final',action='store_true')
    parser.add_argument('--calibrate-only',action='store_true'); parser.add_argument('--plans',default='a-baibai')
    args=parser.parse_args(); root=Path(args.root).resolve()
    name='audio-pitch-calibration.json' if args.calibrate_only else 'audio-waveform-source-check.json' if args.skip_final else 'audio-waveform-check.json'
    report={'status':'RUNNING','method':'Independent original audio decode, tone pitch controls, 2ms internal-hole checks and final AAC waveform/energy comparison.',
            'sampleRate':RATE,'videoOrImagesSubmittedToAI':False,'humanListening':False,'asrUsedAsAudioQualityGate':False,
            'plansRequested':args.plans.split(','),'checks':{}}
    try:
        report['pitchCalibration']=calibrate(root)
        if args.calibrate_only:
            print(json.dumps({'status':'PASS_PITCH_CALIBRATION' if report['pitchCalibration']['passed'] else 'FAIL'}))
            return 0 if report['pitchCalibration']['passed'] else 1
        manifest=root/'edit-manifest.json'; before=digest(manifest); edit=json.loads(manifest.read_text())
        report['manifestSha256']=before; report['sourceArchive']=edit['archive']
        report['sourceArchiveSha256']=digest(edit['archive'])
        report['sourceArchiveSha256Recorded']=edit.get('archiveSha256')
        report['expectedVoiceCount']=len(edit['voice'])
        report['sourceChecks']=check_source(root,edit)
        report['finalChecks']=[] if args.skip_final else check_final(root,edit,args.plans.split(','))
        report['finalAACStatus']='NOT_RUN' if args.skip_final else 'CHECKED'
        report['checks']={'tonePitchAndNegativeControl':report['pitchCalibration']['passed'],
                          'allVoiceChecks':len(report['sourceChecks'])==report['expectedVoiceCount'] and report['expectedVoiceCount']>0 and all(r['passed'] for r in report['sourceChecks']),
                          'originalArchiveHash':report['sourceArchiveSha256']==report['sourceArchiveSha256Recorded'],
                          'manifestUnchanged':digest(manifest)==before}
        if not args.skip_final:
            report['checks']['finalAAC']=all(r['passed'] for r in report['finalChecks'])
        old_clip=root/'qa/audio-check/negative-control-old-pad.wav'
        if not old_clip.exists():
            old_clip=root/'research/teaser-promise-aligned.wav'
        if old_clip.exists():
            negative=metrics(decode(old_clip),left=.020,right=.020)
            report['oldInsertedHoleNegativeControl']={'file':str(old_clip),'sha256':digest(old_clip),
              'metrics':negative,'rejected':negative['internalHoleCount']>0,
              'knownSourceWordHole':6532.6735}
            report['checks']['oldInsertedHoleNegativeControlRejected']=negative['internalHoleCount']>0
        old=root/'research/AUDIO-DIAGNOSTIC-SUMMARY.json'
        if old.exists():
            incident=json.loads(old.read_text()); report['priorIncident']={'evidenceSha256':digest(old),'counts':incident['counts'],
              'knownWordHole':'V4 hard async correction inserted an approximately 8ms zero hole at source6532.6735 within the earlier ASR 後日 interval. Whole-window ASR/correlation previously missed this short defect.'}
        report['passed']=all(report['checks'].values())
        report['status']=('PASS_PITCH_CONTINUITY_SOURCE' if args.skip_final else 'PASS_PITCH_CONTINUITY_FINAL') if report['passed'] else 'FAIL'
        report['limitations']=['This verifies digital continuity and the atempo pitch contract; it does not guarantee subjective audio quality.',
          'Existing source recording transients remain possible. Short edge fades prevent sample jumps but do not prove linguistic word completeness.',
          'ASR and human listening are separate checks. No video frame or character image is read by a model.']
        save(root/'qa'/name,report)
        print(json.dumps({'status':report['status'],'checks':report['checks'],'output':str(root/'qa'/name)}))
        return 0 if report['passed'] else 1
    except Exception as error:
        report['status']='FAIL'; report['error']=str(error); save(root/'qa'/name,report)
        print(json.dumps({'status':'FAIL','error':str(error)}),file=sys.stderr)
        return 1


if __name__=='__main__':
    sys.exit(main())
