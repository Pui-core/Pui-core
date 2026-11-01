import pathlib,json,hashlib,subprocess
R=pathlib.Path(__file__).parent;P=R.parent;WT=pathlib.Path('C:/Users/pui/.claude/worktrees/Pui-core-issue-156-fast-jetcut-v10');D=WT/'promotion/projectp-emberwake-fast-jetcut-v10-20261101';DEST=D/'v10/r3';G='C:/Program Files/Git/cmd/git.exe';BASE='702917b6ffe2edd85253808af472746c1a0ba5c7'
def sha(f):return hashlib.sha256(pathlib.Path(f).read_bytes()).hexdigest()
def put(f,value):
 data=(json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode('utf8') if not isinstance(value,str) else (value.rstrip()+'\n').encode('utf8');f.parent.mkdir(parents=True,exist_ok=True)
 with f.open('xb') as w:w.write(data)
def paths(x):
 if isinstance(x,dict):
  for k,v in x.items():
   if k.lower() in ['path','filepath','file_path'] and isinstance(v,str):yield v
   yield from paths(v)
 elif isinstance(x,list):
  for v in x:yield from paths(v)
if __name__=='__main__':
 assert not DEST.exists();assert subprocess.check_output([G,'-C',str(WT),'rev-parse','HEAD']).decode().strip()==BASE;assert not subprocess.check_output([G,'-C',str(WT),'status','--porcelain']).strip()
 DEST.mkdir(parents=True)
 for f in R.glob('*.py'):put(DEST/f.name,f.read_text(encoding='utf8'))
 for folder in ['source','projects','media','qa']:
  for f in (R/folder).iterdir():
   if not f.is_file() or f.name.startswith('v10-r3-') or f.name.startswith('report-') or f.suffix not in ['.json','.png','.fcproj','.pcraft','.ecproj','.jsx','.framemd5']:continue
   out=DEST/folder/f.name;out.parent.mkdir(parents=True,exist_ok=True)
   with out.open('xb') as w:w.write(f.read_bytes())
   assert sha(out)==sha(f)
 q=json.loads((R/'qa/final-delivery.json').read_text(encoding='utf8'));body=json.loads((R/'qa/body-preservation.json').read_text(encoding='utf8'));assert body['decodedBodyIdentical'] and sha(q['final'])==q['sha256']
 deps={};originals=[]
 for f in (R/'projects').iterdir():
  if f.suffix not in ['.pcraft','.ecproj','.fcproj']:continue
  originals.append({'path':f.as_posix(),'sha256':sha(f),'bytes':f.stat().st_size,'repo':(DEST/'projects'/f.name).relative_to(WT).as_posix()})
  if f.suffix=='.pcraft':continue
  for name in paths(json.loads(f.read_text(encoding='utf8'))):
   p=pathlib.Path(name);assert p.is_file();deps[p.as_posix()]={'path':p.as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}
 f=pathlib.Path(q['final']);deps[f.as_posix()]={'path':f.as_posix(),'bytes':f.stat().st_size,'sha256':sha(f)}
 prior=D/'依存manifest.json';assert sha(prior)=='da3df50353537c565ac20402a5900e1f3ba03eb68b8085e68060b0106c98078d'
 manifest={'version':'v10-r3 profile CTA','inheritsSourceHead':BASE,'priorManifest':{'repo':prior.relative_to(WT).as_posix(),'sha256':sha(prior)},'media':list(deps.values()),'nativeProjects':originals,'cloneAloneStandalone':False,'note':'本文元ProRes/静止/WAV9句は旧r2と同一。大mediaは私有参照。旧r2/1.30/原本は保持。ゲーム収録/code-pin/71core/参考票は上記旧headから不変継承。'}
 put(DEST/'依存manifest-profile.json',manifest)
 binding={'target':'https://camp-fire.jp/projects/993744/view','projectId':'993744','title':'EMBERWAKE / 灰の灯｜ただ登るだけのゲームに「登る理由」を。','author':'ProjectP（ぷぃ）','checkedDate':'2026-11-01 JST','canonicalStatus':'公開正本の作者/作品名/募集導線をwebで再確認。動画で額/期日/リターン/提供時期/Steam通過を述べない。','callToAction':'CAMPFIREで制作支援募集中。支援はプロフィールのリンクから。','youtubeHelp':'https://support.google.com/youtube/answer/13748639?hl=ja','helpObservation':'Shortsコメント/説明URLはクリック不可、channelプロフィールリンクはクリック可能と一次helpで確認。TikTokのリンク状態を同helpから推定しない。','actualYouTubeProfileRouteVerified':False,'actualTikTokProfileRouteVerified':False,'publicationGate':'Rootが公開時に対象アカウントの実プロフィールリンクから993744へ到達することを確認。現稿は私的previewで設定済みとの受入ではない。','profileEdited':False,'commentPosted':False,'published':False}
 put(DEST/'プロフィール導線binding.json',binding)
 put(DEST/'宣伝-156プロフィール誘導差分-v10-r3.md',f'''# 宣伝156：プロフィール誘導CTA v10-r3

owner最新「プロフィールのがいいか。そっちに誘導しよう」を同PR98へ反映。本文原速/1.20倍/コード→実画面は保持し、末尾の検索案内をプロフィール案内へ変更。

- 現用private preview：`{q['final']}`
- SHA256 `{q['sha256']}` / {q['bytes']}bytes / 映像{q['videoSeconds']}s・1008f / AAC・container {q['containerSeconds']}s。
- 29.633〜33.600秒のCTA。音声は「CAMPFIREで制作支援募集中。支援はプロフィールのリンクから。」。表示はCAMPFIRE/制作支援を募集中/EMBERWAKE/支援はプロフィールの・リンクから。
- VOICEVOX:玄野武宏標準speaker11、engine0.25.1、speedScale1.224（v09基準1.02の1.20倍）。最終1句だけ生成。前9句WAV/FilmCraft配置不変。本人声模倣/新BGM/SEなし。
- 新MP4の本文0〜888fはr2のdecoded pixelsと全889f一致。FilmCraft本文clip/first9voice clipも一致。無音本文の再renderや新captureなし。追加PhotoCraft/EffectCraftはCTAだけ。
- 全AVdecode0/stderr空。最終同SHAの10句L/R別語頭尾40check lag0/mincorr{q['minCorrelation']:.8f}/clip0。320pxでCTA入場/滞在/終端を確認。数値/画像確認を主観実聴/実時間全編/実mobileへ昇格しない。

旧r2の検索案内33.9秒稿、旧1.30版、head702917b、全原本/QAは保持。今回は原本3件のコピーをnative再読込し、この差分のmanifestを旧headへ束縛する。clone単独では大mediaは揃わず、私有参照先のbytes/SHAを照合する。

Root専管の実プロフィール設定/993744への到達受入は未確認。公開前の必須条件。現稿の制作を設定済み/創作採用/公開受入とは呼ばない。NAS/投稿/予約/コメント投稿/プロフィール編集/lease/claim/cronは未操作。独立Reviewerへの必要deltaと運用担当への導線受渡しはRootが行う。
''')
 old=(D/'README.md').read_bytes();intro=f'''# 最新：プロフィール誘導 v10-r3（私的preview）

現用稿は[プロフィール誘導差分](v10/r3/宣伝-156プロフィール誘導差分-v10-r3.md)。末尾の検索案内だけを「支援はプロフィールのリンクから」へ変更しました。実プロフィールのtarget993744への到達設定/受入はRoot未確認で、公開時の必須条件です。

MP4 `{q['final']}` / SHA256 `{q['sha256']}` / {q['bytes']}bytes / 映像33.600s・1008f。本文889f decoded完全一致、前9句WAV/配置不変。新CTA1句・PC/EC/FC原本・全最終AACのQAを追加。

今回の依存は[v10-r3 manifest](v10/r3/依存manifest-profile.json)、前版のSHA固定依存/収録/code-pinは旧head702917bから継承。全編実聴/実時間視聴/実mobile/独立QA/創作採用・公開受入は未完です。

以下は旧r2当時の納品記録をそのまま保持します。旧MP4/原本/Source/QAは改書きしません。

---

'''
 (D/'README.md').write_bytes(intro.encode('utf8')+old)
 print(json.dumps({'newFiles':sum(f.is_file() for f in DEST.rglob('*')),'privateDependencies':len(deps),'newNativeProjects':len(originals),'sha256':q['sha256']}))
