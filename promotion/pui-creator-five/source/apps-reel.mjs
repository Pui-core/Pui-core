/**
 * One small maker story: Pui makes a tool they want to keep using.
 * Actual Glass Folders screenshots only; no reconstructed or imagined UI.
 * The earlier page and confirmation dialog use the project's synthetic QA data.
 * Provenance: glass-folders/docs/{verification,redesign-verification}.md.
 */
const current='/mnt/f/dev/glass-folders/docs/screenshots';
const earlier='/mnt/f/dev/glass-folders/docs/evidence';
const medicateHighlight='/mnt/e/Desktop/音源/medicate/MV_v3_ArtistLyrics/medicate_MV_v3_Highlight.mp4';

const shot=(a,b,source,caption,label,mode='contain',at=0)=>({
  a,b,source,at,caption,label,mode,cx:0
});

export const appsReel={
  id:'04',
  slug:'pui-makes-their-tools',
  title:'欲しいから、作る。',
  duration:21.6,
  audio:medicateHighlight,
  audioAt:0,
  shots:[
    // Open with the real, current tool rather than an explanation card.
    shot(0,82/30,current+'/redesign-popup.png',
      '欲しいから、作る。','Glass Folders / ぷいの道具'),

    // A real earlier revision makes the making visible without inventing a demo.
    shot(82/30,164/30,earlier+'/photos-page2.png',
      'まず、作ってみる。','Glass Folders / 初版の実UI'),

    // The names and destinations belong to synthetic fixtures, not personal files.
    shot(164/30,327/30,current+'/redesign-overview.png',
      '気になる所は、直す。','Glass Folders / 0.2.0の実UI'),

    // Show a real check. It does not promise that every file operation is safe.
    shot(327/30,409/30,earlier+'/collision-dialog.png',
      '触って、確かめる。','Glass Folders / 検証用データ'),

    // Return to the current object: the maker's wish is the payoff.
    shot(409/30,573/30,current+'/redesign-popup.png',
      '自分が、使いたい。','Glass Folders / ぷいの道具'),

    // Same authored music and its MV continue behind the renderer's Pui signature.
    shot(573/30,21.6,medicateHighlight,
      'ぷい、また作ってる。','次の制作も、見に来て。','end',573/30)
  ]
};
