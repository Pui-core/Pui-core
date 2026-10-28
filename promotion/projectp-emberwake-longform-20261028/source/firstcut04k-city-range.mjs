import fs from 'node:fs';
import { file, np, FF, run, save } from './native.mjs';
const episodes=[3,5,13], sheets=[];
for(const episode of episodes){
 const input=file(`media/ep${String(episode).padStart(2,'0')}-game.mp4`), out=file(`qa/firstcut04k-city-range-ep${episode}.png`);
 if(fs.existsSync(out))throw new Error('Preserve existing image');
 await run(FF,['-v','error','-ss','10','-i',np(input),'-vf','fps=1/10,scale=480:270:flags=area,tile=5x1:nb_frames=5:padding=2','-frames:v','1','-threads','1',np(out)],`firstcut04k-city-range-ep${episode}.json`);
 sheets.push({episode,file:out,seconds:[10,20,30,40,50]});
}
save('qa/firstcut04k-city-range.json',{sheets,inspection:[],sampling:'Five candidate source times per episode, not a complete recording review'});
