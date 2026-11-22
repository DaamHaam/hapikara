// Round-trip the packed production payload and check its single-file contract.
import { readFileSync } from 'node:fs';
import { inflateRawSync, gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../../index.html',import.meta.url),'utf8');
const start=html.indexOf('const s=`')+9,end=html.indexOf('`,n=',start);
assert(start>8&&end>start,'packed payload missing');
const n=Number(html.slice(end+4).match(/^\d+/)[0]),s=html.slice(start,end),data=new Uint8Array(n);
for(let i=0,j=0,a=0,k=0;j<n;i++){assert(i<s.length,'truncated payload');a=a<<7|s.charCodeAt(i)&127;k+=7;if(k>7){k-=8;data[j++]=a>>k;a&=(1<<k)-1;}}
const code=inflateRawSync(data).toString('utf8');
new Function(code); // Parse, never execute the browser program.
assert(!/<(?:script|img|audio|video|link|iframe)\b[^>]*(?:src|href)\s*=/i.test(html),'external resource in HTML');
assert(!code.includes('window.__shot')&&!code.includes('/__qa'),'development tools leaked into production');
assert(readFileSync(new URL('../../LICENSE',import.meta.url),'utf8').includes('Maksymilian'),'upstream copyright missing');
console.log(`Bundle OK: ${Buffer.byteLength(html)} bytes; gzip ${gzipSync(html,{level:9}).byteLength} bytes; standalone, valid JS, no dev tools, MIT attribution present.`);
