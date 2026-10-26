import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT??3044);
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  let file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root+path.sep))throw Error('outside');
  const content=await fs.readFile(file);
  res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[path.extname(file)]??'application/octet-stream','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'none'; img-src 'self' data:; frame-ancestors 'none'",'Cache-Control':'no-store'});res.end(content);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Design prototypes: http://127.0.0.1:${port} · no API routes or network connections`));

