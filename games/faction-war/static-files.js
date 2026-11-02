import {readdir,stat,readFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {brotliCompress,gzip,constants} from 'node:zlib';
import {promisify} from 'node:util';
import path from 'node:path';
const br=promisify(brotliCompress),gz=promisify(gzip);
const types={'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.txt':'text/plain; charset=utf-8','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav'};
// Public files and this explicit shared-module list are the complete exposure boundary.
const shared=['continent','layout','content','adventure','equipment','skills','life','fishing','fish-catalog','asset-layout','fishing-gear','audio-library','nature','cooking-data','motion','attacks','encounters','town','season','death','environment','biomes','world-lore','quickslots','fishing-water','quest-status','pvp','foliage','idle-motion','mob-catalog'];
export async function createStaticFiles(root){
 const files=new Map(shared.map(name=>['/'+name+'.js',path.join(root,name+'.js')])),compressed=new Map();
 async function scan(dir,prefix=''){for(const entry of await readdir(dir,{withFileTypes:true})){const relative=prefix+entry.name,full=path.join(dir,entry.name);if(entry.isDirectory())await scan(full,relative+'/');else if(entry.isFile()&&types[path.extname(entry.name)])files.set('/'+relative,full);}}
 await scan(path.join(root,'public'));files.set('/',files.get('/index.html'));
 // Old image URLs remain valid for cached clients; there is only one physical file.
 for(const [url,file]of [...files])if(url.endsWith('.webp'))files.set(url.slice(0,-5)+'.png',file);
 return async(req,res,url)=>{const file=files.get(url);if(!file)return false;const info=await stat(file),ext=path.extname(file),etag='W/"'+info.size.toString(16)+'-'+Math.floor(info.mtimeMs).toString(16)+'"',audio=ext==='.mp3'||ext==='.wav',text=['.js','.css','.html','.txt'].includes(ext);
 res.setHeader('Content-Type',types[ext]);res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('ETag',etag);if(text)res.setHeader('Vary','Accept-Encoding');if(req.headers['if-none-match']===etag){res.statusCode=304;res.end();return true;}
 let start=0,end=info.size-1;if(audio){res.setHeader('Accept-Ranges','bytes');if(req.headers.range){const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);start=match?Number(match[1]):-1;end=match&&match[2]?Math.min(info.size-1,Number(match[2])):info.size-1;if(!match||start<0||start>=info.size||end<start){res.writeHead(416,{'Content-Range':'bytes */'+info.size});res.end();return true;}res.statusCode=206;res.setHeader('Content-Range','bytes '+start+'-'+end+'/'+info.size);}}
 const accepted=String(req.headers['accept-encoding']||''),encoding=text&&info.size>1024?accepted.split(',').map(x=>x.trim().split(';')).filter(x=>!x[1]||!/^q=0(?:\.0*)?$/.test(x[1].trim())).map(x=>x[0]).find(x=>x==='br')||(/\bgzip\b/.test(accepted)&&!/(?:^|,)\s*gzip\s*;\s*q=0(?:\.0*)?\s*(?:,|$)/.test(accepted)?'gzip':''):'';
 if(encoding){const key=file+':'+etag+':'+encoding;let bytes=compressed.get(key);if(!bytes){const source=await readFile(file);bytes=encoding==='br'?await br(source,{params:{[constants.BROTLI_PARAM_QUALITY]:4}}):await gz(source,{level:6});if(compressed.size>128)compressed.clear();compressed.set(key,bytes);}res.setHeader('Content-Encoding',encoding);res.setHeader('Content-Length',bytes.length);res.end(req.method==='HEAD'?undefined:bytes);return true;}
 res.setHeader('Content-Length',end-start+1);if(req.method==='HEAD'){res.end();return true;}await pipeline(createReadStream(file,{start,end}),res);return true;
 };
}
