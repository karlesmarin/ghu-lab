/* Local read-only preview with byte ranges for the general video. */
import {createServer} from 'node:http';
import {createReadStream,statSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
const root=resolve(process.argv[2]),port=Number(process.argv[3]||8766);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf','.mp4':'video/mp4','.vtt':'text/vtt; charset=utf-8','.txt':'text/plain; charset=utf-8'};
createServer((req,res)=>{try{
 let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.endsWith('/'))name+='index.html';
 const file=resolve(root,'.'+name);if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
 const stat=statSync(file);if(!stat.isFile()){res.writeHead(404).end();return;}
 let start=0,end=stat.size-1,code=200;const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
 if(range){start=Number(range[1]);end=Math.min(end,range[2]?Number(range[2]):end);if(start>end){res.writeHead(416).end();return;}code=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);}
 res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',end-start+1);res.setHeader('Cache-Control','no-cache');res.writeHead(code);
 if(req.method==='HEAD')res.end();else createReadStream(file,{start,end}).pipe(res);
 }catch{res.writeHead(404).end();}
}).listen(port,'127.0.0.1',()=>console.log(`Local preview http://127.0.0.1:${port}/`));
