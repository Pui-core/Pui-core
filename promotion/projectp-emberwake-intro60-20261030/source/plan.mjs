export const duration=65;
export const root='/mnt/f/Videos/ProjectP-EMBERWAKE-Intro60-2026-10-30/intro65-v01';
export const rawRoot='/mnt/f/Videos/ProjectP-EMBERWAKE-Longform-2026-10-28/firstcut-04i/media';
export const pvRoot='/mnt/f/Videos/ProjectP-EMBERWAKE-Campfire-2026-10-29/pv-v01';
export const rawShots=[
{id:'hook',a:0,b:2,ep:'ep01-replay-controls01',from:832,to:892,head:'この灯り、道になる？',sub:'跳ぶだけでは、終わらない。',chapter:'問い',crop:[740,430,720,650]},
{id:'first-step',a:2,b:5,ep:'ep02-normal-route01',from:445,to:535,head:'まずは、足場へ。',sub:'開発中の実プレイ',chapter:'01 / 入力',crop:[640,430,720,650]},
{id:'short',a:5,b:7,ep:'ep01-replay-controls01',from:175,to:235,head:'短押し：届かない',sub:'同じ位置・同じ移動で比較',chapter:'01 / 入力',crop:[740,430,720,650]},
{id:'hold',a:7,b:9,ep:'ep01-replay-controls01',from:382,to:442,head:'長押し：届いた',sub:'変えたのは、押す長さ。',chapter:'01 / 入力',crop:[740,430,720,650]},
{id:'next-jump',a:9,b:12,ep:'ep02-normal-route01',from:535,to:625,head:'一歩ずつ、上へ。',sub:'次の足場を見て、跳ぶ。',chapter:'01 / 入力',crop:[740,430,720,650]},
{id:'approach',a:12,b:15,ep:'ep01-replay-controls01',from:610,to:700,head:'次の目的は、灯り。',sub:'跳躍の先に、別の判断がある。',chapter:'02 / 灯り',crop:[740,430,720,650]},
{id:'light',a:15,b:18,ep:'ep01-replay-controls01',from:700,to:790,head:'近づいて、点ける。',sub:'最初の灯が、点いた。',chapter:'02 / 灯り',crop:[740,430,720,650]},
{id:'switch',a:18,b:21,ep:'ep01-replay-controls01',from:790,to:880,head:'足場が、現れた。',sub:'スイッチの前後を、実画面で。',chapter:'02 / 灯り',crop:[740,430,720,650]},
{id:'new-path',a:21,b:24,ep:'ep01-replay-controls01',from:880,to:970,head:'今度は、渡れる。',sub:'見ていた場所が、進める道へ。',chapter:'02 / 灯り',crop:[600,430,720,650]},
{id:'other-stage',a:24,b:28,ep:'ep02-normal-route01',from:600,to:720,head:'場所が変われば、',sub:'段差も、足場の間隔も変わる。',chapter:'03 / 次の場所',crop:[740,430,720,650]},
{id:'other-change',a:28,b:32,ep:'ep02-normal-route01',from:720,to:840,head:'また、道をつなぐ。',sub:'別の足場で、操作と変化を確かめる。',chapter:'03 / 次の場所',crop:[740,430,720,650]},
{id:'other-ascent',a:32,b:35,ep:'ep02-normal-route01',from:840,to:930,head:'次の一歩が、見えた。',sub:'ここから先の答えは、伏せておく。',chapter:'03 / 次の場所',crop:[740,430,720,650]}
];
export const montage=[
{id:'wind-ascent',a:35,b:38,file:'wind-ascent.mp4',head:'別の街でも、上へ。',sub:'実際の別場面 / 解法・結末は非表示',focus:[960,370]},
{id:'aqueduct',a:38,b:41,file:'aqueduct-run.mp4',head:'足場の間隔を、読む。',sub:'実際の別場面',focus:[960,370]},
{id:'carry',a:41,b:44,file:'stone-flight.mp4',head:'次の足場へ、飛び移る。',sub:'実際の別場面',focus:[960,330]},
{id:'transfer',a:44,b:47,file:'wind-transfer-air.mp4',head:'渡り方を、探す。',sub:'実際の別場面',focus:[960,450]}
];
export const cues=[
{id:'01',at:.15,text:'この灯り、道になる？'},
{id:'02',at:2.6,text:'跳ぶだけ、と思ったら。'},
{id:'03',at:5.12,text:'短く押すと、届かない。'},
{id:'04',at:7.18,text:'押し続けると、届いた。'},
{id:'05',at:9.45,text:'同じ足場でも、入力で結果が変わる。'},
{id:'06',at:12.7,text:'足場をたどって、灯りのもとへ。'},
{id:'07',at:17.46,text:'最初の灯が、点いた。'},
{id:'08',at:19.85,text:'スイッチを入れると、足場が現れた。'},
{id:'09',at:22.45,text:'見えていた道を、実際に渡れる。'},
{id:'10',at:25.3,text:'次の場所では、段差も変わる。'},
{id:'11',at:29.6,text:'また灯りをつないで、先へ。'},
{id:'12',at:33.0,text:'答えは、ここまで。'},
{id:'13',at:35.4,text:'別の街では、上へ。'},
{id:'14',at:38.4,text:'足場の間隔を見て。'},
{id:'15',at:41.3,text:'次の足場へ、飛び移る。'},
{id:'16',at:44.5,text:'ひとつずつ、進める道を探す。'},
{id:'17',at:47.4,text:'エンバーウェイク、灰の灯。'},
{id:'18',at:50.1,text:'開発中のアクションゲームです。'},
{id:'19',at:53.0,text:'デモは、2026年12月の提供見込み。'},
{id:'20',at:56.8,text:'キャンプファイヤーで、制作支援を受付中。'},
{id:'21',at:60.25,text:'エンバーウェイクで検索して、内容をご確認ください。'}
];
export const endings=[
{id:'identity-walk',a:47,b:50,file:'moon-run-clean.mp4',head:'EMBERWAKE / 灰の灯',sub:'跳躍と灯りで、道をつなぐ。',focus:[960,370]},
{id:'identity-leap',a:50,b:53,file:'wind-leap-clean.mp4',head:'ぷい / ProjectP が制作中',sub:'開発中のアクションゲーム',focus:[960,400]},
{id:'demo-state',a:53,b:56,file:'jump-city-clean.mp4',head:'デモ：2026年12月見込み',sub:'本編の提供時期は、未定です。',focus:[960,370]},
{id:'support-check',a:56,b:59,assetId:'stone-flight',originalFrom:11.8,originalTo:14.8,head:'CAMPFIREで制作支援受付中',sub:'支援内容・条件を、ページで確認。',crop:[650,430,720,650]},
{id:'search-route',a:59,b:65,assetId:'wind-transfer',originalFrom:16.3,originalTo:22.3,head:'CAMPFIREで検索',sub:'EMBERWAKE / 灰の灯',crop:[650,430,720,650]}
];
