import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(process.argv[2]||fileURLToPath(new URL('..',import.meta.url)));
const expressions=[
 {expression:'"0" + 1',value:'0'+1,expected:'01'},
 {expression:'0 + 1',value:0+1,expected:1},
 {expression:'"5" - 1',value:'5'-1,expected:4},
 {expression:'"5" + 1 - 1',value:'5'+1-1,expected:50},
 {expression:'Number("0") + 1',value:Number('0')+1,expected:1}
].map(x=>({...x,type:typeof x.value,pass:Object.is(x.value,x.expected)}));
const input=[{name:' ぷい  ',amount:'１２，０００'},{name:' あお  ',amount:'５，０００'},{name:' みず  ',amount:''}];
function normalize(row){const name=row.name.trim(),amountText=row.amount.normalize('NFKC').replaceAll(',','').trim();
 if(amountText==='')return {original:row,name,amount:null,status:'要確認',reason:'金額が空欄'};
 if(!/^\d+$/.test(amountText))return {original:row,name,amount:null,status:'要確認',reason:'金額の形式が不正'};
 return {original:row,name,amount:Number(amountText),status:'OK'};
}
const output=input.map(normalize);
if(expressions.some(x=>!x.pass)||output[0].amount!==12000||output[1].amount!==5000||output[2].amount!==null||output[2].status!=='要確認')throw Error('Educational content differs from execution.');
const report={node:process.version,expressions,input,output,sourceReferences:['https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Addition','https://pui-wobbfet.top/'],illustration:'Web/編集画面は自主制作の図解。実在クライアントの実績・性能値ではない。',fiction:'05は架空の制作あるある短編。'};
fs.mkdirSync(path.join(root,'qa'),{recursive:true});fs.writeFileSync(path.join(root,'qa/content-proof.json'),JSON.stringify(report,null,2)+'\n');console.log('Verified '+expressions.length+' JavaScript expressions and 3 normalization rows.');
