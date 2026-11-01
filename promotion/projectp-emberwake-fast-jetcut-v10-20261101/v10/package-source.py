import pathlib,json,hashlib,subprocess
R=pathlib.Path(__file__).parent;CASE=R.parent;V8=CASE/'v08';V9=CASE/'v09';R2=R/'r2'
WT=pathlib.Path('C:/Users/pui/.claude/worktrees/Pui-core-issue-156-fast-jetcut-v10');D=WT/'promotion/projectp-emberwake-fast-jetcut-v10-20261101';G='C:/Program Files/Git/cmd/git.exe';BASE='7719ae6e210713a5330dde59b2cb15bba52b6bf3'
def sha(f):return hashlib.sha256(pathlib.Path(f).read_bytes()).hexdigest()
def put(name,value):
 f=D/name;f.parent.mkdir(parents=True,exist_ok=True);data=(json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode('utf8') if not isinstance(value,str) else (value.rstrip()+'\n').encode('utf8')
 with f.open('xb') as w:w.write(data)
def cp(src,name):
 src=pathlib.Path(src);dest=D/name;dest.parent.mkdir(parents=True,exist_ok=True)
 with dest.open('xb') as w:w.write(src.read_bytes())
 assert sha(dest)==sha(src)
def walk(x):
 if isinstance(x,dict):
  for k,v in x.items():
   if k.lower() in ['path','filepath','file_path'] and isinstance(v,str):yield v
   yield from walk(v)
 elif isinstance(x,list):
  for v in x:yield from walk(v)
if __name__=='__main__':
 assert not D.exists() and subprocess.check_output([G,'-C',str(WT),'rev-parse','HEAD']).decode().strip()==BASE
 assert not subprocess.check_output([G,'-C',str(WT),'status','--porcelain']).strip();D.mkdir(parents=True)
 put('.gitattributes','* -text whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol')
 final=json.loads((R2/'qa/final-delivery.json').read_text(encoding='utf8'));preview=json.loads((R/'qa/preview-delivery.json').read_text(encoding='utf8'));voice=json.loads((R2/'qa/voice-binding.json').read_text(encoding='utf8'))
 assert sha(final['final'])==final['sha256'] and sha(preview['final'])==preview['sha256']
 # New prefix only; old merged v07/v08/v09 bytes and native projects remain unchanged.
 for root,relative in [(R,'v10'),(R2,'v10/r2')]:
  for f in root.glob('*.py'):cp(f,relative+'/'+f.name)
  for f in (root/'source').iterdir():
   if f.is_file():cp(f,relative+'/source/'+f.name)
  for f in (root/'projects').iterdir():
   if f.is_file() and f.suffix in ['.pcraft','.ecproj','.fcproj']:cp(f,relative+'/projects/'+f.name)
  for f in (root/'media').glob('*.png'):cp(f,relative+'/media/'+f.name)
  for f in (root/'frames').glob('*.png'):cp(f,relative+'/frames/'+f.name)
  for f in (root/'qa').iterdir():
   if not f.is_file() or f.name.startswith('v10-') or f.name.startswith('report-') or f.suffix not in ['.json','.png']:continue
   cp(f,relative+'/qa/'+f.name)
 # Renderer helper is a dependency of native JSX generation; preserve exact current bytes.
 cp(CASE/'v07/source-v07.jsx','v07/source-v07.jsx')
 manifests={};projects=[]
 for root in [R,R2]:
  for f in (root/'projects').iterdir():
   if not f.is_file() or f.suffix not in ['.pcraft','.ecproj','.fcproj']:continue
   projects.append({'path':f.as_posix(),'sha256':sha(f),'bytes':f.stat().st_size})
   if f.suffix=='.pcraft':continue
   for name in walk(json.loads(f.read_text(encoding='utf8'))):
    p=pathlib.Path(name);assert p.is_file(),name
    manifests[p.as_posix()]={'path':p.as_posix(),'sha256':sha(p),'bytes':p.stat().st_size}
 for p in [pathlib.Path(final['final']),pathlib.Path(preview['final']),V9/'videos/emberwake-v09-narrated-intro45-r2.mp4',R/'videos/emberwake-v10-whole.mp4']:
  manifests[p.as_posix()]={'path':p.as_posix(),'sha256':sha(p),'bytes':p.stat().st_size}
 put('依存manifest.json',{'caseRoot':CASE.as_posix(),'media':list(manifests.values()),'nativeProjects':projects,'cloneAloneStandalone':False,'note':'大raw/ProRes/WAV/MP4は私有絶対参照。clone単独に全素材はない。実物参照先のbytes/SHAで照合する。旧v10 1.30通し版は修正指示前に書出し済みで保全するが現用稿ではない。'})
 pre=json.loads((V8/'circuit-capture01/preflight.json').read_text(encoding='utf8'))
 for f in pre['coreFiles']:assert sha(V8/'circuit-capture01/product'/f['file'])==f['sha256']
 reuse=[]
 for name in ['preflight.json','launch.json','capture.json']:
  repo='promotion/projectp-emberwake-design-v08-20261101/v08/circuit-capture01/'+name;f=V8/'circuit-capture01'/name
  assert subprocess.check_output([G,'-C',str(WT),'show',BASE+':'+repo])==f.read_bytes()
  reuse.append({'repoFile':repo,'commit':BASE,'privateFile':f.as_posix(),'sha256':sha(f),'bytes':f.stat().st_size})
 raw=V8/'circuit-capture01/capture.avi';assert sha(raw)=='eaf9331496850d6cf86d885d8cff48a0cd45ea95b040b0fdd17c59024d31c5b3'
 put('収録binding.json',{'source':'71584a6bd0c8852885157de71032fd9252e7a04c','version':'0.12.0','scene':'res://scenes/campaign.tscn','mode':'物語 / practice','evidence':reuse,'originalCoreFilesUnchanged':len(pre['coreFiles']),'coreChanged':[],'ordinaryProcessInputAutomation':True,'independentProfile':True,'newV10Capture':False,'inputStateSetters':False,'backgroundSharedInput':0,'raw':{'path':raw.as_posix(),'bytes':raw.stat().st_size,'sha256':sha(raw)},'notes':['原callback1112 / movie1113f、描画実1440x810。旧source票の差異を保持。','switch1/body3:6 collision000→111後route8着地。落下0/クリア0/completed[1]。']})
 pin=json.loads((V8/'code-pin.json').read_text(encoding='utf8'));pin['quotes']=pin['quotes'][:3];pin['quotes'][0]['displayFragment']='switch_lit.has(group)';pin['quotes'][1]['displayFragment']='1 if on else 0'
 world=V8/'circuit-capture01/product/scripts/campaign/world.gd';lines=world.read_text(encoding='utf8').splitlines()
 for q in pin['quotes']:
  assert sha(world)==q['fullFileSha256'];assert '\n'.join(lines[q['lineStart']-1:q['lineEnd']])==q['exactUtf8'];assert q['displayFragment'] in q['exactUtf8'];q['displayFragmentSha256']=hashlib.sha256(q['displayFragment'].encode()).hexdigest()
 pin['context']=[{'lineStart':34,'lineEnd':40,'exactUtf8':'\n'.join(lines[33:40])},{'lineStart':71,'lineEnd':77,'exactUtf8':'\n'.join(lines[70:77])}];pin['contextNote']='L73配線/L76輪郭/L77刻印色/L38collisionは別処理。短い色式で全機構を実装すると説明しない。';put('code-pin.json',pin)
 observations=[]
 for name,title,vid,published,views,scope in [('candidate1','I weaponized cubes','Be4R4eYod6Y','2026-02-02T04:31:18-08:00',2989013,'0,1,2,3,5,8,12,16,20,24,28,31秒の画を標本確認。0秒黒画はseek/decodeの可能性を残し導入と断定しない。'),('candidate2','This took 49,000 attempts','2kSrmtXhwjE','2026-08-25T22:37:50+09:00',12331559,'0,1,2,3,5,8,12,16,20,24,28,31,40,48,54,58秒の画を標本確認。')]:
  rec=json.loads((R/f'references/{name}-headless-observation.json').read_text(encoding='utf8'));screens=[]
  for f in (R/'references').glob(name+'-frame-*.png'):screens.append({'privatePath':f.as_posix(),'sha256':sha(f),'bytes':f.stat().st_size})
  observations.append({'url':'https://www.youtube.com/shorts/'+vid,'watchURL':'https://www.youtube.com/watch?v='+vid,'author':'Pancak3s','title':title,'publishedPrimary':published,'viewCountSingleObservation':views,'checkedAt':rec['startedAtUtc'],'scope':scope,'audioHeard':False,'wholeRealtimeWatch':False,'method':'独立headless Edgeの通常公開player、ログイン/既存cookie無し、ミュート、所有browser終了','screensPrivate':screens})
 put('参考公開確認.json',{'examples':observations,'noGrowthRateClaim':True,'bodyDownloadOrRefusalBypass':False,'audioCadenceMeasured':False,'note':'メタデータだけの分析ではなく上記標本画を実見。句間の秒数/話速/正確なcut時刻は未測定。別作品の台詞/声/画像を本稿へ転載しない。原player JSON/HTMLの署名URLやtrackingはSourceへ含めない。'})
 put('CAMPFIRE-binding.json',{'url':'https://camp-fire.jp/projects/993744/view','projectId':'993744','title':'EMBERWAKE / 灰の灯｜ただ登るだけのゲームに「登る理由」を。','author':'ProjectP（ぷぃ）','checkedDate':'2026-11-01 JST','method':'公開canonicalページのweb open、表題・作者・募集残日数表示/支援導線を確認','claim':'CAMPFIREで制作支援を募集中','visualRoute':'CAMPFIREで「EMBERWAKE」を検索','profileLinkVerified':False,'moneyDatesRewardsReleaseClaimsInVideo':False,'campaignEdited':False,'donation':False})
 put('README.md',f'''# 宣伝156：読み上げ1.20倍・ジェットカットとCAMPFIRE告知 v10-r2

現用は33.9秒の編集修正稿。ownerの「1.2倍ぐらい」「CAMPFIRE告知」を反映。旧v09-r2/提示済み15秒1.30版/その原本を全て保持する。同じcreativeのテンポと導線修正であり、新ゲーム機能や新収録ではない。

- MP4：`{final['final']}`
- SHA256 `{final['sha256']}` / {final['bytes']}bytes / 1017f・映像33.900s・1080×1920/30fps/H264/AAC stereo。
- 先出し15秒：`{preview['final']}` / `{preview['sha256']}` / {preview['bytes']}bytes。ownerリンクのbytes保全。
- 実音声：VOICEVOX:玄野武宏、標準speaker11/engine0.25.1。v09 speedScale1.02→1.224、相対1.20。本人/Hytacka声再現なし。1.30版1.326は旧比較稿。
- v09の281文字→本文225文字。新CTAは別追加。句間0.12→0.04秒、pre/post0.055/0.14→0.025/0.045。冗長説明と待ちを削るが有声語頭尾は保持。
- 約0〜5.77秒は実E→足場→着地と問い。16.33〜20.73秒は部分式を約2.2秒ずつ。29.633〜33.9秒はCAMPFIRE告知。短い実コードと実画面の対応は維持し、作者の過去の意図を捏造しない。
- 既renderの無音ProResをFilmCraftで原速再利用。読了分は場面末尾の約0.1〜0.53秒静止で補い、操作や跳躍を遅くしない。動作中の語句を切らず、新CTAのみPhotoCraft/EffectCraftで制作した。

3Craft原本は`v10/projects/`と`v10/r2/projects/`。最終編集は`v10/r2/projects/fast12-campfire.fcproj`、追加場面は`campfire.ecproj`/`campfire.pcraft`。再利用元の新v10コード抜粋PCと全体EC/仮編集FCも収録。大mediaは私有caseの参照でclone単独は再生素材完備ではない。`依存manifest.json`の実参照先SHAと`収録binding.json`を照合する。

全AVdecode、10句のL/R別語頭末尾40照合、切替/着地連続画像、320px抽出の検査は対象SHAへ結ぶ。数字/画像検査を主観実聴・実時間通し視聴・実機mobile・独立QA・owner創作採用へ昇格しない。CAMPFIRE993744は公開正本で募集案内を確認。プロフィール導線/支援額/残日数/リターン/提供時期/Steam通過は動画で述べない。

新BGM/ゲーム音/編集SE無し。NAS/投稿/予約/lease/claim/cronはRoot専管で未操作。独立Reviewerへの依頼・受入と必要納品もRootが行う。65秒広告や600秒以上の横本編をこの短稿で完成扱いにしない。
''')
 rows=['# 宣伝156：台本・shot・変更対応 v10-r2','', '作者の直接発言ではなく、現在の実装に基づく編集解説。時刻は30fps native配置。','', '|句|開始〜終了予定|仮ナレーション|','|---|---|---|']
 for c in voice['cues']:rows.append(f"|{c['id']} {c['role']}|{round(c['at']*30)/30:.3f}〜{c['end']:.3f}s|{c['text']}|")
 rows+=['','02「そこが疑問です」、03「操作する/先に見える」、04「手掛かりをたどってから押す」、07の重複、08/09の長い言換えを削除。何を変えるかの問い→判断材料→状態共有→実着地→未検証課題を残す。','', '元raw858付近E、861以降切替。950以降の原速区間に997takeoff/1015付近着地を含む。再掲では840→990に移動待ちをカットし、跳躍と接地を保持。約29.63秒から告知へ。正確な編集frame/hold/参照はreuse-edit-plan.json、全発声の実有声範囲はfinal-delivery.json。','', '参考1は1→2→3→5秒の立方体→輪→奥行→トンネルという段階と、8秒の配色後に実プレイの変化が続くことを画で確認。参考2は1〜5秒の短い説明表示から、8秒以降/終盤の実プレイへ進む標本を確認。前者の工程と画の対応、後者の早い実演提示を本稿の説明→実画面→結果に用いる。正確なcut数/音声速度/句間/維持率の実測根拠にはしない。制作と並行した観察で、owner指定の初稿を止めなかった。','', '参考原文/声/画/特殊な感覚フックはコピーしない。view数は別時点の累計値のみで成長率/成功理由ではない。本文全編を実時間視聴したとは言わない。']
 put('宣伝-156台本と編集差分-v10-r2.md','\n'.join(rows))
 print(json.dumps({'prefix':D.as_posix(),'files':sum(f.is_file() for f in D.rglob('*')),'dependencies':len(manifests),'sha256':final['sha256']}))
