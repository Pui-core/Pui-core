import fs from 'node:fs';
import {file,np,EC,run,digest,save} from './native.mjs';
const project=file('projects/truthorlie-vertical-v5.ecproj');const output=file('media/picture-v5.mov');if(fs.existsSync(output))throw Error('Existing picture; use a new revision.');
const result=await run(EC,['--project',np(project),'render','--comp','Truth or Lie vertical fictional duel v5','--out',np(output),'--format','prores','--prores','4444','--audio','off','--progress','--json'],'ec-v5-render.json');save('qa/ec-v5-picture-binding.json',{projectSha256:await digest(project),pictureSha256:await digest(output),stdout:result.stdout,exit:result.exit});console.log('Native video picture rendered.');
