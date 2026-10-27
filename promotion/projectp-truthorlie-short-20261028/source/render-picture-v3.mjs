import fs from 'node:fs';
import {file,np,EC,run,digest,save} from './native.mjs';
const project=file('projects/truthorlie-vertical-v3.ecproj');const output=file('media/picture-v3.mov');if(fs.existsSync(output))throw Error('Existing picture; use a new revision.');
const result=await run(EC,['--project',np(project),'render','--comp','Truth or Lie vertical fictional duel v3','--out',np(output),'--format','prores','--prores','4444','--audio','off','--progress','--json'],'ec-v3-render.json');save('qa/ec-v3-picture-binding.json',{projectSha256:await digest(project),pictureSha256:await digest(output),stdout:result.stdout,exit:result.exit});console.log('Native video picture rendered.');
