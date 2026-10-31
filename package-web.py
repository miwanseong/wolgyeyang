from pathlib import Path
import hashlib,re,shutil
root=Path(__file__).resolve().parent;out=root/'dist/site';out.mkdir(parents=True,exist_ok=True)
files=[p for p in root.iterdir() if p.is_file() and p.suffix in ['.js','.mjs','.py','.md','.html','.css','.json','.txt']]+list((root/'assets').rglob('*'))+list((root/'licenses').glob('*'))
files=sorted(p for p in files if p.is_file())
version=hashlib.sha256(b''.join(p.read_bytes() for p in files if p.suffix!='.mp3')).hexdigest()[:12]
for p in files:
 dest=out/p.relative_to(root);dest.parent.mkdir(parents=True,exist_ok=True)
 if p.suffix in ['.js','.html','.css']:
  s=p.read_text();s=re.sub(r'\?v=[a-f0-9]{12}', '',s)
  s=re.sub(r"(from\s*[\"'])(\./[^\"']+\.js)([\"'])",lambda m:m[1]+m[2]+'?v='+version+m[3],s)
  s=re.sub(r"([\"'(])(assets/[^\"')]+\.(?:png|svg))([\"')])",lambda m:m[1]+m[2]+'?v='+version+m[3],s)
  if p.name=='index.html':s=re.sub(r'((?:src|href)=\")((?:app\.js|style\.css))(\")',lambda m:m[1]+m[2]+'?v='+version+m[3],s)
  dest.write_text(s)
 else:shutil.copyfile(p,dest)
(out/'.nojekyll').write_text('');shutil.copyfile(root/'_headers',out/'_headers');print('Packaged',len(files),'files; version',version)
