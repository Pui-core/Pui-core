import fs from 'node:fs';import {file,save} from './native.mjs';
const story=JSON.parse(fs.readFileSync('/home/pui/tmp/projectp-emberwake-longform-20261028/production/product/scripts/campaign/story.json'));
const chapters=[
 {id:'cost',title:'助けて進むと、何を失う？',question:'失敗と、物語を先へ進めることは同じ代償か',newEvidence:'最初の実喪失と約束、初回clear後のlost0→1',next:'失敗したときにも失った数は増えるか'},
 {id:'failure',title:'落ちた時、失うものは？',question:'落下/R/済話再訪でも失った記憶数が増えるか',newEvidence:'同じ出発状態の短押し実落下/長押し実着地、lost1→1と同じsave',next:'別の道なら代償を選べるか'},
 {id:'path',title:'近道で、代償は変わる？',question:'通常4足場と任意2足場はどこに着くか',newEvidence:'両方の実着地/同じ合流/同じ2話の喪失内容',next:'道を覚えられないなら、文字に頼れるか'},
 {id:'writing',title:'書いておけば、帰れる？',question:'行き先を書き残すことは、一緒に帰った記憶を保つことか',newEvidence:'3話の道/手帳/帰り道を失う実文章',next:'出来事を忘れても、面影は頼りになるか'},
 {id:'face',title:'顔を見れば、思い出せる？',question:'忘却の対象は出来事から何へ移るか',newEvidence:'雨宿り/笑顔の出来事/顔を思い描く力の相違',next:'助けたい理由まで消えたら何を頼るか'},
 {id:'purpose',title:'理由を忘れても、進める？',question:'手帳に書いた目標と、その理由は同じものか',newEvidence:'7話の過去の自分からの依頼/決意のいきさつの喪失',next:'声が聞こえれば相手を知れるか'},
 {id:'voice',title:'聞こえるのに、君は誰？',question:'聞こえる音と親しい声として感じることの違い',newEvidence:'8話の呼びかけ/応答/声の親しさ喪失と9話の時間の連なり',next:'変わる物語を、画面は何で支えるか'},
 {id:'form',title:'頼れる一歩を、どう見せる？',question:'見た目の版差と入力修正は何を変え、何を変えていないか',newEvidence:'保存24px/64px原画の実差分、画角保持、旧inputfix記録と現入力の区別',next:'同じ旅人が進む街には何の違いがあるか'},
 {id:'city',title:'街を進み、何が残る？',question:'章が変わると画面で何が違うか',newEvidence:'公園/雨の軒/額縁/鐘楼/アーチの実画面と、残す指示の短さ',next:'待つ人の名前を思い出せなくても次の一歩を選べるか'},
 {id:'next',title:'最後に、何を頼りにする？',question:'記憶と記録と今の選択はどう繋がるか',newEvidence:'9話のそれでも待たせない、13話の足元を見る/待つ人/走れ',next:'終幕を伏せ、自分なら何を残すかを問う'}
];
const units=[];let chapter='cost';
function n(ep,text,evidence,opts={}){units.push({id:'u'+String(units.length+1).padStart(3,'0'),chapter,ep,kind:'narration',text,evidence,...opts});}
function q(ep,field,index,opts={}){const s=story.stages[ep-1],raw=Array.isArray(s[field])?s[field][index]:s[field],m=raw.match(/^([^：]+)：(.*)$/);units.push({id:'u'+String(units.length+1).padStart(3,'0'),chapter,ep,kind:'quote',text:m?m[2]:raw,speaker:m?m[1]:(field==='memory'?'失った記憶':'手帳'),field,index,rawText:raw,evidence:'Pinned story field + same-episode observed capture text',...opts});}
function action(ep,text,mode,seconds,evidence){units.push({id:'u'+String(units.length+1).padStart(3,'0'),chapter,ep,kind:'action',text,mode,actionSeconds:seconds,evidence});}
n(1,'クリアしたのに、公園で過ごした午後を忘れている。助けて進むと、何を失うのでしょうか。','Actual ep1 notebook memory / first clear',{hook:true,host:true});
n(1,'失敗した時と、新しい話を終えた時。それから、違う道を選んだ時。実際の結果と手帳を比べます。','Declared tests; no future outcome invented',{testPromise:true});
q(1,'intro',0);q(1,'intro',1);
n(1,'迎えに行く相手はルミ。目的地は鐘楼です。最初の約束は、まだ当たり前のように言える言葉として始まります。','ep1 intro and notebook; editorial reading explicitly tied to dialogue');
n(1,'歩く、跳ぶ、灯を拾う。最初の話では、三つの光を拾うと空中ダッシュが使えるようになります。','Pinned campaign Main and actual first unlock');
action(1,'三つ目の光から、ダッシュ習得へ','unlock',5,'Actual initial collection/has_dash transition, not fixture');
n(1,'炉は三つ。対応する印と回路の線を見て、道を開き、次の炉へ向かいます。ここで点けているのは、先へ進むための灯です。','Actual three hearths/two switches; chips/holes absent, no carry promise');
q(1,'outro',0);q(1,'outro',1);q(1,'outro',2);
q(1,'memory');
n(1,'名前は言えても、一緒に走り回った午後は思い出せない。最初の喪失は、相手のすべてを一度に消すものではありません。','ep1 outro/memory; narrowly describes the first result');
n(1,'タイトルの、失った記憶という表示が、ゼロから一つへ。最初の午後が、この数に加わりました。','Observed ep1 title0 and title1',{mode:'counter01'});
chapter='failure';
n(1,'それなら、足場から落ちた時にも、この数は増えるのでしょうか。同じ話を開き直して、実際に試します。','Owned replay from exact completed[1] save');
n(1,'二つの試行は、同じ位置、同じ足場、同じ速度から。変えたのは、ジャンプを押している長さです。','Recorded start deltas0 / same floor and world state',{mode:'control-intro'});
action(1,'短く押すと届かず、実際に落下。出発地点へ戻ります。','short',3,'Actual short1 display frame, fall increments1 and checkpoint return');
n(1,'普通の再挑戦で最初へ戻り、もう一度。同じ場所から、今度は長く押します。','Actual ordinary R and normal story skip; no state setter',{mode:'retry'});
action(1,'上の足場に、着地できました。','held',2,'Actual held18 display frames, target landing, no fall');
n(1,'落下や再挑戦のあとも、失った記憶数は一つのまま。この収録で確かめられたのは、数がさらに増えないことです。','Actual completed[1]/lost1→1; not proof of restoration',{mode:'replay-counter'});
n(1,'同じ話のやり直しと、新しい話を終えること。その違いが、失った記憶数にどう出るかを見ます。','Limited observation and source spec; avoids Claude misreading');
n(2,'次に、物語としてまだ終えていない第二話へ進みます。進んだ後の手帳には、最初の午後とは違う喪失が記されます。','Actual fresh first completion of episode2');
q(2,'memory');
n(2,'第一話のあとが一つ、第二話のあとが二つ。失敗の回数を増やした場面ではなく、新しい話を終えた場面で増えています。','Observed ep1 and ep2 titles; no competitive timing',{mode:'counter12'});
n(2,'では、通る道を変えれば、この代償から離れられるのでしょうか。第二話には、上を通る任意の足場があります。','Actual episode2 normal-vs-branch comparison');
chapter='path';
action(2,'まずは通常の道。四つの足場を、順にたどります。','normal-route',7.5,'Normal capture actual landings839/893/944/994');
action(2,'ダッシュの枝では、上の二段へ。二枚とも、実際に着地しました。','dash-route',6,'Branch actual A846/B888/merge942; continuous796..976');
n(2,'二つの経路が着くのは、同じ足場です。違う道を通っても、ここから先は、次の灯へ向かう道につながっています。','Same merge island; HUD clock not RTA/PB');
q(2,'intro',1);q(2,'outro',1);q(2,'outro',2);
q(2,'notebook');
n(2,'二度の灯という返事は、文字に残せます。でも、その合図を決めた夜の記憶は、失ったものとして並んでいます。','ep2 notebook/memory difference; do not claim actual blink animation');
n(2,'今回の通常道と近道で、第二話の喪失内容は同じでした。道の選択が、そのまま記憶の選択になる、とは言えません。','Actual same-stage normal/branch result texts; limited to this comparison');
n(3,'行き先や合図を、文字に置いておく。それなら、帰る道も書いておけば安心なのでしょうか。次の会話が、その先を問い直します。','Bridge from ep2 notebook to ep3 outro');
chapter='writing';
q(3,'intro',1);q(3,'outro',0);q(3,'outro',1);q(3,'outro',2);
q(3,'memory');
q(3,'notebook');
n(3,'道順を書けることと、隣を歩いた時間を思い出せること。会話と手帳を並べると、二つが分かれて見えます。','Editorial reading, grounded in exact ep3 dialogue/notebook');
n(3,'手帳は、忘れる前の体験を丸ごと映し直す画面ではありません。この話の後に、何を書き残したかを確かめる場所です。','Actual current journal has latest notebook and lost-memory pages');
n(3,'実際の画面では、短い会話を送ってから出発できます。先へ進みたい時には、スキップも選べます。','Actual normal intro next/depart/skip UI, not reconstructed GUI',{mode:'story-controls'});
n(3,'読むか、先へ進むかを選べても、物語で新しい話を終えたという結果は同じ。次は、失う対象そのものの違いを見ます。','Source practice first completion; no new untested gameplay branch promise');
chapter='face';
q(4,'intro',0);q(4,'intro',1);q(4,'intro',2);
n(4,'雨の街で語られるのは、隣で待っていた時間です。派手な出来事だけが、二人の記憶として置かれているわけではありません。','Editorial reading of ep4 intro and memory, no owner intent claim');
q(4,'outro',0);q(4,'outro',1);q(4,'memory');q(4,'notebook');
n(5,'次の話では、泣いていた時間から、笑った出来事へ。失う内容が変わると、残された言葉の意味も変わります。','ep4→ep5 actual text difference');
q(5,'intro',0);q(5,'intro',1);q(5,'intro',2);q(5,'outro',0);q(5,'outro',1);q(5,'notebook');
n(5,'アッシュが思い出せなくなっても、笑ったことまで嘘にはならない、とルミは答えます。ここで残るのは、相手からの返事です。','Explicit attribution to ep5 dialogue, not claimed universal psychology');
n(6,'出来事や、その時の時間を忘れるだけなら、顔を見れば思い出せるのでしょうか。次に遠ざかるのは、面影です。','Bridge to ep6 face memory');
q(6,'intro',0);q(6,'intro',1);q(6,'outro',0);q(6,'outro',1);q(6,'memory');q(6,'notebook');
n(6,'失うのは、顔を記憶から思い描く力。旅を続ける画面には、同じ灯と、進むための足場が残っています。','Pinned ep6 memory; current texture remains, no false visual effect');
chapter='purpose';
n(7,'顔を思い出せない相手を、それでも助けに行く。理由を確かめようとしたアッシュが見つけるのは、同じ指示の書かれた手帳です。','ep7 intro, not invented feeling');
q(7,'intro',0);q(7,'intro',1);q(7,'intro',2);q(7,'outro',0);q(7,'outro',1);q(7,'memory');q(7,'notebook');
n(7,'助けに行くという目標は、文字に残っています。一方で、そう決めたいきさつは、失った記憶の側に移っています。','Exact ep7 notebook/memory contrast');
n(7,'手帳を読めば、今することは確かめられる。その指示を信じるかどうかは、記録を読んでいる現在のアッシュへ戻ってきます。','Editorial reading of past self asking present self; no owner psychology');
n(8,'目的が文字で残るなら、呼びかける声は何を残せるのでしょうか。ここからは、聞こえることと、誰の声か感じることを分けます。','Bridge to actual ep8 familiarity loss');
chapter='voice';
q(8,'intro',0);q(8,'intro',1);q(8,'intro',2);q(8,'outro',0);q(8,'outro',1);q(8,'outro',2);q(8,'memory');q(8,'notebook');
n(8,'呼びかけは届いています。けれど、それが親しい相手の声だと感じることだけが、遠ざかっていきます。','Exact memory meaning; recorded game audio Dummy, narration not game voice acting');
n(9,'顔、決意した理由、声の親しさ。失う対象が変わっても、待っている人を助けるという行き先は、手帳に残されています。','Distinct memory sequence + actual notebook text; no stat weakening');
q(9,'intro',0);q(9,'intro',2);q(9,'memory');q(9,'notebook');
n(9,'今度ほどけるのは、日々の順番やつながりです。何があったかだけでなく、それがいつのことだったかも、遠くなります。','Ep9 actual memory, reading with edited line breaks');
n(9,'書き残す文章は、ここで短くなっています。これは初めからの全文を並べた一覧ではなく、その話の後に残された記録です。','Actual journal only latest completed episode notebook/memory');
chapter='form';
n(6,'記憶の変化は、ここまで見た物語の出来事です。では、それを遊ぶ画面の見た目は、制作の中でどう変わったのでしょうか。','Explicit separation of narrative forgetfulness and actual art version changes',{host:true});
n(6,'保存されている原画を、同じ表示枠で比べます。左は二十四ピクセル、右は六十四ピクセルへ描き直した版です。','Actual retained0.8/0.9 source art; no historic gameplay claim',{mode:'art-pair'});
action(6,'歩く、上がる、頂点、落ちる、着地、ダッシュ。動く姿勢を、左右で比べてください。','art-motion',8,'Retained source frame maps/fps, not generated gameplay');
n(6,'フードの縁、顔の面、前後の脚、手元の灯。大きな形を保ちながら、元絵の中で描き分ける部分が増えています。','Actual observed pixel differences; no unrecorded owner intention',{mode:'art-detail'});
n(6,'制作記録では、キャラクターがゲーム内で占める枠と、見渡せる範囲を維持しています。原画を細かくすることと、カメラを近づけることを分けた変更です。','docs/detail64-rendering.md and commit40aebcb, not forgetfulness effect');
n(6,'この二枚は、制作中の版の違いです。物語で失っていく記憶とは別に、画面へ残す形を整えてきた記録として見ます。','Editing disclosure tied to actual comparison, not blanket AI disclaimer');
n(1,'操作にも、別の制作記録があります。旧版では、離した短い入力が大きなジャンプになったり、着地直前の入力が消えたりしていました。','docs/verification-jump-response.md historical observations',{mode:'input-history'});
n(1,'その修正では、離した入力を保持し、接地した時に一度だけ受け取るようにしています。ここでの前後は、当時の計測記録の比較です。','Historical jump-1.1 fix, not present short-vs-held test',{mode:'input-history'});
n(1,'今回の短押しと長押しの違いは、その修正前後の映像ではありません。同じ制作版の中で、押す長さを変えた時の実際の違いです。','Prevents history/current comparison conflation');
n(1,'短い跳躍も、高い跳躍も選べること。記録では、短押しをすべて高くする候補を採らず、長い滞空を避けた経緯が残っています。','Documented rejected all46px short jump candidate; no invented intent');
n(1,'思い出が失われる話と、押した入力に応える操作。制作記録と実画面を分けて見ることで、何が変わり、何が保たれたのかを確かめられます。','Editorial connection, not owner emotion or future plan');
chapter='city';
n(1,'もう一つ、進む場所の違いも見ます。同じ旅人を追っていても、周りに置かれている形や色は、章ごとに変わります。','Pinned campaign World actual chapter architecture');
n(1,'公園には柵と、空いたベンチ。大きな街の形の手前に、小さな場所の手掛かりがあります。','Actual chapter1 drawing motifs, not dynamic memory removal',{mode:'city-park'});
n(4,'雨の街では、軒や閉じた窓の形へ。雨宿りの会話があった場所と、今通っている足場を、同じ画面の中で見比べます。','Actual chapter2 motifs; editorial association with ep4 dialogue',{mode:'city-rain'});
n(7,'さらに先では、空の額縁のような形が現れます。顔を思い描けない、という言葉の後では、この余白も違って見えるかもしれません。','Actual chapter3 blank frames; explicitly editorial interpretation',{mode:'city-frames'});
n(10,'鐘楼の章では、歯車や機械の形へ変わります。これは章の違いで、記憶を一つ失うたびに背景が消えた、という変化ではありません。','Actual chapter4 drawing; no dynamic forgetfulness effect',{mode:'city-gears'});
n(13,'階段の先には、空へ開くアーチ。終幕の答えはここでは見せず、今どこへ足を置くかが読める画面を残します。','Actual chapter5 captured environment only; ending14/15 excluded',{mode:'city-arches'});
n(13,'三つの炉をつなぐという目標は共通です。場所が変わった時、これまで覚えた印を、次の道でも探せます。','Shared three-hearth/two-switch implementation');
chapter='next';
q(9,'outro',0);q(9,'outro',1);
n(9,'先へ進むほど失うものが変わり、手帳に残る言葉も変わる。道順、名前、助けるという指示が、同じものとしては残りません。','Actual quoted notebook sequence; not whole ending claim');
q(11,'outro',2);
n(11,'この言葉は、思い出せないものを相手へ尋ねています。記録に頼るだけでなく、もう一度教えてもらうという会話も、道の先に置かれています。','Editorial reading of exact ep11 question; no ending explanation');
q(13,'intro',1);q(13,'intro',2);
n(13,'誰を待たせているのかを、前と同じようには語れなくても。今は、待っている人がいることと、目の前の足元が残っています。','Ep13 intro meaning; no ep13 name-link loss reveal');
q(13,'notebook');
n(13,'もし、思い出せることが少なくなっても、何かを書き残せるなら。あなたは、どんな言葉を自分に渡しますか。','Viewer question, no outcome promise',{host:true});
n(13,'EMBERWAKE、制作版の記録です。作品の仕掛けと、その続きを、チャンネルで見届けてください。','Real project call to follow; no invented release/store/date',{host:true,closing:true});
save('source/firstcut04-units.json',{status:'VOICE_FIRST_AUTHORING_NOT_RENDERED',sourceCommit:'71584a6bd0c8852885157de71032fd9252e7a04c',version:'Production0.12.0, not claimed latest public',centralQuestion:'助けて先へ進むと、何を失い、何を頼りにするか',chapters,units,ending14or15Included:false,all15ClearedClaimed:false,formal600Complete:false});
console.log(JSON.stringify({units:units.length,characters:units.reduce((n,u)=>n+u.text.length,0),chapters:chapters.length,durationClaimed:false}));
