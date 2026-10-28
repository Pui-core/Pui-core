import fs from 'node:fs';
import zlib from 'node:zlib';
// Read-only pixel measurement of the actual captured PNG. No image generation
// or frame changes. The teal palette belongs to the shipped traveler sprite.
export function observeTraveler(p){
 const b=fs.readFileSync(p);let width,height,depth,type,parts=[];
 for(let o=8;o<b.length;){const n=b.readUInt32BE(o),id=b.toString('ascii',o+4,o+8),d=b.subarray(o+8,o+8+n);if(id==='IHDR'){width=d.readUInt32BE(0);height=d.readUInt32BE(4);depth=d[8];type=d[9];}if(id==='IDAT')parts.push(d);o+=n+12;}
 if(depth!==8||![2,6].includes(type))throw Error('Expected actual RGB8/RGBA8 frame');
 const channels=type===6?4:3,stride=width*channels,raw=zlib.inflateSync(Buffer.concat(parts)),pixels=Buffer.alloc(height*stride);let cursor=0;
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){const filter=raw[cursor++];for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=channels?pixels[i-channels]:0,up=y?pixels[i-stride]:0,corner=y&&x>=channels?pixels[i-stride-channels]:0;pixels[i]=(raw[cursor++]+(filter===0?0:filter===1?a:filter===2?up:filter===3?Math.floor((a+up)/2):filter===4?paeth(a,up,corner):NaN))&255;}}
 const palette=new Set([0x419d9e,0x6ab7ac,0x226574,0x2c858b]),points=[],buckets=new Map();
 for(let y=84;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*channels,rgb=(pixels[i]<<16)|(pixels[i+1]<<8)|pixels[i+2];if(palette.has(rgb)){points.push([x,y]);const key=Math.floor(x/80)+','+Math.floor(y/80);buckets.set(key,(buckets.get(key)||0)+1);}}
 if(points.length<4)return {found:false,reason:'No sufficient exact traveler palette',width,height};
 let best=null,score=-1;
 for(const key of buckets.keys()){const [x,y]=key.split(',').map(Number);let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)n+=buckets.get((x+dx)+','+(y+dy))||0;if(n>score){score=n;best=[x*80+40,y*80+40];}}
 const cluster=points.filter(([x,y])=>Math.abs(x-best[0])<110&&Math.abs(y-best[1])<110),xs=cluster.map(p=>p[0]),ys=cluster.map(p=>p[1]);
 return {found:true,center:[cluster.reduce((a,p)=>a+p[0],0)/cluster.length,cluster.reduce((a,p)=>a+p[1],0)/cluster.length],bounds:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)],palettePixels:cluster.length,totalPalettePixels:points.length,width,height,method:'Exact native sprite palette cluster; requires visual confirmation'};
}
