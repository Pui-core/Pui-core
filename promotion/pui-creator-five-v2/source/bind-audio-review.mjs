import fs from'node:fs';import{file,hash,save}from'./native.mjs';
const q=JSON.parse(fs.readFileSync(file('qa/independent-visual-v2.json'),'utf8'));save('research/qa-history-before-audio-revision-visual.json',q);
for(const id of['01','05']){const v=q.currentFinalReviews.find(v=>v.episode===id),stem=v.slug,r=JSON.parse(fs.readFileSync(file('qa/'+stem+'/rendered.json'),'utf8')),p=JSON.parse(fs.readFileSync(file('qa/'+stem+'/audio-revision.json'),'utf8')),t=JSON.parse(fs.readFileSync(file('qa/'+stem+'/technical.json'),'utf8'));
 if(!p.pictureStreamIdentical||p.previousPictureStreamSha256!==p.newPictureStreamSha256||p.videoSha256!==r.sha256||![p.previousVideoSha256,p.videoSha256].includes(v.videoSha256))throw Error('Image review cannot carry forward '+id);
 for(const im of v.images)if(hash(im.path)!==im.sha256)throw Error('Reviewed image changed '+im.path);
 v.previousImageReviewedVideoSha256=p.previousVideoSha256;v.videoSha256=r.sha256;v.effectcraftSha256=r.ecSha256;v.filmcraftSha256=r.fcSha256;v.audioSha256=r.audioSha256;v.audioRevisionVisualContinuity={method:'H264 elementary stream SHA-256 identical; previous independently reviewed pixels retained without re-encoding',old:p.previousPictureStreamSha256,current:p.newPictureStreamSha256};
 if(id==='05'){v.observations=v.observations.filter(s=>!s.includes('fade in')&&!s.includes('音だけを再export')&&!s.includes('3.4秒ずつ'));v.observations.push('A/Bは3.4秒の同じ主区間と、双方同じ語尾のpost-roll。音の修正に伴う映像変更はない。');}
 v.observations.push('音声修正後も旧版とH264映像ストリームが完全一致。既存の独立画像レビューをこの同一性の検証で継続する。音の検査はindependent-fade-fix.jsonへ分離。');
 t.visualReview='PASS_WITHIN_FINAL_EXTRACTED_IMAGE_SCOPE';t.visualReviewVideoSha256=r.sha256;t.visualReviewEvidence='Independent image review carried forward by identical picture stream; qa/'+stem+'/audio-revision.json';t.visualReviewCoverage=v.coverage;save('qa/'+stem+'/technical.json',t);
}
q.audioRevisionScope='01/05 changed audio only. Root verified identical H264 streams and all prior reviewed image hashes; visual evidence continued mechanically. No new direct audio audition claimed.';save('qa/independent-visual-v2.json',q);console.log('Image reviews retained by exact picture-stream identity');
