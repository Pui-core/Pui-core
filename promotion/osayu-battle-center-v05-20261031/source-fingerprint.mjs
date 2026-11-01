import fs from 'node:fs';import crypto from 'node:crypto';import path from 'node:path';import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
export function sourceFingerprint(){const files=fs.readdirSync(dir).filter(n=>(n.endsWith('.mjs')&&!n.endsWith('.test.mjs'))||n==='windows-job-runner.cs').sort();const manifest=Object.fromEntries(files.map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,n))).digest('hex')]));return {manifest,sha256:crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex')};}
