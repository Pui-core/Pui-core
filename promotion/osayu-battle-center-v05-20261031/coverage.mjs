/** Axis-aligned background under the same parent camera; dimensions are decoded metadata. */
export function backgroundCoverage(width,height,cameras,{fitToFrame=true}={}){
 if(!Number.isFinite(width)||width<=0||!Number.isFinite(height)||height<=0||!cameras.length)throw Error('INVALID_BACKGROUND_DIMENSIONS');
 const fit=fitToFrame?Math.max(1080/width,1920/height):1,worldW=width*fit,worldH=height*fit;let uncoveredFrames=0,maxExposure=0,minMargin=Infinity;
 for(const c of cameras){if(c.rotation!==0||!Number.isFinite(c.position[0])||!Number.isFinite(c.position[1])||!Number.isFinite(c.scale[0])||c.scale[0]<=0||c.scale[0]!==c.scale[1])throw Error('UNSUPPORTED_CAMERA_TRANSFORM');const k=c.scale[0]/100,left=c.position[0]-worldW*k/2,right=c.position[0]+worldW*k/2,top=c.position[1]-worldH*k/2,bottom=c.position[1]+worldH*k/2;const m=Math.min(-left,right-1080,-top,bottom-1920);minMargin=Math.min(minMargin,m);if(m < -1e-6){uncoveredFrames++;maxExposure=Math.max(maxExposure,-m);}}
 return {width,height,frames:cameras.length,fitScale:fit,uncoveredFrames,maxExposure,minMargin,covered:uncoveredFrames===0};
}
