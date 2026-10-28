import {file,np,FF,run,save,hash} from './native.mjs';
const duration=404/30;
// Source begins just before the piano onset; all words retain their original gain.
await run(FF,['-hide_banner','-v','warning','-y','-i',np(file('media/narration-story05-kurono.wav')),'-i',np(file('media/PerituneMaterial_Daybreak.mp3')),
 '-filter_complex',`[0:a]volume=1.35,asplit=2[voice][key];[1:a]atrim=start=0.510:duration=${duration},asetpts=PTS-STARTPTS,volume=0.24,afade=t=in:st=0:d=0.04,afade=t=out:st=${duration-.36}:d=0.36[music];[music][key]sidechaincompress=threshold=.025:ratio=3:attack=15:release=200[duck];[voice][duck]amix=inputs=2:normalize=0:duration=first,alimiter=limit=.89:level=false,apad,atrim=duration=${duration}[mix]`,
 '-map','[mix]','-ar','48000','-c:a','pcm_s24le',np(file('media/mix-story05-kurono-daybreak.wav'))],'story05-kurono-mix-render.json');
await run(FF,['-hide_banner','-v','info','-i',np(file('media/mix-story05-kurono-daybreak.wav')),'-af','ebur128=peak=true','-f','null','-'],'story05-kurono-mix-ebur128.json');
save('qa/story05-kurono-audio-binding.json',{duration,voice:'media/narration-story05-kurono.wav',voiceSha256:hash(file('media/narration-story05-kurono.wav')),bgm:'media/PerituneMaterial_Daybreak.mp3',bgmSha256:hash(file('media/PerituneMaterial_Daybreak.mp3')),mixSha256:hash(file('media/mix-story05-kurono-daybreak.wav')),bgmStart:.510,bpm:125,nominalBeat:.48,wholeSubjectiveListen:false,credit:'Daybreak / PeriTune（むつき醒） https://peritune.com/blog/2015/11/07/daybreak/'});
console.log('Daybreak mix produced; encoded-video loudness still requires verification.');
