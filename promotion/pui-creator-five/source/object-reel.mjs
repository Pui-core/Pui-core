/**
 * ObjectCreator / ぷい本人ブランド用の実作品リール。
 * 22.0s, 30fps, 7 shots. This file owns data only; renderer/episodes are unchanged.
 *
 * Source QA memo (2026-10-24):
 * - All game movies are the adopted main 51b032bf... evidence, not the open
 *   chip/embedded-rock PRs. Their SHA/bytes match their media-manifest.json.
 * - sword-rear.mp4 is 8.3s. Selected 2.6–6.6s shows release → exposed core.
 * - tool-source.jpg was viewed at full size: axe/inside, power=2,
 *   useSeconds=.65, reach=6. Keep the complete UI with contain.
 * - tool-program.mp4 is 12.966667s. Selected 7.8–11.8s shows the same axe
 *   opening the tree. A fresh frame at 9.2s confirmed axe contact/tree OPEN.
 * - campaign is 202.533333s. 113.2–115.6s is Slime's open interior/console,
 *   NOT an established following shot. Fresh frames at 115.0/116.8s showed
 *   the interior and then the joined message/camera moving away. Therefore
 *   this reel does not caption that interval as walking/following.
 * - 155.8–159.0s is the existing adopted plan's floor-warning interval.
 * - 178+16/30–180+16/30s shows ROLLBACK shield-open / actual contact.
 *   A fresh 179.2s frame confirmed the boss and one-hit state. Stop before
 *   the later camera moves up to the phase-two rock (visible by 182.2s).
 * - Existing footage is an actual Windows Player author replay via operation
 *   API. It is not a human live-input commentary or a completed-release claim.
 * - medicate highlight is the owner's confirmed song/vocal/MV. Its 18.8–22.0s
 *   portrait excerpt is only the dimmed final signature background; audio is
 *   the matching global 0–22.0s excerpt. No new Blender/Unity execution needed.
 * - Temporary read-only frame checks: /tmp/object-reel-program.jpg,
 *   /tmp/object-reel-companion.jpg, /tmp/object-reel-boss.jpg,
 *   /tmp/object-reel-end-116.8.jpg, /tmp/object-reel-end-182.2.jpg.
 */
const evidence='/mnt/f/dev/Object_creator-source/docs/evidence';
const sword=evidence+'/physical-disassembly/media/sword-rear.mp4';
const axe=evidence+'/programmable-tools/media/tool-program.mp4';
const sourceUi=evidence+'/programmable-tools/media/tool-source.jpg';
const campaign=evidence+'/maze-campaign/media/Dungeon-campaign-play.mp4';
const medicate='/mnt/e/Desktop/音源/medicate/MV_v3_ArtistLyrics/medicate_MV_v3_Highlight.mp4';
const f=n=>n/30;
const shot=(a,b,source,at,caption,label,mode='crop',cx=640)=>({a,b,source,at,caption,label,mode,cx});

export const objectReel={
  id:'02',
  slug:'pui-opens-the-inside',
  title:'ぷいのゲーム、剣の中まで開く。',
  duration:22,
  audio:medicate,
  audioAt:0,
  shots:[
    // Global frames 0–120. Native source frames 78–198.
    shot(f(0),f(120),sword,f(78),'剣の中、開けちゃう。','ぷいの自作ゲーム ObjectCreator / 開発中','crop',640),
    // Global frames 120–216. A real code screen, held for reading rather than cropped.
    shot(f(120),f(216),sourceUi,0,'斧の強さも、','ObjectCreator / 実際の内部コード','contain',0),
    // Global frames 216–336. Native source frames 234–354.
    shot(f(216),f(336),axe,f(234),'中から変えられる。','ObjectCreator / 改造後の実プレイ','crop',700),
    // Global frames 336–408. Native source frames 3396–3468.
    shot(f(336),f(408),campaign,f(3396),'生き物の中にも。','ObjectCreator / スライムの内部','crop',520),
    // Global frames 408–504. Native source frames 4674–4770.
    shot(f(408),f(504),campaign,f(4674),'ボス戦だって、','ObjectCreator / ROLLBACK・開発中','crop',640),
    // Global frames 504–564. Native source frames 5356–5416.
    shot(f(504),f(564),campaign,f(5356),'仕組みまで、作る。','ObjectCreator / ROLLBACK・実プレイ','crop',640),
    // Global/source frames 564–660. Renderer end mode requires a portrait source.
    shot(f(564),f(660),medicate,f(564),'ぷい、また作ってる。','次の制作も、見に来て。','end',0)
  ]
};
