const {chromium}=require('/home/pui/tmp/jpcert-ui-20261022/node_modules/playwright');
const fs=require('fs'),crypto=require('crypto'),path=require('path');
(async()=>{
 const root=process.argv[2],duration=Number(process.argv[3]||8000),source='/mnt/f/dev/_scate_ssh_work/scate_run/scate.html';
 const sourceSha=crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
 const cleanEnv={...process.env};for(const k of ['DISPLAY','WAYLAND_DISPLAY','DBUS_SESSION_BUS_ADDRESS','XAUTHORITY'])delete cleanEnv[k]; const browser=await chromium.launch({headless:true,env:cleanEnv,executablePath:'/home/pui/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:root,size:{width:1280,height:720}},deviceScaleFactor:1});
 const videoCreatedAt=Date.now(); const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('file://'+source);console.log('opened game');await page.waitForTimeout(500);await page.screenshot({path:path.join(root,'title.png'),timeout:5000}).catch(e=>console.log('title screenshot failed',String(e)));
 await page.keyboard.press('Enter');const start=Date.now();const events=[];let held={ArrowDown:false,ArrowLeft:false,ArrowRight:false},runs=[],runStart=Date.now(),lastMode='running',maxScore=0,maxSpeed=0,passed=new Set();
 const hold=async(k,v)=>{if(held[k]===v)return;held[k]=v;await page.keyboard[v?'down':'up'](k);events.push({t:(Date.now()-start)/1000,key:k,down:v});};
 while(Date.now()-start<duration){
  const t=(Date.now()-start)/1000;
  const s=await page.evaluate(()=>({mode:state.mode,x:state.playerX,y:state.playerY,vy:state.velocityY,speed:state.speed,score:state.score,combo:state.combo,distance:state.distance,h:state.hazards.filter(h=>!h.passed&&!h.collected).map(h=>({x:h.x,w:h.spec.width,type:h.type,passed:h.passed}))}));
  events.push({t,event:'state',state:s});maxScore=Math.max(maxScore,s.score);maxSpeed=Math.max(maxSpeed,s.speed);
  if(s.mode==='crashed'){
   if(lastMode!=='crashed'){runs.push({start:(runStart-start)/1000,end:t,duration:(Date.now()-runStart)/1000,score:s.score});events.push({t,event:'crash',state:s});}
   for(const k of Object.keys(held))await hold(k,false);
   await page.waitForTimeout(450);await page.keyboard.press('Enter');runStart=Date.now();lastMode='running';continue;
  }
  const h=s.h.filter(h=>h.type!=='spark'&&h.x+h.w>s.x).sort((a,b)=>a.x-b.x)[0];
  const entry=h?(h.x-(s.x+54))/s.speed:Infinity;
  const exit=h?(h.x+h.w-s.x)/s.speed:Infinity;
  const slide=h&&h.type==='sign'&&entry<.42&&exit>-.03;
  await hold('ArrowDown',!!slide);
  // Use normal controls only: manage boost/brake and jump from read-only world observations.
  const brake=t>=14&&((s.y>1&&s.vy<0&&h&&h.type!=='sign'&&entry<.32)||(h&&h.type!=='sign'&&s.y<=1&&entry<.38));
  await hold('ArrowLeft',!!brake);
  const boost=t<14 ? true : !brake&&!slide&&(t%12<6)&&(!h||entry>.50||s.y>80);
  await hold('ArrowRight',!!boost);
  if(h&&h.type!=='sign'&&s.y<=1&&entry<.19&&exit>0){await page.keyboard.press('ArrowUp');events.push({t,event:'jump',hazard:h.type,entry,speed:s.speed});}
  if(Math.abs(t-10)<.035||Math.abs(t-20)<.035||Math.abs(t-40)<.035)await page.screenshot({path:path.join(root,'play-'+Math.floor(t)+'.png')});
  await page.waitForTimeout(12);lastMode=s.mode;
 }
 runs.push({start:(runStart-start)/1000,end:(Date.now()-start)/1000,duration:(Date.now()-runStart)/1000});
 const last=await page.evaluate(()=>({mode:state.mode,score:state.score,combo:state.combo,speed:state.speed,distance:state.distance}));
 await page.screenshot({path:path.join(root,'last.png')});for(const k of Object.keys(held))await hold(k,false);
 const raw=await page.video().path();await context.close();await browser.close();
 const report={recordingFps:25,finalConformFps:30,videoCreatedAt,gameStartAt:start,gameStartVideoOffsetApprox:(start-videoCreatedAt)/1000,videoOffsetUncertaintySeconds:.15,originalGameAudio:false,source,sourceSha256:sourceSha,sourceUnmodified:sourceSha===crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),viewport:{width:1280,height:720},recording:raw,inputs:'Playwright keyboard only; state/hazards read-only, no game state mutation',runs,longestRun:Math.max(...runs.map(x=>x.duration)),maxScore,maxSpeed,last,pageErrors:errors,events};
 fs.writeFileSync(path.join(root,'capture-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({recording:raw,longestRun:report.longestRun,runs:report.runs,maxScore,maxSpeed,errors}));
})().catch(e=>{console.error(e);process.exit(1)});
